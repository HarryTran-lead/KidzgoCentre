import { cookies } from 'next/headers';
import PortalShell from '@/components/PortalShell';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const role = cookieStore.get('role')?.value || 'customer';
  return <PortalShell role={role}>{children}</PortalShell>;
}
