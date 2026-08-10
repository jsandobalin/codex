# Fixtures del dashboard

`radar-dashboard-signals.json` es el origen de datos de la ruta `#/demo`.
Usa el contrato `ai-radar-dashboard@1` y existe porque no hay un endpoint de
lectura configurado. La interfaz muestra de forma visible que está en modo demo.
No se usa como fallback ante errores de una API remota.

Las decisiones del modo operador se guardan aparte en `localStorage`, solo para
demostrar su interacción entre recargas. No modifican este fixture ni Supabase.
