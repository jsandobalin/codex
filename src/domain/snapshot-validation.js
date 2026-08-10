import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFile } from 'node:fs/promises';

const schemaUrl = new URL('../../snapshots/contracts/ai-radar-daily-signals.schema.json', import.meta.url);
const schema = JSON.parse(await readFile(schemaUrl, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export function validateSnapshot(snapshot) {
  const valid = validate(snapshot);

  return {
    valid,
    errors: valid ? [] : validate.errors.map((error) => ({
      instancePath: error.instancePath || '/',
      keyword: error.keyword,
      message: error.message || 'invalid value',
      params: error.params
    }))
  };
}

export function parseAndValidateSnapshot(text) {
  let snapshot;

  try {
    snapshot = JSON.parse(text);
  } catch (error) {
    return {
      valid: false,
      errors: [{
        instancePath: '/',
        keyword: 'parse',
        message: error.message,
        params: {}
      }]
    };
  }

  return { snapshot, ...validateSnapshot(snapshot) };
}
