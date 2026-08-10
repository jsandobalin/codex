# Guía del repositorio

## Estructura del proyecto y organización de módulos

Este repositorio es el punto de partida de **AI Radar**, un producto que convierte noticias, herramientas, papers, repositorios y lanzamientos de IA en señales accionables. Contiene solo `README.md` y `.gitignore`; aún no hay código, pruebas ni manifiesto de paquetes. El README define la visión y el stack planificado.

Al implementar, separa las responsabilidades: archivos para el navegador en `src/`, lógica de dominio reutilizable en `src/domain/`, recursos estáticos en `public/` y pruebas automatizadas en `test/`. Guarda datos de muestra locales en `fixtures/` o `snapshots/`; no los mezcles con configuración de producción.

## Comandos de compilación, pruebas y desarrollo

El starter aún no incluye comandos de compilación, pruebas, linting o desarrollo. No declares ni dependas de comandos que no existan en el repositorio. Cuando se incorpore tooling de Node.js, documenta los comandos exactos en `package.json`; por ejemplo, `npm test` para ejecutar las pruebas y `npm run dev` para desarrollo local.

La CLI interna prevista es `airadar`. Agrégala con uso, argumentos y script ejecutable documentados.

## Estilo de código y convenciones de nombres

Usa JavaScript con indentación de 2 espacios, punto y coma y comillas simples, salvo que un formateador establecido indique otra cosa. Usa `camelCase` para variables y funciones, `PascalCase` para clases y `kebab-case` para archivos (por ejemplo, `signal-ranking.js`). Prefiere módulos pequeños y reutilizables. Mantén separadas la UI, recolección de datos, ranking y persistencia.

## Guía de pruebas

El framework unitario previsto es `node:test` de Node; agrega pruebas en `test/` con nombres como `signal-ranking.test.js`. Prueba el comportamiento observable, la detección de duplicados, el puntaje y casos límite mediante fixtures deterministas. Agrega pruebas de navegador solo cuando exista interfaz visual; la herramienta prevista es Playwright.

## Commits y pull requests

El historial actual usa mensajes breves de estilo Conventional Commits en español, como `docs: definir README inicial de AI Radar` y `chore: agregar superficie de comandos Dekk`. Sigue el patrón `<tipo>: <resumen imperativo>`; usa tipos como `feat`, `fix`, `docs`, `test` y `chore`.

Los pull requests deben explicar el cambio de producto o dominio, indicar la validación realizada, enlazar issues relacionados cuando existan e incluir capturas para cambios de UI. Mantén cada PR enfocado y evita agrupar refactors no relacionados.

## Seguridad y configuración

Nunca subas credenciales, tokens ni datos privados de fuentes. Usa fixtures y snapshots locales hasta que un servicio externo tenga una integración y contrato de configuración documentados.
