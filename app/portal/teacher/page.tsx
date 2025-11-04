import Brand from '@components/Brand';

export default function TeacherHome() {
  return (
    <div className="space-y-4">
      <Brand />
      <h1 className="text-2xl font-bold">Portal – Teacher</h1>
      <p className="text-gray-600">This is the teacher dashboard page.</p>
      <ul className="list-disc pl-6 text-sm">
        <li>Put KPIs/widgets here.</li>
        <li>Add nested routes like /portal/teacher/classes, /portal/teacher/students, etc.</li>
      </ul>
    </div>
  );
}
