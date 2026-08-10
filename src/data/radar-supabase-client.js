const impactLevels = new Set(['low', 'medium', 'medium-high', 'high']);

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSignal(value) {
  return value && isString(value.id) && isString(value.title)
    && isString(value.source?.name) && isString(value.source?.url)
    && isString(value.source?.publishedAt) && isString(value.evidence)
    && impactLevels.has(value.impact?.level) && isString(value.impact?.summary)
    && isString(value.action) && isString(value.status?.label)
    && isString(value.status?.summary);
}

function requestError(error) {
  const status = error?.context?.status;
  const message = status
    ? `No se pudieron cargar las señales remotas (${status}).`
    : 'No se pudieron cargar las señales remotas.';
  const result = new Error(message);
  result.status = status;
  return result;
}

export function parseRadarSignals(payload) {
  if (!payload || !Array.isArray(payload.signals) || !payload.signals.every(isSignal)) {
    throw new Error('La respuesta remota del radar contiene señales incompletas.');
  }

  return {
    meta: { source: 'supabase-function', contract: 'ai-radar-dashboard@1' },
    signals: payload.signals
  };
}

export async function loadRadarSignals({ client } = {}) {
  if (!client) {
    const error = new Error('Falta la configuración de Supabase para cargar señales remotas.');
    error.status = 503;
    throw error;
  }

  const { data, error } = await client.functions.invoke('read-signals', { method: 'GET' });
  if (error) throw requestError(error);
  return parseRadarSignals(data);
}
