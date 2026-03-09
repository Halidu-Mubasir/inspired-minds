---
description: Scaffold a new Next.js page with components following project conventions. Use when adding a new route or dashboard page to the frontend.
user_invocable: true
---

# Scaffold New Frontend Page

Create a new page in the Inspired Minds frontend following project conventions.

## Steps

1. Ask the user for: page name, which role section (admin/teacher/student/shared), and purpose
2. Create the page file at `frontend/app/(dashboard)/<role>/<page-name>/page.tsx`
3. Create associated component(s) in `frontend/components/<role>/`
4. If the page needs API calls, create or update the relevant `frontend/lib/api/<module>.ts`
5. If new TypeScript types are needed, add them to `frontend/types/`

## Conventions
- Pages are server components by default; add "use client" only when needed
- Use shadcn/ui components for all UI elements
- Forms use react-hook-form + zod schemas
- Tables use @tanstack/react-table with the data-table pattern
- Loading states use skeleton components
- Empty states use the shared empty-state component
- All pages should have proper TypeScript types
