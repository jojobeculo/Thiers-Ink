/**
 * Formulaire de rendez-vous : validation immédiate (mêmes règles que le serveur),
 * champs conditionnels, envoi asynchrone et retour honnête du résultat.
 * Sans JavaScript, le formulaire s'envoie normalement et la page /demande affiche l'issue.
 */
import { site } from '../config/site';
import {
  LIMITS,
  clean,
  validateFields,
  validateFileMeta,
  type BookingFields,
  type FieldErrors,
  type FieldName,
} from '../lib/booking/validate';

const form = document.querySelector<HTMLFormElement>('[data-booking-form]');

if (form) {
  form.noValidate = true;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]')!;
  const started = form.querySelector<HTMLInputElement>('[data-started]');
  const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
  const fileName = form.querySelector<HTMLElement>('[data-file-name]');
  const message = form.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
  const count = form.querySelector<HTMLElement>('[data-count]');
  let attempted = false;

  if (started) started.value = String(Date.now());

  const read = (): BookingFields => {
    const data = new FormData(form);
    return {
      nom: clean(data.get('nom')),
      email: clean(data.get('email')),
      telephone: clean(data.get('telephone')),
      type: clean(data.get('type')),
      zone: clean(data.get('zone')),
      taille: clean(data.get('taille')),
      style: clean(data.get('style')),
      message: clean(data.get('message'), true),
    };
  };

  const fileError = (): string | undefined => {
    const file = fileInput?.files?.[0];
    return file ? validateFileMeta(file.size, file.type) : undefined;
  };

  const collect = (): FieldErrors => {
    const errors = validateFields(read());
    const fe = fileError();
    if (fe) errors.reference = fe;
    return errors;
  };

  const controlsFor = (name: FieldName) => form.querySelectorAll<HTMLElement>(`[name="${name}"]`);

  const showErrors = (errors: FieldErrors, only?: FieldName) => {
    form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((el) => {
      const name = el.dataset.errorFor as FieldName;
      if (only && name !== only) return;
      const msg = errors[name] ?? '';
      el.textContent = msg;
      controlsFor(name).forEach((control) => {
        if (msg) control.setAttribute('aria-invalid', 'true');
        else control.removeAttribute('aria-invalid');
      });
    });
  };

  const setStatus = (text: string, tone: 'info' | 'error' | 'success' = 'info', focus = false) => {
    status.textContent = text;
    status.dataset.tone = tone;
    if (focus) status.focus();
  };

  /* Champs conditionnels selon le type de demande ------------------------- */
  const conditionals = form.querySelectorAll<HTMLElement>('[data-show-for]');
  const syncConditionals = () => {
    const type = (form.querySelector<HTMLInputElement>('input[name="type"]:checked')?.value ?? '').trim();
    conditionals.forEach((el) => {
      const show = type !== '' && (el.dataset.showFor ?? '').split(' ').includes(type);
      el.hidden = !show;
      // les champs masqués ne sont ni validés ni envoyés
      el.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((c) => (c.disabled = !show));
    });
  };
  form.querySelectorAll('input[name="type"]').forEach((r) =>
    r.addEventListener('change', () => {
      syncConditionals();
      if (attempted) showErrors(collect(), 'type');
    }),
  );
  syncConditionals();

  /* Compteur et fichier ---------------------------------------------------- */
  const updateCount = () => {
    if (!message || !count) return;
    count.textContent = `${message.value.length} / ${LIMITS.message}`;
  };
  message?.addEventListener('input', updateCount);
  updateCount();

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (fileName) fileName.textContent = file ? file.name : 'Aucun fichier choisi';
    showErrors(collect(), 'reference');
  });

  /* Validation au fil de la saisie, après un premier passage ---------------- */
  form.addEventListener('focusout', (e) => {
    const target = e.target as HTMLInputElement;
    const name = target.name as FieldName;
    if (!name || name === 'reference' || name === 'site_web') return;
    if (attempted || target.value) showErrors(collect(), name);
  });
  form.addEventListener('input', (e) => {
    const name = (e.target as HTMLInputElement).name as FieldName;
    if (attempted && name) showErrors(collect(), name);
  });

  /* Envoi ------------------------------------------------------------------- */
  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    attempted = true;
    const errors = collect();
    showErrors(errors);
    const invalid = Object.keys(errors) as FieldName[];
    if (invalid.length) {
      setStatus(
        invalid.length === 1 ? 'Un champ est à corriger.' : `${invalid.length} champs sont à corriger.`,
        'error',
      );
      controlsFor(invalid[0])[0]?.focus();
      return;
    }

    sending = true;
    submit.setAttribute('aria-busy', 'true');
    submitLabel.textContent = 'Envoi en cours…';
    setStatus('Envoi de votre demande en cours…');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { accept: 'application/json' },
        credentials: 'same-origin',
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        errors?: FieldErrors;
      } | null;

      if (response.ok && result?.ok) {
        form.reset();
        syncConditionals();
        updateCount();
        if (fileName) fileName.textContent = 'Aucun fichier choisi';
        attempted = false;
        showErrors({});
        setStatus(result.message ?? 'Votre demande a bien été envoyée au salon.', 'success', true);
        if (started) started.value = String(Date.now());
        return;
      }
      if (result?.errors) {
        showErrors(result.errors);
        const first = Object.keys(result.errors)[0] as FieldName | undefined;
        if (first) controlsFor(first)[0]?.focus();
      }
      setStatus(
        result?.message ?? `La demande n'a pas pu être envoyée. Appelez le salon au ${site.phone.display}.`,
        'error',
        !result?.errors,
      );
    } catch {
      setStatus(
        `Connexion impossible : la demande n'a pas été envoyée. Vérifiez votre connexion ou appelez le salon au ${site.phone.display}.`,
        'error',
        true,
      );
    } finally {
      sending = false;
      submit.removeAttribute('aria-busy');
      submitLabel.textContent = 'Envoyer la demande';
    }
  });
}
