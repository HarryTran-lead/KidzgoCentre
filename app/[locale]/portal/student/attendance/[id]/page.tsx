"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  FileText,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Star,
  RefreshCw,
  ThumbsUp
} from "lucide-react";
import type {
  AttendanceStatus,
  SessionStatus,
  LeaveRequestStatus,
  AttendanceDetail,
  AttendanceStatusConfig,
  SessionStatusConfig,
  LeaveRequestStatusConfig
} from "@/types/student/attendance";

// Sample Data
const SAMPLE_DATA: AttendanceDetail = {
  id: "1",
  className: "Lớp Tiếng Anh A1",
  subject: "Tiếng Anh",
  level: "A1 - Sơ cấp",
  date: "21/12/2024",
  startTime: "19:00",
  endTime: "21:00",
  room: "Phòng 201",
  isOnline: false,
  teacher: "Nguyễn Thị Mai",
  sessionStatus: "COMPLETED",
  attendanceStatus: "PRESENT",
  checkInTime: "18:55",
  checkOutTime: "21:05",
  checkInMethod: "QR_CODE",
  lesson: {
    unit: "Unit 5: Daily Routines",
    topic: "Talking about daily activities",
    objectives: [
      "Sử dụng thì hiện tại đơn để mô tả hoạt động hàng ngày",
      "Học từ vựng về các hoạt động trong ngày",
      "Luyện phát âm với các động từ thường gặp"
    ],
    materials: [
      "English File Elementary - Unit 5",
      "Worksheet: Daily Routines",
      "Audio files: Track 15-18"
    ]
  },
  feedback: {
    comment: "Em học tập rất tốt trong buổi học hôm nay. Tích cực tham gia các hoạt động nhóm và có khả năng giao tiếp tốt.",
    attitude: "GOOD",
    participation: 5,
    suggestions: "Nên luyện thêm cách phát âm động từ có đuôi -s/es"
  },
  homeworkSubmitted: true
};

// Status Badge Components
function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const config = {
    SCHEDULED: { text: "Đã lên lịch", color: "bg-blue-100 text-blue-700 border-blue-200" },
    COMPLETED: { text: "Hoàn thành", color: "bg-green-100 text-green-700 border-green-200" },
    CANCELLED: { text: "Đã hủy", color: "bg-red-100 text-red-700 border-red-200" },
    MAKEUP_SESSION: { text: "Buổi bù", color: "bg-purple-100 text-purple-700 border-purple-200" },
  };
  const { text, color } = config[status];
  return (
    <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${color}`}>
      {text}
    </span>
  );
}

function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const config = {
    PRESENT: { text: "✅ Có mặt", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
    ABSENT: { text: "❌ Vắng không phép", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
    EXCUSED: { text: "📝 Nghỉ có phép", color: "bg-amber-100 text-amber-700 border-amber-200", icon: FileText },
    MAKEUP: { text: "🔁 Buổi bù", color: "bg-sky-100 text-sky-700 border-sky-200", icon: RefreshCw },
    LATE: { text: "⏰ Đi trễ", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertCircle },
    EARLY_LEAVE: { text: "⏰ Về sớm", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertCircle },
  };
  const { text, color, icon: Icon } = config[status];
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border ${color}`}>
      <Icon size={18} />
      <span>{text}</span>
    </div>
  );
}

function LeaveRequestStatusBadge({ status }: { status: LeaveRequestStatus }) {
  const config = {
    PENDING: { text: "Đang chờ", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    APPROVED: { text: "Đã duyệt", color: "bg-green-100 text-green-700 border-green-200" },
    REJECTED: { text: "Từ chối", color: "bg-red-100 text-red-700 border-red-200" },
  };
  const { text, color } = config[status];
  return (
    <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${color}`}>
      {text}
    </span>
  );
}

export default function AttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data] = useState<AttendanceDetail>(SAMPLE_DATA);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại lịch sử điểm danh
      </button>

      {/* Header - Session Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.className}</h1>
            <div className="text-base text-slate-600">
              {data.subject} • {data.level}
            </div>
          </div>
          <SessionStatusBadge status={data.sessionStatus} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <Calendar size={20} className="text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Ngày học</div>
              <div className="font-semibold text-gray-900">{data.date}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={20} className="text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Thời gian</div>
              <div className="font-semibold text-gray-900">
                {data.startTime} - {data.endTime}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">
                {data.isOnline ? "Online" : "Phòng học"}
              </div>
              <div className="font-semibold text-gray-900">{data.room}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User size={20} className="text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Giáo viên</div>
              <div className="font-semibold text-gray-900">{data.teacher}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Status - Most Important */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Trạng thái điểm danh</h2>
        
        <div className="bg-white rounded-xl p-4 space-y-4">
          <div>
            <div className="text-sm text-slate-500 mb-2">Trạng thái</div>
            <AttendanceStatusBadge status={data.attendanceStatus} />
          </div>

          {data.checkInTime && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Check-in</div>
                <div className="font-semibold text-gray-900">{data.checkInTime}</div>
              </div>
              {data.checkOutTime && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">Check-out</div>
                  <div className="font-semibold text-gray-900">{data.checkOutTime}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lesson Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Nội dung buổi học</h2>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">Bài học</div>
            <div className="font-semibold text-gray-900">{data.lesson.unit}</div>
            <div className="text-sm text-slate-600 mt-1">{data.lesson.topic}</div>
          </div>

          <div>
            <div className="text-sm text-slate-500 mb-2">Mục tiêu buổi học</div>
            <ul className="space-y-2">
              {data.lesson.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-900">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm text-slate-500 mb-2">Tài liệu sử dụng</div>
            <ul className="space-y-2">
              {data.lesson.materials.map((material, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-900">
                  <FileText size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{material}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Teacher Feedback */}
      {data.feedback && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Đánh giá của giáo viên</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-600">{data.feedback.comment}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-2">Thái độ học tập</div>
                <div className="flex items-center gap-2">
                  {data.feedback.attitude === "GOOD" && (
                    <>
                      <ThumbsUp size={16} className="text-green-600" />
                      <span className="font-semibold text-green-700">Tốt</span>
                    </>
                  )}
                  {data.feedback.attitude === "FAIR" && (
                    <>
                      <Star size={16} className="text-yellow-600" />
                      <span className="font-semibold text-yellow-700">Khá</span>
                    </>
                  )}
                  {data.feedback.attitude === "NEEDS_IMPROVEMENT" && (
                    <>
                      <AlertCircle size={16} className="text-orange-600" />
                      <span className="font-semibold text-orange-700">Cần cải thiện</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-500 mb-2">Mức độ tham gia</div>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < data.feedback!.participation ? "text-yellow-500 fill-yellow-500" : "text-slate-300"}
                    />
                  ))}
                </div>
              </div>
            </div>

            {data.feedback.suggestions && (
              <div>
                <div className="text-sm text-slate-500 mb-2">Gợi ý ôn tập</div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
                  💡 {data.feedback.suggestions}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Homework Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Bài tập về nhà</h2>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            data.homeworkSubmitted 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            {data.homeworkSubmitted ? (
              <>
                <CheckCircle size={16} />
                <span className="font-semibold">Đã nộp</span>
              </>
            ) : (
              <>
                <XCircle size={16} />
                <span className="font-semibold">Chưa nộp</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notes Section - Only show if present */}
      {(data.parentNote || data.teacherNote) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ghi chú</h2>
          
          <div className="space-y-4">
            {data.parentNote && (
              <div>
                <div className="text-sm text-slate-500 mb-2">Ghi chú của phụ huynh</div>
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-gray-900">
                  {data.parentNote}
                </div>
              </div>
            )}

            {data.teacherNote && (
              <div>
                <div className="text-sm text-slate-500 mb-2">Ghi chú của giáo viên</div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-gray-900">
                  {data.teacherNote}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
