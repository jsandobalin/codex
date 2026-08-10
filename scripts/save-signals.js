#!/usr/bin/env node
import { saveSignals } from '../src/domain/save-signals-client.js';

const args = process.argv.slice(2);
const index = args.indexOf('--snapshot');
const snapshotPath = index >= 0 ? args[index + 1] : undefined;

if (!snapshotPath) {
  console.error(JSON.stringify({ error: 'missing_snapshot', message: 'Use --snapshot <path>.' }));
  process.exitCode = 1;
} else {
  try {
    const result = await saveSignals({ snapshotPath });
    console.log(JSON.stringify({
      runId: result.runId,
      sourcesUpserted: result.sourcesUpserted,
      signalsUpserted: result.signalsUpserted,
      validationsCreated: result.validationsCreated
    }));
  } catch (error) {
    console.error(JSON.stringify({ error: 'save_failed', status: error.status, message: error.message }));
    process.exitCode = 1;
  }
}
