import Link from 'next/link';

export default function Forbidden() {
  return (
    <main className="min-h-[60vh] grid place-items-center p-10 text-center">
      <div>
        <h1 className="text-3xl font-bold mb-2">403 — Forbidden</h1>
        <p className="text-gray-600 mb-6">Bạn không có quyền truy cập trang này.</p>
        <Link href="/auth/login" className="px-4 py-2 rounded bg-black text-white">Đăng nhập</Link>
      </div>
    </main>
  );
}
