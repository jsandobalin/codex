import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseConfig } from '../src/config.js';

test('returns null when runtime Supabase configuration is absent', () => {
  assert.equal(getSupabaseConfig(undefined), null);
});

test('returns declared publishable runtime configuration', () => {
  const config = {
    supabaseUrl: 'https://example.supabase.co',
    supabasePublishableKey: 'sb_publishable_example'
  };

  assert.equal(getSupabaseConfig(config), config);
});
