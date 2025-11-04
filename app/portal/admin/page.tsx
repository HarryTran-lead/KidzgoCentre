import Brand from '@/components/Brand';

export default function AdminHome() {
  return (
    <div className="space-y-4">
      <Brand />
      <h1 className="text-2xl font-bold">Portal – Admin</h1>
      <p className="text-gray-600">This is the admin dashboard page.</p>
      <ul className="list-disc pl-6 text-sm">
        <li>Put KPIs/widgets here.</li>
        <li>Add nested routes like /portal/admin/classes, /portal/admin/students, etc.</li>
      </ul>
    </div>
  );
}
