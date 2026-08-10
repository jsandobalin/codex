import { withSupabase } from 'npm:@supabase/server@1.4.1';
import Ajv from 'npm:ajv@8.17.1/dist/2020.js';
import addFormats from 'npm:ajv-formats@3.0.1';

const schema = {
  type: 'object', additionalProperties: false,
  required: ['contract', 'date', 'generatedAt', 'query', 'signals'],
  properties: {
    contract: { type: 'object', additionalProperties: false, required: ['name', 'version'], properties: { name: { const: 'ai-radar-daily-signals' }, version: { const: '1.0.0' } } },
    date: { type: 'string', format: 'date' }, generatedAt: { type: 'string', format: 'date-time' },
    query: { type: 'object', additionalProperties: false, required: ['topic', 'requestedCount', 'language', 'criteria'], properties: { topic: { type: 'string', minLength: 1 }, requestedCount: { type: 'integer', minimum: 1 }, language: { type: 'string', minLength: 2 }, criteria: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } } } },
    signals: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'title', 'source', 'evidence', 'impact', 'action', 'status'], properties: { id: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+$' }, title: { type: 'string', minLength: 1 }, source: { type: 'object', additionalProperties: false, required: ['name', 'url', 'publishedAt'], properties: { name: { type: 'string', minLength: 1 }, url: { type: 'string', format: 'uri' }, publishedAt: { type: 'string', format: 'date' } } }, evidence: { type: 'string', minLength: 1 }, impact: { type: 'object', additionalProperties: false, required: ['level', 'summary'], properties: { level: { enum: ['low', 'medium', 'medium-high', 'high'] }, summary: { type: 'string', minLength: 1 } } }, action: { type: 'string', minLength: 1 }, status: { type: 'object', additionalProperties: false, required: ['label', 'summary'], properties: { label: { type: 'string', minLength: 1 }, summary: { type: 'string', minLength: 1 } } } } } }
  }
};
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default {
  fetch: withSupabase({ auth: 'secret:airadar-writer' }, async (request, ctx) => {
    if (request.method !== 'POST') return Response.json({ message: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
    let snapshot: any;
    try { snapshot = await request.json(); } catch { return Response.json({ message: 'Invalid JSON' }, { status: 400 }); }
    if (!validate(snapshot)) return Response.json({ message: 'Invalid snapshot', validationErrors: validate.errors }, { status: 400 });

    const snapshotHash = await sha256(stableStringify(snapshot));
    const sourceCount = new Set(snapshot.signals.map((signal: any) => signal.source.url)).size;
    const { data: existing, error: existingError } = await ctx.supabaseAdmin.from('ingestion_runs').select('id, result, source_count, signal_count, validation_count').eq('snapshot_hash', snapshotHash).maybeSingle();
    if (existingError) return Response.json({ message: 'Could not read ingestion run' }, { status: 500 });
    if (existing?.result === 'accepted') return Response.json({ runId: existing.id, sourcesUpserted: existing.source_count, signalsUpserted: existing.signal_count, validationsCreated: existing.validation_count, idempotent: true });

    const { data: run, error: runError } = existing
      ? { data: existing, error: null }
      : await ctx.supabaseAdmin.from('ingestion_runs').insert({ snapshot_date: snapshot.date, query: snapshot.query, snapshot_hash: snapshotHash, result: 'processing', source_count: sourceCount, signal_count: snapshot.signals.length, validation_count: snapshot.signals.length }).select('id').single();
    if (runError || !run) return Response.json({ message: 'Could not create ingestion run' }, { status: 500 });

    for (const signal of snapshot.signals) {
      const { data: source, error: sourceError } = await ctx.supabaseAdmin.from('sources').upsert({ name: signal.source.name, url: signal.source.url, published_at: signal.source.publishedAt, updated_at: new Date().toISOString() }, { onConflict: 'url' }).select('id').single();
      if (sourceError || !source) return Response.json({ message: 'Could not upsert source' }, { status: 500 });
      const { error: signalError } = await ctx.supabaseAdmin.from('signals').upsert({ external_id: signal.id, source_id: source.id, ingestion_run_id: run.id, title: signal.title, evidence: signal.evidence, impact_level: signal.impact.level, impact_summary: signal.impact.summary, action: signal.action, status_label: signal.status.label, status_summary: signal.status.summary, updated_at: new Date().toISOString() }, { onConflict: 'external_id' });
      if (signalError) return Response.json({ message: 'Could not upsert signal' }, { status: 500 });
    }
    const { error: validationError } = await ctx.supabaseAdmin.from('signal_validations').upsert(snapshot.signals.map((signal: any) => ({ ingestion_run_id: run.id, signal_external_id: signal.id, is_valid: true, errors: [] })), { onConflict: 'ingestion_run_id,signal_external_id' });
    if (validationError) return Response.json({ message: 'Could not create validations' }, { status: 500 });
    const { error: completeError } = await ctx.supabaseAdmin.from('ingestion_runs').update({ result: 'accepted' }).eq('id', run.id);
    if (completeError) return Response.json({ message: 'Could not complete ingestion run' }, { status: 500 });
    return Response.json({ runId: run.id, sourcesUpserted: sourceCount, signalsUpserted: snapshot.signals.length, validationsCreated: snapshot.signals.length, idempotent: false }, { status: 201 });
  })
};
