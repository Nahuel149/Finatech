## Notifications Automation Plan

### Goals
- Emit real notifications from domain events (operations, transfers, treasury, logistics, documents).
- Deliver to intended recipients (per-user or broadcast), with deep links to context.
- Avoid seeded/demo data; respect per-user read state and rate limits.
- Keep dropdown UX unchanged; optionally add real-time toast later.

### Scope (user stories)
- Operations: confirm/settle/cancel emits notification with status, amount, client, link to operation detail.
- Transfers wizard: step 3 success emits notification with amount/currency/beneficiary, link to transfer detail.
- Treasury movements/conciliations: create/approve/reconcile emits notification with account label and link to movement detail or balances view.
- Treasury alerts: threshold breaches (low/high) emit warning; once per breach until cleared.
- Logistics orders/incidents: state transitions and incident create/resolve emit notifications with IDs and deep links.
- Documents: upload/validation emits notification to validator/assignee with client/operation reference.
- Assign/mention: targeted notifications to the assigned user.

### Backend design
1) **Schema update**
   - Extend `Notification` with:
     - `recipients?: [{ user: ObjectId, role?: string }]` (empty/absent = broadcast).
     - `context?: { type: string, id: string, path?: string, extra?: any }`.
   - Indexes: `{ createdAt: -1 }` (existing) plus `{ 'recipients.user': 1, createdAt: -1 }`.

2) **Service helper (`src/services/notifications.service.js`)**
   - `emitNotification({ title, message, severity = 'info', actionLabel?, actionUrl?, metadata?, recipients?, context? })`
     - Deduplication: skip if same `title+message+context.type+context.id` created within last 2 minutes.
     - Create `Notification`; return the saved doc.
   - `emitToUsers(userIds, payload)` convenience wrapper.
   - Handle errors quietly; log via shared logger.

3) **API adjustments**
   - `/api/dashboard/notifications`:
     - Remove seed (done).
     - Filter: return notifications where `recipients` is empty OR includes `req.user._id`.
     - Accept `includeRead=false` (existing).
   - `/api/dashboard/notifications/read-all`: mark only relevant notifications for the current user.

4) **Hook points (call `emitNotification`)**
   - **Operations**: after confirm/settle/cancel in operations service/controller; payload includes op ID, client, amount, status, `actionUrl` to `/dashboard/operacion/:id`.
   - **Transfers wizard**: on step-3 success handler/controller; include transfer ID, amount/currency, beneficiary; `actionUrl` to `/dashboard/operaciones/transfer/:id`.
   - **Treasury movements/conciliations**: after create/approve/reconcile in `treasury.service`; include account/balance, amount, movement ID; link to `/dashboard/tesoreria/movimientos/:id` or `/dashboard/tesoreria/saldos?account=...`.
   - **Treasury alerts**: scheduled job evaluates thresholds; warning severity; send once per breach until resolved; store breach state to prevent spam.
   - **Logistics orders/incidents**: on order state change and incident create/resolve; include IDs, state, link to order/incident detail.
   - **Documents**: after successful upload/validation; send to assigned validator with link to review screen.
   - **Assignments/mentions**: whenever ownership/assignee changes, send to new assignee only.

5) **Targeting & read state**
   - When `recipients` present, `/notifications` returns only matching or broadcasts.
   - Keep `NotificationState` per user for read status; unchanged logic.

6) **Rate limiting**
   - Retain existing express-rate-limit on `/notifications`.
   - Deduplication in `emitNotification` prevents burst duplicates.

### Frontend
- No UI changes required; dropdown already consumes `/api/dashboard/notifications`.
- Optional follow-up: toast on new notification arrival via SSE/websocket or polling diff.

### Testing
- Unit: `emitNotification` dedupe; recipients filtering; context stored.
- Integration: `/api/dashboard/notifications` returns only targeted/broadcast; read-all marks only the user’s notifications.
- Domain hooks: mock service and assert `emitNotification` called after confirm/settle/reconcile/state-change/etc.
- Threshold job: breaches trigger once; clears when value recovers.

### Rollout steps
1) Add schema fields + service helper + API filtering changes.
2) Wire operations + transfers hooks; deploy.
3) Wire treasury movements/conciliations + alerts job; deploy.
4) Wire logistics state/incident hooks; deploy.
5) Wire documents + assignments; deploy.
6) Optionally add toast/real-time channel.
