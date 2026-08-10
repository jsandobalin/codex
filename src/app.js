import { currentClaims, onAuthChange, signIn, signOut, signUp } from './auth.js';
import { clearOperatorDecisions, readOperatorDecisions, writeOperatorDecisions } from './data/operator-decision-store.js';
import { loadRadarFixture } from './data/radar-fixture-client.js';
import { loadRadarSignals } from './data/radar-supabase-client.js';
import { currentPath, isProtectedRoute, navigate, routeFor } from './router.js';
import { supabase } from './supabase-client.js';
import { bindDashboard, moduleMarkup } from './ui/radar-dashboard.js';

const app = document.querySelector('#app');
let claims = null;
let authError = null;
let dashboard = { status: 'idle', source: null, data: null, selectedId: null, decisions: readOperatorDecisions(), refreshing: false };
let dashboardRequest = 0;
const dashboardPaths = new Set(['/demo', '/radar', '/signals', '/sources', '/reader-model', '/operator']);

function dashboardSource(path) {
  return path === '/radar' ? 'remote' : 'fixture';
}

function message(text, type = 'info') {
  return `<p class="message ${type}">${text}</p>`;
}

function layout(content) {
  return `<header class="site-header"><a href="#/" class="brand">◉ AI Radar</a><nav aria-label="Principal"><a href="#/">Inicio</a><a href="#/demo">Demo</a>${claims ? '<a href="#/radar">Radar privado</a>' : '<a href="#/login">Acceder</a>'}</nav></header><section class="content">${content}</section>`;
}

function loginPage() {
  if (authError) return layout(`<p class="eyebrow">Acceso privado</p><h1>Configura Supabase para acceder</h1>${message(authError, 'error')}<p>La demo local permanece disponible sin autenticación.</p><a class="button" href="#/demo">Abrir demo</a>`);
  return layout(`<p class="eyebrow">Acceso privado</p><h1>Accede a AI Radar</h1><p>Usa tu cuenta para ver señales privadas.</p><form id="auth-form" class="auth-form"><label>Correo <input name="email" type="email" autocomplete="email" required /></label><label>Contraseña <input name="password" type="password" autocomplete="current-password" minlength="6" required /></label><div class="actions"><button type="submit">Iniciar sesión</button><button type="button" id="signup" class="secondary-button">Crear cuenta</button></div><div id="form-message"></div></form>`);
}

function homePage() {
  return layout(`<p class="eyebrow">AI Radar · inteligencia operativa</p><h1>Señales de IA, con contexto.</h1><p>Prioriza novedades, comprueba evidencias y decide qué vale la pena probar.</p><div class="actions"><a class="button" href="#/demo">Ver referencia funcional</a>${claims ? '<a class="button secondary-button" href="#/radar">Abrir mi radar</a>' : ''}</div>`);
}

function dashboardPage(path) {
  const moduleName = path === '/radar' ? 'dashboard' : path.slice(1);
  const source = dashboardSource(path);
  const links = [
    ['#/demo', 'dashboard', '⌁', 'Radar'],
    ['#/signals', 'signals', '⌁', 'Señales'],
    ['#/sources', 'sources', '▣', 'Fuentes'],
    ['#/reader-model', 'reader-model', '◌', 'Modelo lector'],
    ['#/operator', 'operator', '◇', 'Modo operador']
  ];
  const sourceLabel = source === 'remote' ? 'Supabase protegido' : 'Demo local';
  return `<div class="dashboard-shell"><aside class="radar-sidebar"><a class="radar-brand" href="#/"><span>◎</span> AI Radar</a><nav aria-label="Secciones del radar">${links.map(([href, name, icon, label]) => `<a class="${name === moduleName ? 'active' : ''}" href="${href}">${icon} <span>${label}</span></a>`).join('')}</nav><div class="sidebar-status"><span class="status-dot"></span><strong>${sourceLabel}</strong><small>Decisiones: este navegador</small></div></aside><main class="radar-main">${moduleMarkup(moduleName, dashboard)}</main></div>`;
}

function forcedDashboardState() {
  const state = new URLSearchParams(window.location.search).get('radarState');
  return ['loading', 'empty', 'error', 'unauthorized'].includes(state) ? state : null;
}

function render() {
  const path = currentPath();
  document.title = dashboardPaths.has(path) ? `AI Radar · ${routeFor(path).title}` : 'AI Radar';
  if (isProtectedRoute(path) && !claims) {
    navigate('/login');
    return;
  }
  app.innerHTML = path === '/login' ? loginPage() : dashboardPaths.has(path) ? dashboardPage(path) : homePage();
  bindPageEvents();
  if (dashboardPaths.has(path) && dashboard.source !== dashboardSource(path)) loadDashboard();
}

async function loadDashboard() {
  const source = dashboardSource(currentPath());
  const state = forcedDashboardState();
  if (state) {
    dashboard = state === 'error'
      ? { ...dashboard, source, status: 'error', message: 'El estado de prueba simula un fallo recuperable del origen configurado.' }
      : { ...dashboard, source, status: state };
    render();
    return;
  }
  const request = ++dashboardRequest;
  const hasContent = dashboard.status === 'ready' && dashboard.source === source;
  dashboard = hasContent
    ? { ...dashboard, source, refreshing: true }
    : { ...dashboard, source, status: 'loading', data: null, selectedId: null, refreshing: false };
  render();
  try {
    const data = source === 'remote' ? await loadRadarSignals({ client: supabase }) : await loadRadarFixture();
    if (request !== dashboardRequest) return;
    dashboard = data.signals.length === 0
      ? { status: 'empty', source, data: null, selectedId: null, decisions: dashboard.decisions, refreshing: false }
      : { status: 'ready', source, data, selectedId: dashboard.selectedId || data.signals[0].id, decisions: dashboard.decisions, refreshing: false };
  } catch (error) {
    if (request !== dashboardRequest) return;
    dashboard = error.status === 401 || error.status === 403
      ? { ...dashboard, source, status: 'unauthorized', refreshing: false }
      : { ...dashboard, source, status: 'error', message: error.message, refreshing: false };
  }
  render();
}

function bindPageEvents() {
  bindDashboard({
    root: app,
    onSelect: (selectedId) => { dashboard = { ...dashboard, selectedId }; render(); },
    onRefresh: loadDashboard,
    onDecision: (id, decision) => {
      const decisions = { ...dashboard.decisions, [id]: decision };
      writeOperatorDecisions(decisions);
      dashboard = { ...dashboard, decisions };
      render();
    },
    onResetDecisions: () => {
      clearOperatorDecisions();
      dashboard = { ...dashboard, decisions: {} };
      render();
    }
  });
  document.querySelector('#auth-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formMessage = document.querySelector('#form-message');
    try { await signIn(form.get('email'), form.get('password')); formMessage.innerHTML = message('Sesión iniciada.', 'success'); } catch (error) { formMessage.innerHTML = message(error.message, 'error'); }
  });
  document.querySelector('#signup')?.addEventListener('click', async () => {
    const form = new FormData(document.querySelector('#auth-form'));
    const formMessage = document.querySelector('#form-message');
    try { const result = await signUp(form.get('email'), form.get('password')); formMessage.innerHTML = message(result.session ? 'Cuenta creada y sesión iniciada.' : 'Revisa tu correo para confirmar la cuenta.', 'success'); } catch (error) { formMessage.innerHTML = message(error.message, 'error'); }
  });
  document.querySelector('#signout')?.addEventListener('click', signOut);
}

async function initialize() {
  try {
    claims = await currentClaims();
    onAuthChange(async () => { claims = await currentClaims(); render(); });
  } catch (error) {
    authError = error.message;
  }
  render();
}

window.addEventListener('hashchange', render);
initialize();
