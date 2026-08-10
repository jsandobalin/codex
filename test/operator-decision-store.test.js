import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearOperatorDecisions,
  readOperatorDecisions,
  sanitizeDecisions,
  writeOperatorDecisions
} from '../src/data/operator-decision-store.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test('keeps only valid local operator decisions', () => {
  assert.deepEqual(sanitizeDecisions({ one: 'Aprobada', two: 'unsafe', three: 3 }), { one: 'Aprobada' });
});

test('stores and clears decisions in the supplied browser storage', () => {
  const storage = memoryStorage();
  assert.equal(writeOperatorDecisions({ signal: 'En observación' }, storage), true);
  assert.deepEqual(readOperatorDecisions(storage), { signal: 'En observación' });
  assert.equal(clearOperatorDecisions(storage), true);
  assert.deepEqual(readOperatorDecisions(storage), {});
});
