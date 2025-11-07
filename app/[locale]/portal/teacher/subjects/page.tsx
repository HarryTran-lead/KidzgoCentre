
"use client";
import React, { useState } from "react";
import { Search, Upload } from "lucide-react";
import Tabs from "@/components/teacher/Tabs";
import CourseCard from "@/components/teacher/CourseCard";
import MaterialRow from "@/components/teacher/MaterialRow";
import ExamRow from "@/components/teacher/ExamRow";

export default function Page() {
  const [tab, setTab] = useState<"monhoc" | "tailieu" | "dekiemtra">("monhoc");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Môn học & Tài liệu</h1>
        <p className="text-slate-500 text-sm">Quản lý chương trình học và tài liệu giảng dạy</p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs
          value={tab}
          onChange={(k) => setTab(k as any)}
          items={[
            { key: "monhoc", label: "Môn học" },
            { key: "tailieu", label: "Tài liệu" },
            { key: "dekiemtra", label: "Đề kiểm tra" },
          ]}
        />
        {tab !== "monhoc" && (
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-2 text-sm">
            <Upload size={16} />
            {tab === "tailieu" ? "Tải lên tài liệu" : "Tải lên đề thi"}
          </button>
        )}
      </div>

      <div className="relative">
        <input
          className="w-full rounded-2xl border px-4 py-2 pl-10"
          placeholder={tab === "monhoc" ? "Tìm môn học..." : "Tìm kiếm..."}
        />
        <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
      </div>

      {tab === "monhoc" && (
        <div className="grid md:grid-cols-3 gap-4">
          <CourseCard title="IELTS Foundation" level="Cơ bản" duration="3 tháng" sessions={36} />
          <CourseCard title="TOEIC Intermediate" level="Trung cấp" duration="2 tháng" sessions={24} />
          <CourseCard title="Business English" level="Nâng cao" duration="4 tháng" sessions={48} />
        </div>
      )}

      {tab === "tailieu" && (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-xs text-slate-500 px-1">
            <div className="col-span-5">Tên tài liệu</div>
            <div className="col-span-3">Môn học</div>
            <div className="col-span-1">Loại</div>
            <div className="col-span-1">Kích thước</div>
            <div className="col-span-1">Ngày tải lên</div>
            <div className="col-span-1 text-right">Thao tác</div>
          </div>
          <MaterialRow name="IELTS Speaking Module 1-5" course="IELTS Foundation" kind="PDF" size="2.5 MB" date="01/10/2025" />
          <MaterialRow name="TOEIC Practice Test Vol.1" course="TOEIC Intermediate" kind="PDF" size="1.8 MB" date="05/09/2025" />
          <MaterialRow name="Business Vocabulary List" course="Business English" kind="DOCX" size="0.5 MB" date="15/09/2025" />
          <MaterialRow name="IELTS Writing Task 2 Samples" course="IELTS Foundation" kind="PDF" size="3.2 MB" date="20/09/2025" />
        </div>
      )}

      {tab === "dekiemtra" && (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-xs text-slate-500 px-1">
            <div className="col-span-5">Tên bài kiểm tra</div>
            <div className="col-span-2">Môn học</div>
            <div className="col-span-2">Ngày thi</div>
            <div className="col-span-1">Thời lượng</div>
            <div className="col-span-1">Trạng thái</div>
            <div className="col-span-1 text-right">Thao tác</div>
          </div>
          <ExamRow title="Kiểm tra giữa kỳ - IELTS" course="IELTS Foundation" date="15/10/2025" duration="90 phút" status="Sắp tới" />
          <ExamRow title="Kiểm tra cuối kỳ - TOEIC" course="TOEIC Intermediate" date="25/10/2025" duration="120 phút" status="Sắp tới" />
          <ExamRow title="Bài kiểm tra 1 - Business" course="Business English" date="05/10/2025" duration="60 phút" status="Đã hoàn thành" />
        </div>
      )}
    </div>
  );
}
