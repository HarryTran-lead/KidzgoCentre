// components/home/Main/FAQs/data.ts
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import {
  HelpCircle,
  UserPlus,
  CreditCard,
  CalendarClock,
  ClipboardCheck,
  Smartphone,
  BookOpenCheck,
  ShieldCheck,
  Wrench,
} from "lucide-react";

export type FAQCategoryName =
  | "all"
  | "enrollment"
  | "tuition"
  | "schedule"
  | "attendance"
  | "portal"
  | "learning"
  | "technical";

export type FAQCategory = {
  name: FAQCategoryName;
  icon: ReactNode;
};

export type FAQItem = {
  id: number;
  question: string;
  answer: string;
  category: FAQCategoryName;
  icon: ReactNode;
  updatedAt?: string; // ISO string (optional)
};

/** Icons cho dropdown category (label hiển thị lấy từ dict.faqs.categories) */
export const categories: FAQCategory[] = [
  { name: "all", icon: <HelpCircle className="w-4 h-4 text-sky-500" /> },
  { name: "enrollment", icon: <UserPlus className="w-4 h-4 text-sky-500" /> },
  { name: "tuition", icon: <CreditCard className="w-4 h-4 text-sky-500" /> },
  {
    name: "schedule",
    icon: <CalendarClock className="w-4 h-4 text-sky-500" />,
  },
  {
    name: "attendance",
    icon: <ClipboardCheck className="w-4 h-4 text-sky-500" />,
  },
  { name: "portal", icon: <Smartphone className="w-4 h-4 text-sky-500" /> },
  {
    name: "learning",
    icon: <BookOpenCheck className="w-4 h-4 text-sky-500" />,
  },
  { name: "technical", icon: <Wrench className="w-4 h-4 text-sky-500" /> },
];

/* =========================
 * FAQs (VI)
 * ========================= */
const faqsVi: FAQItem[] = [
  {
    id: 1,
    category: "enrollment",
    question: "KidzGo là gì và trung tâm của tôi dùng để làm gì?",
    answer:
      "KidzGo là nền tảng quản trị học vụ & tài chính cho trung tâm tiếng Anh. Hệ thống giúp chuẩn hóa quy trình tuyển sinh, xếp lớp, điểm danh, bù buổi, thu học phí, báo cáo công nợ và gửi báo cáo học tập cho phụ huynh qua Zalo/Portal.",
    icon: <HelpCircle className="w-5 h-5 text-sky-500" />,
    // updatedAt: "2025-11-10",
  },
  {
    id: 2,
    category: "enrollment",
    question: "Trung tâm mất bao lâu để triển khai KidzGo?",
    answer:
      "Với trung tâm quy mô 2–5 chi nhánh, thời gian triển khai thường từ 1–2 tuần: 2–3 ngày để thiết lập cấu hình (khóa học, ca học, chính sách bù buổi), 2–3 ngày training cho nhân sự học vụ – kế toán – giáo viên, phần còn lại là chạy thử và tối ưu theo quy trình thực tế.",
    icon: <UserPlus className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 3,
    category: "tuition",
    question: "KidzGo hỗ trợ thu học phí và công nợ như thế nào?",
    answer:
      "KidzGo tích hợp thanh toán qua QR PayOS, chuyển khoản và tiền mặt. Hóa đơn học phí được tạo từ chương trình học, gửi link/Zalo cho phụ huynh. Hệ thống tự đối soát giao dịch, cập nhật trạng thái đã thu/chưa thu, nhắc nợ và xuất báo cáo công nợ theo lớp, khóa, chi nhánh.",
    icon: <CreditCard className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 4,
    category: "schedule",
    question: "Lịch học và xếp lớp được quản lý ra sao?",
    answer:
      "Trung tâm cấu hình ca học, phòng học, giáo viên và khóa học trên KidzGo. Khi tư vấn xong, nhân viên có thể ghi danh và xếp lớp ngay trên hệ thống. Lịch học tự động hiển thị cho giáo viên và phụ huynh, hạn chế trùng lịch hoặc quên cập nhật.",
    icon: <CalendarClock className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 5,
    category: "attendance",
    question: "Hệ thống hỗ trợ điểm danh và bù buổi như thế nào?",
    answer:
      "Giáo viên điểm danh trực tiếp trên KidzGo (web/app). Những buổi học nghỉ có lý do sẽ được đẩy sang danh sách cần bù. Nhân viên vận hành có thể gợi ý slot bù, gửi thông báo cho phụ huynh qua Zalo. Toàn bộ lịch sử vắng – bù được lưu lại để kiểm soát chất lượng.",
    icon: <ClipboardCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 6,
    category: "portal",
    question:
      "Phụ huynh phải tải app không hay chỉ cần dùng Zalo/Portal của KidzGo?",
    answer:
      "Phụ huynh có thể chọn: 1) Nhận thông tin qua Zalo OA của trung tâm (lịch học, điểm danh, học phí, nhắc nợ) hoặc 2) Đăng nhập Parent Portal để xem chi tiết hơn. Không bắt buộc phải cài thêm app mới nên rất phù hợp với phụ huynh bận rộn.",
    icon: <Smartphone className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 7,
    category: "learning",
    question:
      "Giáo viên có thể giao bài tập và gửi nhận xét học tập trên KidzGo không?",
    answer:
      "Có. Giáo viên có thể chấm điểm, ghi nhận xét sau mỗi buổi, upload bài tập hoặc link tài liệu. Hệ thống tổng hợp thành báo cáo tháng/quý, gửi cho phụ huynh qua Zalo/Portal với ngôn ngữ dễ hiểu, giúp phụ huynh nắm được tiến bộ của con.",
    icon: <BookOpenCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 8,
    category: "tuition",
    question:
      "Trung tâm có xuất được báo cáo doanh thu, chi phí và lương giáo viên không?",
    answer:
      "Có. KidzGo cho phép theo dõi doanh thu theo khóa, lớp, chi nhánh và kênh tư vấn. Phần kế toán có thể ghi nhận chi phí, tạm tính lương giáo viên theo số buổi dạy, hoa hồng tư vấn viên và xuất file Excel/PDF để lưu trữ hoặc nộp cho kế toán tổng.",
    icon: <CreditCard className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 9,
    category: "technical",
    question: "Làm gì khi giáo viên hoặc phụ huynh quên mật khẩu đăng nhập?",
    answer:
      "Người dùng có thể dùng chức năng quên mật khẩu bằng email/số điện thoại đã đăng ký. Với tài khoản giáo viên/staff, admin trung tâm cũng có thể reset mật khẩu trong mục Quản lý người dùng. Mọi thao tác đều được ghi log để đảm bảo minh bạch.",
    icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 10,
    category: "technical",
    question: "Dữ liệu trên KidzGo có an toàn không?",
    answer:
      "Dữ liệu được lưu trữ trên hạ tầng cloud (với sao lưu định kỳ), phân quyền chi tiết theo vai trò: Admin, Học vụ, Kế toán, Giáo viên, Phụ huynh. Tất cả truy cập đều qua HTTPS, mật khẩu được mã hóa và có cơ chế log hành động người dùng để truy vết khi cần.",
    icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 11,
    category: "portal",
    question:
      "Phụ huynh xem lịch học, điểm danh và học phí của nhiều con trong cùng tài khoản được không?",
    answer:
      "Được. Một tài khoản phụ huynh có thể liên kết nhiều học viên. Trên Zalo/Portal, phụ huynh chỉ cần chọn tên con để xem lịch học, điểm danh, kết quả học tập và học phí tương ứng. Điều này rất tiện cho gia đình có 2–3 bé học cùng trung tâm.",
    icon: <Smartphone className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 12,
    category: "enrollment",
    question: "KidzGo có gói dùng thử cho trung tâm mới không?",
    answer:
      "Thông thường, trung tâm được dùng thử hệ thống trong 14–30 ngày với đầy đủ tính năng học vụ. Nếu cần, đội ngũ KidzGo sẽ hỗ trợ import dữ liệu lớp/học viên ban đầu để trung tâm trải nghiệm sát với vận hành thật trước khi ký hợp đồng chính thức.",
    icon: <UserPlus className="w-5 h-5 text-sky-500" />,
  },
];

/* =========================
 * FAQs (EN)
 * ========================= */
const faqsEn: FAQItem[] = [
  {
    id: 1,
    category: "enrollment",
    question: "What is KidzGo and what is it used for at my center?",
    answer:
      "KidzGo is an academic & finance management platform for English centers. It standardizes enrollment, class assignment, attendance, make-up sessions, tuition collection, A/R reporting, and delivers learning reports to parents via Zalo/Portal.",
    icon: <HelpCircle className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 2,
    category: "enrollment",
    question: "How long does it take to deploy KidzGo?",
    answer:
      "For centers with 2–5 branches, typical deployment takes 1–2 weeks: 2–3 days to configure (courses, time slots, make-up policies), 2–3 days to train academic/accounting/teaching staff, and the remainder for pilot run and optimization.",
    icon: <UserPlus className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 3,
    category: "tuition",
    question: "How does KidzGo support tuition collection and A/R?",
    answer:
      "KidzGo integrates PayOS QR, bank transfer, and cash. Tuition invoices are generated from the learning program and sent via link/Zalo. The system auto-reconciles transactions, tracks paid/unpaid status, sends reminders, and exports A/R reports by class, course, and branch.",
    icon: <CreditCard className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 4,
    category: "schedule",
    question: "How are schedules and class assignments managed?",
    answer:
      "Configure time slots, rooms, teachers, and courses in KidzGo. After advising, staff can enroll and assign classes right away. Schedules are auto-visible for teachers and parents, reducing conflicts and missed updates.",
    icon: <CalendarClock className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 5,
    category: "attendance",
    question: "How are attendance and make-up sessions handled?",
    answer:
      "Teachers take attendance directly in KidzGo (web/app). Excused absences appear in a make-up list. Operations can suggest make-up slots and notify parents via Zalo. Full absence/make-up history is retained for quality control.",
    icon: <ClipboardCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 6,
    category: "portal",
    question:
      "Do parents need to install an app or just use Zalo/Parent Portal?",
    answer:
      "Parents can choose: (1) Receive updates via the center’s Zalo OA (schedule, attendance, tuition, reminders) or (2) Log into the Parent Portal for more details. No extra app is required—ideal for busy parents.",
    icon: <Smartphone className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 7,
    category: "learning",
    question: "Can teachers assign homework and send learning comments?",
    answer:
      "Yes. Teachers can grade, leave session comments, and upload homework or links. The system aggregates monthly/quarterly reports and sends them to parents via Zalo/Portal in a parent-friendly format.",
    icon: <BookOpenCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 8,
    category: "tuition",
    question: "Can we export revenue, costs, and teacher payroll reports?",
    answer:
      "Yes. KidzGo tracks revenue by course, class, branch, and advising channel. Accounting can log expenses, estimate teacher payroll by taught sessions, advisor commissions, and export Excel/PDF for filing or for the general accounting team.",
    icon: <CreditCard className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 9,
    category: "technical",
    question: "What if a teacher or parent forgets the password?",
    answer:
      "Users can reset passwords using their registered email/phone. For teacher/staff accounts, the center admin can also reset passwords under User Management. All actions are logged for transparency.",
    icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 10,
    category: "technical",
    question: "Is data on KidzGo secure?",
    answer:
      "Data is hosted in the cloud (with periodic backups) and protected with role-based access: Admin, Academic, Accounting, Teacher, Parent. All access uses HTTPS, passwords are hashed, and user actions are logged for auditability.",
    icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 11,
    category: "portal",
    question:
      "Can a parent view schedules, attendance, and tuition for multiple children with one account?",
    answer:
      "Yes. A parent account can link multiple students. In Zalo/Portal, parents just pick the child to view schedule, attendance, progress, and tuition—perfect for families with 2–3 kids at the same center.",
    icon: <Smartphone className="w-5 h-5 text-sky-500" />,
  },
  {
    id: 12,
    category: "enrollment",
    question: "Is there a trial plan for new centers?",
    answer:
      "Typically, centers can try the system for 14–30 days with full academic features. If needed, the KidzGo team helps import initial class/student data so the trial mirrors real operations before signing the official contract.",
    icon: <UserPlus className="w-5 h-5 text-sky-500" />,
  },
];

/** Trả về FAQs theo locale */
export function faqsByLocale(locale: Locale): FAQItem[] {
  return locale === "en" ? faqsEn : faqsVi;
}
