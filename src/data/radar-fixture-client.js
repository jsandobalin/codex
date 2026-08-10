const fixtureUrl = '/fixtures/radar-dashboard-signals.json';

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSignal(value) {
  return value && isString(value.id) && isString(value.title)
    && isString(value.source?.name) && isString(value.source?.url)
    && isString(value.source?.publishedAt) && isString(value.evidence)
    && isString(value.impact?.level) && isString(value.impact?.summary)
    && isString(value.action) && isString(value.status?.label)
    && isString(value.status?.summary);
}

export function parseRadarFixture(payload) {
  if (!payload || payload.meta?.source !== 'local-fixture'
    || payload.meta?.contract !== 'ai-radar-dashboard@1' || !Array.isArray(payload.signals)) {
    throw new Error('El fixture del radar no cumple el contrato ai-radar-dashboard@1.');
  }

  if (!payload.signals.every(isSignal)) {
    throw new Error('El fixture del radar contiene una señal incompleta.');
  }

  return payload;
}

export async function loadRadarFixture({ signal, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(fixtureUrl, {
    headers: { Accept: 'application/json' },
    signal
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el fixture del radar (${response.status}).`);
  }

  return parseRadarFixture(await response.json());
}
