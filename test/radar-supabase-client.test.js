import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRadarSignals, parseRadarSignals } from '../src/data/radar-supabase-client.js';

const signal = {
  id: 'signal-1',
  title: 'Señal remota válida',
  source: { name: 'Fuente', url: 'https://example.test/source', publishedAt: '2026-08-10' },
  evidence: 'Evidencia verificable.',
  impact: { level: 'high', summary: 'Impacto alto.' },
  action: 'Probar el cambio.',
  status: { label: 'launched', summary: 'Disponible.' }
};

test('accepts a complete remote signals response', () => {
  const result = parseRadarSignals({ signals: [signal] });
  assert.equal(result.meta.source, 'supabase-function');
  assert.deepEqual(result.signals, [signal]);
});

test('rejects incomplete remote signals responses', () => {
  assert.throws(
    () => parseRadarSignals({ signals: [{ ...signal, impact: { level: 'unknown', summary: 'Invalid' } }] }),
    /incompletas/
  );
});

test('loads remote signals through the protected function', async () => {
  let invocation;
  const result = await loadRadarSignals({
    client: {
      functions: {
        invoke: async (name, options) => {
          invocation = { name, options };
          return { data: { signals: [signal] }, error: null };
        }
      }
    }
  });

  assert.equal(invocation.name, 'read-signals');
  assert.equal(invocation.options.method, 'GET');
  assert.deepEqual(result.signals, [signal]);
});

test('preserves authorization failures from the remote function', async () => {
  await assert.rejects(
    loadRadarSignals({
      client: { functions: { invoke: async () => ({ data: null, error: { context: { status: 401 } } }) } }
    }),
    (error) => error.status === 401 && error.message.includes('401')
  );
});

test('fails clearly when the Supabase client is unavailable', async () => {
  await assert.rejects(
    loadRadarSignals(),
    (error) => error.status === 503 && error.message.includes('configuración de Supabase')
  );
});
