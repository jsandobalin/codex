const storageKey = 'ai-radar-demo-operator-decisions@1';
const allowedDecisions = new Set(['Aprobada', 'En observación', 'Descartada']);

function hasStorageShape(storage) {
  return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
}

export function sanitizeDecisions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(Object.entries(value)
    .filter(([id, decision]) => typeof id === 'string' && allowedDecisions.has(decision)));
}

export function readOperatorDecisions(storage = window.localStorage) {
  if (!hasStorageShape(storage)) return {};

  try {
    return sanitizeDecisions(JSON.parse(storage.getItem(storageKey) || '{}'));
  } catch {
    return {};
  }
}

export function writeOperatorDecisions(decisions, storage = window.localStorage) {
  if (!hasStorageShape(storage)) return false;

  try {
    storage.setItem(storageKey, JSON.stringify(sanitizeDecisions(decisions)));
    return true;
  } catch {
    return false;
  }
}

export function clearOperatorDecisions(storage = window.localStorage) {
  if (!storage || typeof storage.removeItem !== 'function') return false;

  try {
    storage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}
