import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseAndValidateSnapshot } from '../src/domain/snapshot-validation.js';

const fixturePath = new URL('../snapshots/daily/2026-08-09-ai-signals.json', import.meta.url);
const validFixture = await readFile(fixturePath, 'utf8');

test('accepts a compatible daily snapshot', () => {
  const result = parseAndValidateSnapshot(validFixture);
  assert.equal(result.valid, true);
  assert.equal(result.snapshot.signals.length, 5);
});

test('rejects malformed JSON', () => {
  const result = parseAndValidateSnapshot('{not json');
  assert.equal(result.valid, false);
  assert.equal(result.errors[0].keyword, 'parse');
});

test('rejects an incompatible contract version', () => {
  const snapshot = JSON.parse(validFixture);
  snapshot.contract.version = '2.0.0';
  const result = parseAndValidateSnapshot(JSON.stringify(snapshot));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.instancePath === '/contract/version'));
});

test('rejects a signal without required fields', () => {
  const snapshot = JSON.parse(validFixture);
  delete snapshot.signals[0].action;
  const result = parseAndValidateSnapshot(JSON.stringify(snapshot));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === 'required'));
});
