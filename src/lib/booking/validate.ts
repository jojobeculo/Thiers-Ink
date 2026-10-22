/**
 * Règles du formulaire de demande de rendez-vous, partagées par le navigateur
 * (retour immédiat) et le serveur (seule validation qui fait foi).
 */

export const LIMITS = {
  name: 80,
  email: 120,
  phone: 20,
  zone: 80,
  style: 80,
  messageMin: 20,
  message: 3000,
  fileBytes: 5 * 1024 * 1024,
} as const;

export const REQUEST_TYPES = {
  tatouage: 'Tatouage',
  piercing: 'Piercing',
  autre: 'Autre demande',
} as const;

export const SIZES = {
  'moins-5': 'Moins de 5 cm',
  '5-10': 'De 5 à 10 cm',
  '10-20': 'De 10 à 20 cm',
  'plus-20': 'Plus de 20 cm',
  inconnue: 'Je ne sais pas encore',
} as const;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const;

export type RequestType = keyof typeof REQUEST_TYPES;
export type SizeKey = keyof typeof SIZES;

export interface BookingFields {
  nom: string;
  email: string;
  telephone: string;
  type: string;
  zone: string;
  taille: string;
  style: string;
  message: string;
}

export type FieldName = keyof BookingFields | 'reference';
export type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d\s.-]+$/;

/** Supprime les caractères de contrôle (hors retours à la ligne) et les espaces superflus. */
export function clean(value: unknown, multiline = false): string {
  if (typeof value !== 'string') return '';
  const pattern = multiline ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.replace(pattern, '').trim();
}

export function isRequestType(value: string): value is RequestType {
  return Object.hasOwn(REQUEST_TYPES, value);
}

export function isSize(value: string): value is SizeKey {
  return Object.hasOwn(SIZES, value);
}

export function validateFields(f: BookingFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!f.nom) errors.nom = 'Indiquez votre nom.';
  else if (f.nom.length > LIMITS.name) errors.nom = `Le nom ne doit pas dépasser ${LIMITS.name} caractères.`;

  if (!f.email) errors.email = 'Indiquez votre adresse e-mail.';
  else if (f.email.length > LIMITS.email || !EMAIL.test(f.email))
    errors.email = "L'adresse e-mail n'est pas valide (exemple : nom@domaine.fr).";

  if (f.telephone) {
    const digits = f.telephone.replace(/\D/g, '');
    if (f.telephone.length > LIMITS.phone || !PHONE.test(f.telephone) || digits.length < 9)
      errors.telephone = "Le numéro de téléphone n'est pas valide (exemple : 06 12 34 56 78).";
  }

  if (!isRequestType(f.type)) errors.type = 'Choisissez le type de demande.';

  if (f.zone.length > LIMITS.zone) errors.zone = `La zone ne doit pas dépasser ${LIMITS.zone} caractères.`;
  if (f.taille && !isSize(f.taille)) errors.taille = 'Choisissez une taille dans la liste.';
  if (f.style.length > LIMITS.style) errors.style = `Le style ne doit pas dépasser ${LIMITS.style} caractères.`;

  if (!f.message) errors.message = 'Décrivez votre projet en quelques phrases.';
  else if (f.message.length < LIMITS.messageMin)
    errors.message = `Votre description doit comporter au moins ${LIMITS.messageMin} caractères.`;
  else if (f.message.length > LIMITS.message)
    errors.message = `Votre description ne doit pas dépasser ${LIMITS.message} caractères.`;

  return errors;
}

/** Contrôle déclaratif du fichier (taille, type annoncé). Le serveur vérifie aussi la signature binaire. */
export function validateFileMeta(size: number, type: string): string | undefined {
  if (size > LIMITS.fileBytes) return "L'image ne doit pas dépasser 5 Mo.";
  if (type && !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type))
    return "Format non accepté : choisissez une image JPG, PNG, WebP ou HEIC.";
  return undefined;
}
