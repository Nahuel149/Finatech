# Navigation Bar Standardization

This document summarizes the investigation and resolution of inconsistent navigation bar behavior on the Tesorería pages compared to the rest of the application.

## Summary

- The Tesorería module implemented a bespoke `TreasuryNavbar` with custom mobile and desktop markup, separate notification badge, and its own user info rendering.
- Other dashboard sections use a shared `DashboardNavbar` component that centralizes navigation items, active-route highlighting, notifications, user menu, and search behavior.
- Differences led to inconsistent appearance and UX across pages.

## Key Differences Found

- Component structure: `TreasuryNavbar` duplicated mobile/desktop layouts instead of reusing `DashboardNavbar`.
- Active state: Tesorería highlighted its tab statically (e.g., `bg-blue-50`) versus `DashboardNavbar` active detection via routing.
- Notifications: Tesorería used a static badge (hardcoded `3`) while `DashboardNavbar` integrates with notifications hooks.
- User menu: Tesorería displayed static avatar/name without the shared user menu behavior present in `DashboardNavbar`.
- Mobile search behavior: Tesorería added custom focus logic; `DashboardNavbar` manages search uniformly.

## Resolution Implemented

- `client/src/components/dashboard/tesoreria/TreasuryNavbar.tsx` now delegates to the shared `DashboardNavbar`, passing through `search` and `onSearchChange` props.
- This unifies nav items (Operaciones, Tesorería, Logística, Liquidaciones), active highlighting, notifications, user menu, and mobile/desktop layout across pages.

## Intentional Differences and How to Handle Them

If Tesorería requires special nav behavior in the future:

- Extend `DashboardNavbar` via props (e.g., optional `extraActions` or `activeSection`) rather than duplicating markup.
- If Tesorería needs custom nav items, consider adding a `navItems` prop to `DashboardNavbar` and default to the global set.
- If a Tesorería-specific quick action is required on mobile, introduce a slot/children area in `DashboardNavbar` to render module-specific actions.

## Developer Guidance

- Prefer composition or prop-driven extensions to maintain a single source of truth for nav behavior.
- Avoid duplicating the navbar structure to ensure consistent UX and reduce maintenance.