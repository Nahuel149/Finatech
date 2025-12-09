## Logistics Order: Origin/Destination & Messenger Stories

### Goals
- Use client saved addresses (primary/secondary/other) for `Origen`/`Destino` instead of client name.
- Auto-default origin/destination based on operation type (Compra vs Venta) without duplicating the same field.
- Allow an optional “Mensajero asignado” with seeded examples plus admin-managed entries.
- Enable admins to add/remove registered users as messengers from `/admin` so they appear in the logistics dropdown.

### User Stories & Acceptance Criteria

1) **Origen/Destino uses client addresses**
   - As a logistics operator creating an order, I can pick `Origen`/`Destino` from the client’s saved addresses (e.g., Principal, Secundario), not from the client name.
   - AC:
     - Dropdown options come from the linked client’s saved addresses and show a clear label + formatted address.
     - Selecting stores the address ID/reference (not free text) on the order payload.
     - If the client has no saved address, show an inline empty state and let me proceed after I pick or add one later.

2) **Compra/Venta default mapping**
   - As an operator, selecting the operation type auto-fills the appropriate endpoint without setting both fields or reusing the same address.
   - AC:
     - Compra: default `Origen` = client pickup address; `Destino` left empty for operator to choose.
     - Venta: default `Destino` = client delivery address; `Origen` left empty for operator to choose.
     - Changing type updates defaults without overwriting a field the user already edited.
     - Validation blocks using the same address ID for both `Origen` and `Destino`.

3) **Optional “Mensajero asignado”**
   - As an operator, I can leave “Mensajero asignado” empty or choose from a list.
   - AC:
     - Field labeled optional; saving without a messenger succeeds.
     - Dropdown seeds at least two example messengers and includes any admin-added messengers.
     - Selecting stores the messenger user ID; clearing removes it from the payload.

4) **Admin manages messenger list**
   - As an admin on `/admin`, I can add/remove registered users to the messenger pool so they appear in the logistics form list.
   - AC:
     - Admin view lists registered users; toggle adds/removes “messenger” capability.
     - Added messengers surface in the logistics dropdown (live fetch or after refresh).
     - Removing messenger role hides them for new orders without breaking existing assignments.

### Technical Tasks (high level)
- Backend:
  - Expose client addresses with IDs/labels in logistics order APIs; enforce non-identical origin/destination IDs.
  - Update order create/update to accept optional `messengerId`.
  - Add messenger role flag/query; endpoints to list messengers and to toggle messenger role from `/admin`.
- Frontend:
  - Logistics form: fetch and render address dropdowns (labeled), bind to address IDs.
  - Apply Compra/Venta mapping defaults that avoid overwriting user edits and prevent same-ID selection.
  - Messenger select: optional, seeded examples + admin-managed list, supports clearing.
  - Admin page: list users, toggle messenger role, refresh data source for dropdown.
- Testing:
  - Unit/API: origin/destination validation, Compra/Venta mapping, optional messenger, messenger role toggle/listing.
  - UI/E2E: defaults per operation type, messenger optionality, admin adds messenger → appears in logistics dropdown.

### Assumptions / Open Questions
- Address source: use the client’s saved addresses shown in the contact modal (primary/secondary); confirm whether more than two addresses are supported.
- Seeded messenger examples: can be static fixtures until real users are added.
- If no client is linked yet, origin/destination dropdowns stay empty until a client is selected.
