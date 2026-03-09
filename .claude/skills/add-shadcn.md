---
description: Install and use shadcn/ui components. Use when you need to add new UI components like buttons, dialogs, tables, forms, etc.
user_invocable: true
---

# Add shadcn/ui Component

Install and integrate shadcn/ui components into the frontend.

## Steps

1. Navigate to `frontend/` directory
2. Install the requested component: `npx shadcn@latest add <component-name>`
3. If multiple components are needed, install them all: `npx shadcn@latest add <comp1> <comp2> ...`
4. Import the component from `@/components/ui/<component-name>`
5. Integrate it into the target page or component

## Common Components
- `button`, `input`, `label`, `textarea` — Form basics
- `dialog`, `alert-dialog` — Modals
- `table` — Data display
- `card` — Content containers
- `tabs` — Tabbed interfaces
- `select`, `checkbox`, `switch` — Form controls
- `dropdown-menu` — Action menus
- `badge` — Status indicators
- `avatar` — User avatars
- `separator` — Visual dividers
- `skeleton` — Loading states
- `toast` (use sonner) — Notifications
- `form` — Form wrapper with react-hook-form integration
- `sheet` — Side panels

## Notes
- Style preset: "new-york"
- Base color: "zinc"
- All components install to `frontend/components/ui/`
