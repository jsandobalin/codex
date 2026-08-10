import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardMarkup } from '../src/ui/radar-dashboard.js';

const signal = {
  id: 'signal-1',
  title: 'Señal remota',
  source: { name: 'Fuente', url: 'https://example.test/source', publishedAt: '2026-08-10' },
  evidence: 'Evidencia verificable.',
  impact: { level: 'high', summary: 'Impacto alto.' },
  action: 'Probar el cambio.',
  status: { label: 'launched', summary: 'Disponible.' }
};

test('identifies a protected Supabase data source in the ready dashboard', () => {
  const markup = dashboardMarkup({
    status: 'ready', source: 'remote', data: { signals: [signal] }, selectedId: signal.id, decisions: {}, refreshing: false
  });

  assert.match(markup, /Datos remotos · Supabase/);
  assert.match(markup, /Señales remotas cargadas desde Supabase/);
  assert.doesNotMatch(markup, /Demo local · fixture/);
});

test('identifies remote origin failures without implying fixture fallback', () => {
  const markup = dashboardMarkup({ status: 'error', source: 'remote', message: 'No disponible' });

  assert.match(markup, /Origen remoto no disponible/);
  assert.doesNotMatch(markup, /Demo local · fixture/);
});
