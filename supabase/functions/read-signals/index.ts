import { corsHeaders } from 'npm:@supabase/supabase-js@2.95.3/cors';
import { createAdminClient, verifyCredentials } from 'npm:@supabase/server@1.4.1/core';

const responseHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

type SourceRow = {
  name: string;
  url: string;
  published_at: string;
};

type SignalRow = {
  action: string;
  evidence: string;
  external_id: string;
  impact_level: 'low' | 'medium' | 'medium-high' | 'high';
  impact_summary: string;
  sources: SourceRow | SourceRow[] | null;
  status_label: string;
  status_summary: string;
  title: string;
};

function response(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { headers: responseHeaders, status });
}

function sourceFor(row: SignalRow) {
  return Array.isArray(row.sources) ? row.sources[0] : row.sources;
}

function bearerToken(request: Request) {
  const authorization = request.headers.get('Authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders });
  if (request.method !== 'GET') return response({ message: 'Method not allowed' }, 405);

  const token = bearerToken(request);
  if (!token) return response({ message: 'Unauthorized' }, 401);

  const { data: auth, error: authError } = await verifyCredentials(
    { token, apikey: request.headers.get('apikey') },
    { auth: 'user' }
  );
  if (authError || !auth?.userClaims?.sub) return response({ message: 'Unauthorized' }, 401);

  const client = createAdminClient();
  const { data, error } = await client
    .from('signals')
    .select('external_id, title, evidence, impact_level, impact_summary, action, status_label, status_summary, sources!inner(name, url, published_at)')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) return response({ message: 'Could not read signals' }, 500);

  const signals = ((data ?? []) as SignalRow[]).map((row) => {
    const source = sourceFor(row);
    if (!source) throw new Error('A signal does not have a source.');
    return {
      id: row.external_id,
      title: row.title,
      source: { name: source.name, url: source.url, publishedAt: source.published_at },
      evidence: row.evidence,
      impact: { level: row.impact_level, summary: row.impact_summary },
      action: row.action,
      status: { label: row.status_label, summary: row.status_summary }
    };
  });

  return response({ signals });
});
