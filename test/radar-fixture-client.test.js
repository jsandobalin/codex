import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRadarFixture, parseRadarFixture } from '../src/data/radar-fixture-client.js';

const signal = {
  id: 'signal-1',
  title: 'Señal válida',
  source: { name: 'Fuente', url: 'https://example.test/source', publishedAt: '2026-08-10' },
  evidence: 'Evidencia verificable.',
  impact: { level: 'high', summary: 'Impacto alto.' },
  action: 'Probar el cambio.',
  status: { label: 'launched', summary: 'Disponible.' }
};

test('accepts a declared local dashboard fixture', () => {
  const fixture = { meta: { source: 'local-fixture', contract: 'ai-radar-dashboard@1' }, signals: [signal] };
  assert.equal(parseRadarFixture(fixture), fixture);
});

test('rejects a fixture with an incomplete signal', () => {
  assert.throws(() => parseRadarFixture({
    meta: { source: 'local-fixture', contract: 'ai-radar-dashboard@1' },
    signals: [{ ...signal, evidence: '' }]
  }), /incompleta/);
});

test('surfaces fixture fetch failures', async () => {
  await assert.rejects(
    loadRadarFixture({ fetchImpl: async () => new Response('', { status: 503 }) }),
    /503/
  );
});
