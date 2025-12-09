## Epic: Mostrar posiciones y operaciones en tiempo real en el aside de liquidación

### Historia 1: Stream SSE de operaciones activas
- **Como** operador de operaciones
- **Quiero** recibir un stream en tiempo real con operaciones activas (Transaction, TransferOperation, TreasuryMovement, LogisticsOperation)
- **Para** ver al instante cómo cambian las posiciones sin recargar la página
- **Criterios de aceptación**
  - Endpoint `GET /api/operations/events` emite alta/updates/cancel para estados activos.
  - Estados activos: Transaction (draft|pending|registered), TransferOperation (pending|registered), TreasuryMovement (registered), LogisticsOperation (pendiente|en-curso).
  - Cada evento incluye: id, source (transaction|transfer|treasury|logistics), state, currency, amount, direction (incoming/outgoing), bucket (cash|transfers|usd), updatedAt.
  - Reconexión automática con backoff y no duplica eventos en cliente.

### Historia 2: Snapshot inicial de operaciones activas
- **Como** operador
- **Quiero** obtener un snapshot inicial de todas las operaciones activas
- **Para** tener datos consistentes al abrir la pantalla y al reconectar el stream
- **Criterios de aceptación**
  - Endpoint `GET /api/operations/active?states=step1,step2,confirmed` (mapping a los estados activos por modelo).
  - Incluye mismos campos que el stream + marginPercent cuando aplique.
  - Incluye sumatorias por bucket (cash/ARS, transfers/ARS, usd) y lista de items.
  - Respuesta en <500 ms con paginación si fuera necesario (default sin paginar pero con tope razonable).

### Historia 3: Cálculo de bucket y signos por modelo
- **Como** desarrollador de frontend
- **Quiero** recibir en cada item el bucket y el signo ya resueltos
- **Para** renderizar el impacto sin reimplementar reglas
- **Criterios de aceptación**
  - Transaction buy/sell: bucket cash vs transfers se informa como `bucket` (ambos mostrados por separado si aplica). Signo: buy => ARS outgoing, USD incoming; sell => ARS incoming, USD outgoing.
  - TransferOperation: movementType=cash -> bucket cash; movementType=transfer -> bucket transfers; direction incoming/outgoing define signo.
  - TreasuryMovement: usar balanceKey (cash|transfers|usd) y type incoming/outgoing.
  - LogisticsOperation: puede impactar cash/transfers/usd; backend informa bucket y signo según su payload.

### Historia 4: Margen ponderado sólo con Transactions
- **Como** operador
- **Quiero** ver el margen ponderado actual de operaciones en curso
- **Para** conocer el promedio real del spread en el momento
- **Criterios de aceptación**
  - El backend incluye `marginPercent` sólo en items Transaction.
  - El endpoint de snapshot devuelve `weightedMarginPercent` = Σ(montoARS * margen) / Σ(montoARS) sobre Transactions activas.
  - El stream puede incluir `weightedMarginPercent` recalculado en eventos delta o se recalcula en frontend a partir de items Transaction.

### Historia 5: Hook frontend de operaciones en vivo
- **Como** dev frontend
- **Quiero** un hook `useLiveOperations` que unifique snapshot + stream
- **Para** consumir en el aside y en otros módulos
- **Criterios de aceptación**
  - Carga snapshot inicial; si falla, reintenta con backoff.
  - Suscribe a SSE; si falla SSE, entra en polling corto (3-5s).
  - Expone: items activos, totals por bucket (cash/transfers/usd), weightedMargin, estado de conexión (live|polling|error).
  - De-dupe por id/source y aplica updates/cancel.

### Historia 6: Aside de posiciones en tiempo real
- **Como** usuario del wizard
- **Quiero** ver en tiempo real las posiciones (Efectivo ARS, Transferencias ARS, Caja USD), el impacto de mi operación en edición y la posición proyectada
- **Para** evitar sobreasignar fondos si otro usuario consume saldos
- **Criterios de aceptación**
  - Muestra saldo actual live + operaciones activas (otros usuarios) + operación actual en edición.
  - Se actualiza sin recargar al recibir eventos del hook.
  - Muestra weighted margin actual (solo Transactions) en el bloque de margen.
  - Estados de error/conexión visibles (spinner/live badge, warning si se cae SSE).

### Historia 7: Pruebas y observabilidad
- **Como** equipo
- **Quiero** pruebas y métricas básicas
- **Para** asegurar que el stream y el polling funcionan
- **Criterios de aceptación**
  - Tests unitarios para mapping de bucket/signo por modelo.
  - Tests e2e para validar actualización en vivo en el aside (mock SSE/poll).
  - Logs en backend cuando se abren/cierra streams y cuando se envían eventos (nivel debug/trace).
