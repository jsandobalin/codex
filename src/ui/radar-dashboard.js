const impactScore = { high: 92, 'medium-high': 68, medium: 48, low: 28 };

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function labelForImpact(level) {
  return ({ high: 'Alto', 'medium-high': 'Medio-alto', medium: 'Medio', low: 'Bajo' })[level] || 'Por revisar';
}

function categoryFor(signal) {
  if (signal.title.includes('seguridad') || signal.title.includes('intrusión')) return 'Seguridad';
  if (signal.title.includes('Image') || signal.title.includes('Video')) return 'Producto';
  if (signal.title.includes('salud')) return 'Política';
  return 'Infraestructura';
}

function confidenceFor(index) {
  return [96, 93, 89, 84, 80][index] || 76;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00Z`));
}

function sourceBadge(sourceName) {
  return `<span class="source-badge" aria-hidden="true">${escapeHtml(sourceName.slice(0, 2).toUpperCase())}</span>`;
}

function trendPath(index) {
  return [
    'M0 29 L11 26 L19 28 L30 17 L40 20 L52 7 L62 10 L72 2',
    'M0 29 L11 24 L20 21 L30 25 L41 15 L51 20 L62 8 L72 4',
    'M0 12 L12 20 L23 11 L34 25 L45 17 L56 26 L65 18 L72 29',
    'M0 10 L10 14 L20 9 L30 17 L41 14 L51 23 L62 20 L72 28',
    'M0 18 L11 13 L22 20 L33 16 L43 27 L55 21 L64 25 L72 31'
  ][index] || 'M0 25 L72 10';
}

function metricBars(value) {
  return `<span class="metric-bars" aria-label="Confianza ${value}%"><i style="width:${value}%"></i></span>`;
}

function signalRow(signal, index, selectedId) {
  const selected = signal.id === selectedId;
  const score = impactScore[signal.impact.level] || 40;
  return `
    <button class="signal-row ${selected ? 'is-selected' : ''}" type="button" data-signal-id="${escapeHtml(signal.id)}" aria-pressed="${selected}">
      <span class="signal-rank">#${index + 1}</span>
      <span class="signal-title"><strong>${escapeHtml(signal.title)}</strong><small>${escapeHtml(signal.impact.summary)}</small></span>
      <span class="impact-score impact-${escapeHtml(signal.impact.level)}"><b>${score}</b><small>${labelForImpact(signal.impact.level)}</small></span>
      <span class="confidence"><b>${confidenceFor(index)}%</b>${metricBars(confidenceFor(index))}</span>
      <span class="signal-category">${categoryFor(signal)}</span>
      <span class="signal-source">${sourceBadge(signal.source.name)}<small>${escapeHtml(signal.source.name)}</small></span>
      <time datetime="${escapeHtml(signal.source.publishedAt)}">${formatDate(signal.source.publishedAt)}</time>
      <svg class="trend ${signal.impact.level === 'high' ? 'trend-high' : ''}" viewBox="0 0 72 34" aria-label="Tendencia estimada"><path d="${trendPath(index)}"></path></svg>
    </button>`;
}

function operatorItem(signal, index, decision) {
  const decisionText = decision ? `Decisión local: ${decision}` : 'Pendiente de decisión';
  return `
    <li class="operator-item">
      <span class="operator-rank">${index + 1}</span>
      <span><strong>${escapeHtml(signal.title)}</strong><small>${escapeHtml(categoryFor(signal))} · impacto ${labelForImpact(signal.impact.level)} · ${decisionText}</small></span>
      <span class="operator-actions" aria-label="Acciones para ${escapeHtml(signal.title)}">
        <button type="button" data-decision="Aprobada" data-id="${escapeHtml(signal.id)}">Aprobar</button>
        <button type="button" data-decision="En observación" data-id="${escapeHtml(signal.id)}">Observar</button>
        <button type="button" data-decision="Descartada" data-id="${escapeHtml(signal.id)}">Descartar</button>
      </span>
    </li>`;
}

function dashboardContent(data, selectedId, decisions, refreshing) {
  const selected = data.signals.find((signal) => signal.id === selectedId) || data.signals[0];
  const sources = [...new Map(data.signals.map((signal) => [signal.source.name, signal.source])).values()];
  return `
    <section class="dashboard-header">
      <div><p class="eyebrow">Inteligencia operativa</p><h1>Ranking de señales</h1><p>Qué cambió, qué importa y qué hacer después.</p></div>
      <div class="dashboard-tools"><span class="demo-badge">Demo local · fixture</span><button id="refresh-dashboard" type="button" ${refreshing ? 'disabled' : ''}>${refreshing ? 'Actualizando…' : 'Actualizar'}</button></div>
    </section>
    <p class="sr-status" role="status">${refreshing ? 'Actualizando señales locales. Se conserva el ranking actual.' : 'Datos de demostración locales cargados.'}</p>
    <section class="radar-grid">
      <section class="panel ranking-panel" aria-labelledby="ranking-title">
        <div class="panel-heading"><div><span class="eyebrow">Última señalización</span><h2 id="ranking-title">Señales priorizadas</h2></div><span class="panel-note">${data.signals.length} hallazgos</span></div>
        <div class="ranking-labels" aria-hidden="true"><span>Rango</span><span>Señal</span><span>Impacto</span><span>Confianza</span><span>Tipo</span><span>Fuente</span><span>Fecha</span><span>Tendencia</span></div>
        <div class="signal-list">${data.signals.map((signal, index) => signalRow(signal, index, selected.id)).join('')}</div>
      </section>
      <aside class="evidence-column" aria-label="Detalle de la señal seleccionada">
        <section class="panel evidence-panel">
          <div class="panel-heading"><div><span class="eyebrow">Trazabilidad</span><h2>Evidencia</h2></div><span class="count-badge">3</span></div>
          <h3>${escapeHtml(selected.title)}</h3>
          <p>${escapeHtml(selected.evidence)}</p>
          <ul class="evidence-list"><li>Fuente primaria identificada y enlazable.</li><li>Impacto: ${escapeHtml(selected.impact.summary)}</li><li>Estado: ${escapeHtml(selected.status.summary)}</li></ul>
        </section>
        <section class="panel source-panel"><div class="panel-heading"><div><span class="eyebrow">Procedencia</span><h2>Fuentes</h2></div><span class="count-badge">${sources.length}</span></div><ul class="source-list">${sources.map((source) => `<li>${sourceBadge(source.name)}<span><strong>${escapeHtml(source.name)}</strong><small>Fuente enlazada · ${formatDate(source.publishedAt)}</small></span><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer" aria-label="Abrir fuente ${escapeHtml(source.name)}">↗</a></li>`).join('')}</ul></section>
        <section class="panel reader-panel"><div class="panel-heading"><div><span class="eyebrow">Interpretación</span><h2>Modelo lector</h2></div><span class="relevance">Alta</span></div><p>La señal afecta coste, seguridad o capacidad operativa de productos con IA.</p><div class="reader-tags"><span>Impacto ${labelForImpact(selected.impact.level)}</span><span>Audiencia técnica</span><span>Horizonte cercano</span></div></section>
      </aside>
    </section>
    <section class="analytics-grid" aria-label="Métricas del radar">
      <section class="panel metric-panel"><div class="panel-heading"><div><span class="eyebrow">Últimas 24 h</span><h2>Velocidad de señales</h2></div><b class="metric-value">82</b></div><div class="line-chart" aria-label="La velocidad sube de 28 a 82 nuevas señales"><svg viewBox="0 0 520 150" preserveAspectRatio="none"><path class="chart-area" d="M0 140 L0 111 L45 100 L90 109 L135 82 L180 91 L225 65 L270 72 L315 52 L360 58 L405 30 L450 40 L500 9 L520 14 L520 140 Z"></path><path class="chart-line" d="M0 111 L45 100 L90 109 L135 82 L180 91 L225 65 L270 72 L315 52 L360 58 L405 30 L450 40 L500 9 L520 14"></path></svg></div><span class="chart-caption">Nuevas señales · comparación con media de siete días</span></section>
      <section class="panel metric-panel credibility-panel"><div class="panel-heading"><div><span class="eyebrow">Calidad de insumos</span><h2>Credibilidad de fuentes</h2></div></div><div class="donut" aria-label="76 por ciento de fuentes con credibilidad alta o muy alta"><b>76<small>%</small></b></div><div class="credibility-key"><span><i class="dot high"></i>Muy alta 28%</span><span><i class="dot medium-high"></i>Alta 48%</span><span><i class="dot medium"></i>Media 20%</span><span><i class="dot low"></i>Baja 4%</span></div></section>
      <section class="panel operator-panel"><div class="panel-heading"><div><span class="eyebrow">Cola humana</span><h2>Modo operador</h2></div><span class="local-state">Guardado local</span></div><ol>${data.signals.slice(0, 3).map((signal, index) => operatorItem(signal, index, decisions[signal.id])).join('')}</ol></section>
    </section>`;
}

function selectedSignal(data, selectedId) {
  return data.signals.find((signal) => signal.id === selectedId) || data.signals[0];
}

function signalCard(signal, index, selectedId) {
  const isSelected = signal.id === selectedId;
  return `<button class="signal-card ${isSelected ? 'is-selected' : ''}" type="button" data-signal-id="${escapeHtml(signal.id)}" aria-pressed="${isSelected}"><span>#${index + 1}</span><strong>${escapeHtml(signal.title)}</strong><small>${escapeHtml(signal.evidence)}</small><i>${labelForImpact(signal.impact.level)} · ${formatDate(signal.source.publishedAt)}</i></button>`;
}

function selectedSignalSummary(signal) {
  return `<section class="panel selected-summary"><span class="eyebrow">Detalle seleccionado</span><h2>${escapeHtml(signal.title)}</h2><p>${escapeHtml(signal.impact.summary)}</p><dl><div><dt>Evidencia</dt><dd>${escapeHtml(signal.evidence)}</dd></div><div><dt>Acción recomendada</dt><dd>${escapeHtml(signal.action)}</dd></div><div><dt>Estado</dt><dd>${escapeHtml(signal.status.summary)}</dd></div></dl></section>`;
}

function signalsContent(data, selectedId) {
  const selected = selectedSignal(data, selectedId);
  return `<section class="module-heading"><p class="eyebrow">Exploración</p><h1>Señales</h1><p>Selecciona una señal para revisar su evidencia, impacto y acción recomendada.</p></section><section class="signals-view"><div class="signal-cards">${data.signals.map((signal, index) => signalCard(signal, index, selected.id)).join('')}</div>${selectedSignalSummary(selected)}</section>`;
}

function sourcesContent(data) {
  const sources = [...new Map(data.signals.map((signal) => [signal.source.name, signal.source])).values()];
  return `<section class="module-heading"><p class="eyebrow">Trazabilidad</p><h1>Fuentes</h1><p>Fuentes presentes en el fixture de demostración y su última publicación referenciada.</p></section><section class="source-cards">${sources.map((source) => `<article class="panel source-card">${sourceBadge(source.name)}<div><h2>${escapeHtml(source.name)}</h2><p>Referencia publicada el <time datetime="${escapeHtml(source.publishedAt)}">${formatDate(source.publishedAt)}</time>.</p><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Abrir fuente ↗</a></div></article>`).join('')}</section>`;
}

function readerContent(data, selectedId) {
  const selected = selectedSignal(data, selectedId);
  return `<section class="module-heading"><p class="eyebrow">Interpretación asistida</p><h1>Modelo lector</h1><p>La explicación se actualiza al seleccionar una señal desde el ranking o la lista.</p></section><section class="reader-view"><section class="panel reader-explanation"><span class="eyebrow">Señal actual</span><h2>${escapeHtml(selected.title)}</h2><p>${escapeHtml(selected.impact.summary)}</p><div class="reader-tags"><span>Impacto ${labelForImpact(selected.impact.level)}</span><span>${categoryFor(selected)}</span><span>Confianza verificable</span></div><h3>Qué mirar ahora</h3><p>${escapeHtml(selected.action)}</p></section><section class="panel reader-selection"><h2>Cambiar señal</h2><div>${data.signals.map((signal, index) => `<button type="button" data-signal-id="${escapeHtml(signal.id)}" class="text-select ${signal.id === selected.id ? 'is-selected' : ''}"><b>#${index + 1}</b>${escapeHtml(signal.title)}</button>`).join('')}</div></section></section>`;
}

function operatorContent(data, decisions) {
  const decidedCount = Object.keys(decisions).length;
  return `<section class="module-heading module-heading-actions"><div><p class="eyebrow">Decisión humana</p><h1>Modo operador</h1><p>Las decisiones se guardan solo en este navegador para la demo. No se envían a Supabase.</p></div><button id="reset-decisions" type="button" class="secondary-button" ${decidedCount ? '' : 'disabled'}>Restablecer decisiones locales</button></section><section class="panel operator-panel operator-page"><div class="panel-heading"><div><span class="eyebrow">Cola de revisión</span><h2>${decidedCount} de ${data.signals.length} decisiones guardadas</h2></div><span class="local-state">Almacenamiento local</span></div><ol>${data.signals.map((signal, index) => operatorItem(signal, index, decisions[signal.id])).join('')}</ol></section>`;
}

export function moduleMarkup(moduleName, state) {
  if (state.status !== 'ready') return dashboardMarkup(state);
  if (moduleName === 'signals') return signalsContent(state.data, state.selectedId);
  if (moduleName === 'sources') return sourcesContent(state.data);
  if (moduleName === 'reader-model') return readerContent(state.data, state.selectedId);
  if (moduleName === 'operator') return operatorContent(state.data, state.decisions);
  return dashboardMarkup(state);
}

export function dashboardMarkup(state) {
  if (state.status === 'idle' || state.status === 'loading') return `<section class="dashboard-state"><div class="loading-orb"></div><h1>Preparando el radar</h1><p>Cargando el origen de datos local declarado.</p></section>`;
  if (state.status === 'empty') return `<section class="dashboard-state"><p class="eyebrow">Demo local · fixture</p><h1>No hay señales para este corte</h1><p>El contrato se cargó correctamente, pero no contiene señales disponibles.</p><button type="button" id="retry-dashboard">Reintentar</button></section>`;
  if (state.status === 'error') return `<section class="dashboard-state"><p class="eyebrow">Origen local no disponible</p><h1>No se pudo cargar el radar</h1><p>${escapeHtml(state.message)}</p><button type="button" id="retry-dashboard">Reintentar</button></section>`;
  if (state.status === 'unauthorized') return `<section class="dashboard-state"><p class="eyebrow">Acceso restringido</p><h1>No tienes acceso a este radar</h1><p>Inicia sesión con una cuenta autorizada para ver señales privadas.</p><a class="button" href="#/login">Acceder</a></section>`;
  return dashboardContent(state.data, state.selectedId, state.decisions, state.refreshing);
}

export function bindDashboard({ root, onSelect, onRefresh, onDecision, onResetDecisions }) {
  root.querySelectorAll('[data-signal-id]').forEach((button) => button.addEventListener('click', () => onSelect(button.dataset.signalId)));
  root.querySelector('#refresh-dashboard, #retry-dashboard')?.addEventListener('click', onRefresh);
  root.querySelectorAll('[data-decision]').forEach((button) => button.addEventListener('click', () => onDecision(button.dataset.id, button.dataset.decision)));
  root.querySelector('#reset-decisions')?.addEventListener('click', onResetDecisions);
}
