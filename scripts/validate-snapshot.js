#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { parseAndValidateSnapshot } from '../src/domain/snapshot-validation.js';

function snapshotPathFromArgs(args) {
  const index = args.indexOf('--snapshot');
  return index >= 0 ? args[index + 1] : undefined;
}

const snapshotPath = snapshotPathFromArgs(process.argv.slice(2));
if (!snapshotPath) {
  console.error(JSON.stringify({ error: 'missing_snapshot', message: 'Use --snapshot <path>.' }));
  process.exitCode = 1;
} else {
  try {
    const result = parseAndValidateSnapshot(await readFile(snapshotPath, 'utf8'));
    if (!result.valid) {
      console.error(JSON.stringify({ error: 'invalid_snapshot', snapshot: snapshotPath, validationErrors: result.errors }));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({ valid: true, snapshot: snapshotPath, signals: result.snapshot.signals.length }));
    }
  } catch (error) {
    console.error(JSON.stringify({ error: 'read_failed', snapshot: snapshotPath, message: error.message }));
    process.exitCode = 1;
  }
}
