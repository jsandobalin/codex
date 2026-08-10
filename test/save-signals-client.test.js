import test from 'node:test';
import assert from 'node:assert/strict';
import { saveSignals } from '../src/domain/save-signals-client.js';

const snapshotPath = new URL('../snapshots/daily/2026-08-09-ai-signals.json', import.meta.url);
const secret = 'sb_secret_test_value';
const environment = {
  AI_RADAR_SAVE_SIGNALS_URL: 'https://example.test/functions/v1/save-signals',
  AI_RADAR_SAVE_SIGNALS_KEY: secret
};

test('fails before network calls when configuration is missing', async () => {
  await assert.rejects(
    saveSignals({ snapshotPath, environment: {}, fetchImpl: () => assert.fail('fetch must not run') }),
    /AI_RADAR_SAVE_SIGNALS_URL, AI_RADAR_SAVE_SIGNALS_KEY/
  );
});

test('posts a valid snapshot and returns the server summary', async () => {
  let request;
  const result = await saveSignals({
    snapshotPath,
    environment,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ runId: 'run-1', sourcesUpserted: 5, signalsUpserted: 5, validationsCreated: 5 }), { status: 201 });
    }
  });
  assert.equal(result.runId, 'run-1');
  assert.equal(request.options.headers.apikey, secret);
  assert.equal(request.options.headers['content-type'], 'application/json');
});

test('surfaces HTTP errors without including the secret', async () => {
  await assert.rejects(
    saveSignals({ snapshotPath, environment, fetchImpl: async () => new Response(JSON.stringify({ message: 'Denied' }), { status: 403 }) }),
    (error) => error.status === 403 && error.message === 'Denied' && !error.message.includes(secret)
  );
});
