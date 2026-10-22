import type { APIRoute } from 'astro';
import { allowRequest } from '../../lib/booking/rate-limit';
import { detectImage } from '../../lib/booking/image-signature';
import { MailNotConfiguredError, sendBookingMail } from '../../lib/booking/mailer';
import {
  LIMITS,
  REQUEST_TYPES,
  SIZES,
  clean,
  isRequestType,
  isSize,
  validateFields,
  validateFileMeta,
  type BookingFields,
  type FieldErrors,
} from '../../lib/booking/validate';
import { site, withBase } from '../../config/site';

export const prerender = false;

type Outcome = 'envoyee' | 'invalide' | 'limite' | 'indisponible' | 'erreur';

const MESSAGES: Record<Outcome, string> = {
  envoyee: 'Votre demande a bien été envoyée au salon.',
  invalide: 'Certains champs sont à corriger.',
  limite: 'Trop de demandes ont été envoyées depuis votre connexion. Réessayez dans quelques minutes.',
  indisponible: `L'envoi en ligne est momentanément indisponible. Appelez le salon au ${site.phone.display}.`,
  erreur: `La demande n'a pas pu être envoyée. Réessayez ou appelez le salon au ${site.phone.display}.`,
};

const STATUS: Record<Outcome, number> = {
  envoyee: 200,
  invalide: 422,
  limite: 429,
  indisponible: 503,
  erreur: 502,
};

/** Durée minimale de remplissage : en dessous, l'envoi est très probablement automatisé. */
const MIN_FILL_MS = 3000;
const MAX_BODY_BYTES = LIMITS.fileBytes + 512 * 1024;

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;

  const respond = (outcome: Outcome, errors?: FieldErrors) => {
    if (!wantsJson) return redirect(withBase(`/demande?statut=${outcome}`), 303);
    return new Response(JSON.stringify({ ok: outcome === 'envoyee', outcome, message: MESSAGES[outcome], errors }), {
      status: STATUS[outcome],
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  };

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return respond('invalide', { reference: "L'image ne doit pas dépasser 5 Mo." });

  if (!allowRequest(clientAddress || 'inconnue')) return respond('limite');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond('erreur');
  }

  // Champ piège invisible et délai de remplissage : rejet sans détail.
  const honeypot = clean(form.get('site_web'));
  const startedAt = Number(form.get('t'));
  if (honeypot || (startedAt && Date.now() - startedAt < MIN_FILL_MS)) return respond('erreur');

  const fields: BookingFields = {
    nom: clean(form.get('nom')),
    email: clean(form.get('email')),
    telephone: clean(form.get('telephone')),
    type: clean(form.get('type')),
    zone: clean(form.get('zone')),
    taille: clean(form.get('taille')),
    style: clean(form.get('style')),
    message: clean(form.get('message'), true),
  };
  const errors = validateFields(fields);

  let attachment: { filename: string; content: Buffer; contentType: string } | undefined;
  const file = form.get('reference');
  if (file instanceof File && file.size > 0) {
    const metaError = validateFileMeta(file.size, file.type);
    if (metaError) errors.reference = metaError;
    else {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const kind = detectImage(bytes);
      if (!kind) errors.reference = "Le fichier n'est pas une image JPG, PNG, WebP ou HEIC valide.";
      else
        attachment = {
          filename: `reference-${Date.now()}.${kind.ext}`,
          content: Buffer.from(bytes),
          contentType: kind.mime,
        };
    }
  }

  if (Object.keys(errors).length > 0) return respond('invalide', errors);

  const typeLabel = isRequestType(fields.type) ? REQUEST_TYPES[fields.type] : fields.type;
  const sizeLabel = isSize(fields.taille) ? SIZES[fields.taille] : '';
  const singleLine = (value: string) => value.replace(/\s+/g, ' ');
  const lines = [
    `Nouvelle demande de rendez-vous envoyée depuis le site ${site.name}.`,
    '',
    `Type de demande : ${typeLabel}`,
    `Nom : ${fields.nom}`,
    `E-mail : ${fields.email}`,
    `Téléphone : ${fields.telephone || 'non indiqué'}`,
    fields.zone ? `Zone du corps : ${fields.zone}` : null,
    sizeLabel ? `Taille approximative : ${sizeLabel}` : null,
    fields.style ? `Style souhaité : ${fields.style}` : null,
    '',
    'Projet :',
    fields.message,
    '',
    `Image de référence : ${attachment ? 'jointe à ce message' : 'aucune'}`,
    '',
    'Pour répondre, utilisez simplement « Répondre » : la réponse est adressée au demandeur.',
  ].filter((line) => line !== null);

  try {
    await sendBookingMail({
      subject: singleLine(`Demande de rendez-vous — ${typeLabel} — ${fields.nom}`),
      text: lines.join('\n'),
      replyTo: { name: singleLine(fields.nom), address: fields.email },
      attachment,
    });
  } catch (error) {
    if (error instanceof MailNotConfiguredError) {
      console.error('[rendez-vous] ' + error.message);
      return respond('indisponible');
    }
    console.error('[rendez-vous] échec de l’envoi :', error instanceof Error ? error.message : error);
    return respond('erreur');
  }

  return respond('envoyee');
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { allow: 'POST' } });
