'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PortalShell({ role, children }: { role: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const NAV = [
    { href: '/portal/customer', label: 'Customer' },
    { href: '/portal/user', label: 'User' },
    { href: '/portal/teacher', label: 'Teacher' },
    { href: '/portal/admin', label: 'Admin' },
  ];

  return (
    <div className="min-h-screen grid md:grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-4">
        <div className="text-sm text-gray-500">Signed in as</div>
        <div className="font-semibold capitalize">{role || 'anonymous'}</div>
        <nav className="pt-4 space-y-1">
          {NAV.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`block rounded px-3 py-2 hover:bg-gray-100 ${pathname.startsWith(i.href) ? 'bg-gray-100 font-medium' : ''}`}
            >
              {i.label}
            </Link>
          ))}
          <Link href="/auth/logout" className="block rounded px-3 py-2 hover:bg-gray-100">
            Logout
          </Link>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
