/**
 * Limitation de débit en mémoire : 5 demandes par adresse IP sur 15 minutes.
 * Les adresses ne sont jamais écrites sur disque et sont oubliées après la fenêtre.
 * shortcut: mémoire propre au processus Node ; à remplacer par un stockage partagé
 * (Redis, base de données) si le site tourne sur plusieurs instances.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, times] of hits) {
    const recent = times.filter((t) => now - t < WINDOW_MS);
    if (recent.length) hits.set(key, recent);
    else hits.delete(key);
  }
}, WINDOW_MS);
sweep.unref?.();

/** Enregistre une tentative ; renvoie `false` si la limite est atteinte. */
export function allowRequest(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
