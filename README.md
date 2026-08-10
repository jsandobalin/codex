# AI Radar

AI Radar es el proyecto del curso avanzado de Codex.

El objetivo del producto es organizar noticias, herramientas, papers, repos y lanzamientos de IA para convertirlos en senales accionables para builders: que paso, por que importa, que tan confiable es y que vale la pena probar.

Estado inicial: definicion de producto, stack objetivo y reglas iniciales. La implementacion se construye por capas durante el curso con Codex.

## Problema

El ritmo de la inteligencia artificial genera demasiado ruido:

- lanzamientos repetidos en varias fuentes,
- repos que parecen importantes pero no tienen adopcion,
- demos sin documentacion suficiente,
- papers sin ejemplo practico,
- herramientas con impacto real mezcladas con marketing.

AI Radar debe ayudar a separar ruido de senales utiles.

## Producto Objetivo

Al final del curso, AI Radar debe poder:

- recopilar novedades de IA desde fuentes seleccionadas,
- normalizar noticias, repos, papers y productos,
- detectar duplicados y noticias parecidas,
- agrupar senales por tema,
- rankear por novedad, impacto, evidencia y accionabilidad,
- generar guias practicas para decidir que probar,
- exponer resultados en un dashboard,
- guardar trazas de decisiones y validaciones,
- desplegarse con infraestructura controlada.

## Estado Inicial

El starter contiene:

- `README.md`
- `.gitignore`

La primera clase usa este estado para mostrar como `AGENTS.md` cambia la forma en que Codex entiende un proyecto antes de escribir codigo.

## Stack Objetivo

El stack debe mantenerse simple para que el foco del curso sea Codex, no el framework.

- Frontend: HTML, CSS y JavaScript.
- Dominio: modulos JavaScript reutilizables.
- CLI: `airadar` para comandos internos del proyecto.
- Automatizacion local: scripts Node.js.
- Proyecto agent-friendly: Dekk cuando existan comandos que deban usar humanos y agentes.
- API: Vercel Functions cuando hagan falta endpoints.
- Datos locales: fixtures y snapshots antes de conectar servicios externos.
- Base de datos: Supabase cuando el contrato local ya funcione.
- QA: `node:test` para dominio y Playwright cuando exista interfaz visual.
- Demo final: video programatico con la evidencia del proyecto.

## Reglas Iniciales Para Codex

Antes de implementar, Codex debe distinguir:

- vision del producto,
- estado actual del repositorio,
- decisiones tecnicas tomadas,
- decisiones pendientes,
- limites de seguridad.

Codex no debe inventar archivos, comandos, servicios ni integraciones como si ya existieran.

## Consultar señales guardadas

Los snapshots diarios locales se consultan con `scripts/list-signals.py`. El comando emite
un objeto JSON en salida estándar y los errores también como JSON, en salida de error.

```bash
python3 scripts/list-signals.py --day 2026-08-09 --count 3 --order impact-desc
```

Opciones disponibles:

- `--day YYYY-MM-DD`: día del snapshot; por defecto, el día local actual.
- `--count N` o `-n N`: máximo de señales devueltas; por defecto, 5.
- `--order`: `snapshot`, `published-desc`, `published-asc`, `impact-desc`,
  `impact-asc`, `title-asc` o `title-desc`.

## Autenticación y rutas protegidas

El starter incluye una interfaz web estática con Supabase Auth. La ruta
`#/radar` está protegida: antes de renderizarla, la aplicación valida el token
con `supabase.auth.getClaims()`. Una sesión obtenida solo desde almacenamiento
local no se utiliza para autorizar el acceso.

Para conectarla a un proyecto de Supabase:

1. En el proyecto, habilita el proveedor **Email** en Authentication > Providers
   y configura las URL de redirección que utilizará tu despliegue.
2. Copia `public/runtime-config.example.js` a `public/runtime-config.js`.
3. Añade la URL del proyecto y una **publishable key** (`sb_publishable_...`).
   Este archivo está ignorado por Git. Nunca uses claves `service_role` ni
   `sb_secret_...` en el navegador.
4. Sirve el directorio por HTTP y abre `index.html`. Por ejemplo:
   `python3 -m http.server 8000`, y visita `http://localhost:8000`.

La protección del navegador controla la navegación de la interfaz. Cuando se
añadan tablas para señales privadas, también deberán tener RLS y políticas de
propiedad en Supabase; una ruta protegida por sí sola no protege datos.

## Persistencia interna de señales

El entorno de desarrollo previsto es el proyecto de Supabase `AI Radar Development`
(`zvctajbzulhulycokjwk`, `us-east-2`). El cambio de nombre, migración, creación de
la secret key y despliegue de la función son operaciones remotas que se realizan
solo con aprobación explícita.

La escritura de snapshots es exclusivamente server-side. Las tablas en `public`
tienen RLS activado y no conceden acceso a `anon` ni `authenticated`; el navegador
no puede leerlas ni escribirlas. La única vía interna es la Edge Function
`save-signals`, autenticada con una secret key dedicada llamada `airadar-writer`.

1. Copia `.env.example` a `.env` y proporciona `AI_RADAR_SAVE_SIGNALS_URL` y
   `AI_RADAR_SAVE_SIGNALS_KEY` desde un almacén de secretos local o CI.
2. Valida el contrato antes de una llamada de red:

```bash
npm run validate:snapshot -- --snapshot snapshots/daily/2026-08-09-ai-signals.json
```

3. Guarda mediante la función, nunca contra Postgres directamente:

```bash
npm run save:signals -- --snapshot snapshots/daily/2026-08-09-ai-signals.json
```

El comando devuelve `runId`, `sourcesUpserted`, `signalsUpserted` y
`validationsCreated`. Si falla, el snapshot local se conserva como respaldo y no
debe considerarse persistido remotamente.

La configuración local de Edge Functions se guarda en `supabase/functions/.env`,
que está ignorada. La función usa `verify_jwt = false` porque las secret keys
modernas no son JWT y valida una clave nombrada mediante `apikey`. Las claves
publishable del navegador siguen limitadas a Supabase Auth en
`public/runtime-config.js`; una `sb_secret_...` o `service_role` nunca debe estar
en el navegador, repositorio, URL o logs.

## Demo del dashboard

La referencia funcional del dashboard se sirve en `#/demo`. Está implementada
con HTML, CSS y módulos JavaScript nativos; su fuente visible es el fixture
`fixtures/radar-dashboard-signals.json`. No representa una lectura en vivo ni
hace fallback desde una API remota. Las secciones `#/signals`, `#/sources`,
`#/reader-model` y `#/operator` están disponibles desde la navegación lateral.

Las decisiones de `#/operator` se guardan únicamente en el almacenamiento local
del navegador para mantener la demo entre recargas. Se pueden restablecer desde
la misma pantalla y no se envían a Supabase.

Para verla localmente:

```bash
python3 -m http.server 4173
```

Abre `http://localhost:4173/#/demo`. Los estados de revisión se pueden mostrar
de forma explícita con `?radarState=loading`, `empty`, `error` o `unauthorized`
antes del hash. La ruta `#/radar` permanece protegida por Supabase Auth.
