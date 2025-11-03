import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function setRole(formData: FormData) {
  'use server';
  const role = String(formData.get('role') || 'customer');
  const returnTo = String(formData.get('returnTo') || `/portal/${role}`);
  (await cookies()).set('role', role, { path: '/', httpOnly: true, sameSite: 'lax' });
  redirect(returnTo);
}

export default async function Login({ searchParams }: { searchParams: { returnTo?: string } }) {
  const returnTo = searchParams?.returnTo || '';
  return (
    <main className="min-h-[60vh] grid place-items-center p-10">
      <form action={setRole} className="w-full max-w-sm space-y-4 border rounded-xl p-5">
        <h1 className="text-xl font-semibold">Login (Demo)</h1>
        <p className="text-sm text-gray-600">Chọn vai trò để mô phỏng đăng nhập.</p>
        <input type="hidden" name="returnTo" defaultValue={returnTo} />
        <select name="role" className="w-full border rounded px-3 py-2">
          <option value="customer">Customer</option>
          <option value="user">User</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button className="w-full rounded bg-black text-white py-2">Sign in</button>
      </form>
    </main>
  );
}
