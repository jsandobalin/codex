import { readFile } from 'node:fs/promises';
import { parseAndValidateSnapshot } from './snapshot-validation.js';

export function getSaveSignalsConfig(environment = process.env) {
  const url = environment.AI_RADAR_SAVE_SIGNALS_URL;
  const key = environment.AI_RADAR_SAVE_SIGNALS_KEY;

  if (!url || !key) {
    const missing = [!url && 'AI_RADAR_SAVE_SIGNALS_URL', !key && 'AI_RADAR_SAVE_SIGNALS_KEY'].filter(Boolean);
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }

  return { url, key };
}

export async function saveSignals({ snapshotPath, environment = process.env, fetchImpl = fetch }) {
  const parsed = parseAndValidateSnapshot(await readFile(snapshotPath, 'utf8'));
  if (!parsed.valid) {
    const error = new Error('Snapshot validation failed.');
    error.validationErrors = parsed.errors;
    throw error;
  }

  const { url, key } = getSaveSignalsConfig(environment);
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      apikey: key,
      'content-type': 'application/json'
    },
    body: JSON.stringify(parsed.snapshot)
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || `save-signals returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body;
}
