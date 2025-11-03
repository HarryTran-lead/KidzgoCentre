export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Hồ sơ cá nhân</h1>
      <div className="rounded-2xl border bg-white p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-500">Họ tên</div>
            <div className="font-semibold">Nguyễn Thị An</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Email</div>
            <div className="font-semibold">teacher@educenter.vn</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">SĐT</div>
            <div className="font-semibold">0901 234 567</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Chuyên môn</div>
            <div className="font-semibold">IELTS, TOEIC, Business English</div>
          </div>
        </div>
      </div>
    </div>
  );
}
