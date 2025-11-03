
# Student Portal (Next.js App Router)

Paste these folders into your project:

- `app/student/*`
- `components/student/*`

The layout mirrors the Admin structure:
```
app/student/layout.tsx
app/student/page.tsx             (Dashboard)
app/student/schedule/page.tsx
app/student/profile/page.tsx
app/student/tuition/page.tsx
app/student/materials/page.tsx
app/student/notifications/page.tsx
components/student/Sidebar.tsx
components/student/Header.tsx
```

Notes
- Uses Tailwind classes; no `clsx` dependency.
- Icons from `lucide-react` — ensure it’s installed: `npm i lucide-react`.
- Pages are static demo data; wire up your APIs later.
