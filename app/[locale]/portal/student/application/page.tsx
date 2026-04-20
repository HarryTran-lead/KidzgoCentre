'use client';

import { 
  FileText, 
  Send, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  History,
  MessageSquare,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Mail,
  Phone,
  Building2,
  UserCheck,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { FilterTabs, TabOption } from "@/components/portal/student/FilterTabs";
import { createTicket, getTickets, getTicketById } from "@/lib/api/ticketService";
import type { CreateTicket, TicketCategory, Ticket, TicketComment } from "@/types/student/ticket";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "@/hooks/use-toast";
import { getStudentClassesByToken } from "@/lib/api/studentService";
import type { StudentClass } from "@/types/student/class";

type TicketCategoryOption = {
  id: TicketCategory;
  name: string;
  nameVi: string;
  icon: React.ReactNode;
  color: string;
};

type TicketType = CreateTicket["type"];

type TeacherOption = {
  optionKey: string;
  teacherId: string;
  teacherName: string;
  classId?: string;
  classLabel?: string;
};

const normalizeClassItems = (response: any): StudentClass[] => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.classes?.items)) return data.classes.items;
  return [];
};

// Ticket Categories with icons
const ticketCategories: TicketCategoryOption[] = [
  { id: 'Homework', name: 'Homework', nameVi: 'Bài tập', icon: <FileText size={16} />, color: 'from-emerald-500 to-teal-500' },
  { id: 'Finance', name: 'Finance', nameVi: 'Học phí', icon: <Building2 size={16} />, color: 'from-amber-500 to-orange-500' },
  { id: 'Schedule', name: 'Schedule', nameVi: 'Lịch học', icon: <Clock size={16} />, color: 'from-blue-500 to-cyan-500' },
  { id: 'Tech', name: 'Tech', nameVi: 'Kỹ thuật', icon: <HelpCircle size={16} />, color: 'from-purple-500 to-pink-500' },
  { id: 'Other', name: 'Other', nameVi: 'Khác', icon: <Sparkles size={16} />, color: 'from-gray-500 to-slate-500' },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    Resolved: {
      icon: <CheckCircle size={12} />,
      label: 'Đã xử lý',
      color: 'bg-green-500/30 border border-green-400/40 text-green-300'
    },
    Closed: {
      icon: <CheckCircle size={12} />,
      label: 'Đã đóng',
      color: 'bg-gray-500/30 border border-gray-400/40 text-gray-300'
    },
    Open: {
      icon: <Clock size={12} />,
      label: 'Mới tạo',
      color: 'bg-amber-500/30 border border-amber-400/40 text-amber-300'
    },
    InProgress: {
      icon: <Loader2 size={12} className="animate-spin" />,
      label: 'Đang xử lý',
      color: 'bg-blue-500/30 border border-blue-400/40 text-blue-300'
    },
  };

  const { icon, label, color } = config[status] || {
    icon: <AlertCircle size={12} />,
    label: status,
    color: 'bg-purple-500/30 border border-purple-400/40 text-purple-300'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-sm ${color}`}>
      {icon}
      {label}
    </span>
  );
}

function CategorySelectCard({ 
  category, 
  isSelected, 
  onClick 
}: { 
  category: TicketCategoryOption; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl p-3 border transition-all duration-300 cursor-pointer ${
        isSelected
          ? `border-purple-400/60 bg-gradient-to-br ${category.color} bg-opacity-20 shadow-lg shadow-purple-500/20 scale-[1.02]`
          : 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-400/50 hover:scale-[1.01]'
      }`}
    >
      <div className="flex flex-col items-center text-center gap-1.5">
        <div className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-white/20' : 'bg-purple-500/20 group-hover:bg-purple-500/30'}`}>
          <span className={isSelected ? 'text-white' : 'text-purple-300'}>{category.icon}</span>
        </div>
        <div className="font-bold text-xs text-white">{category.nameVi}</div>
        <div className="text-[10px] text-purple-400/70">{category.name}</div>
      </div>
    </button>
  );
}

export default function ApplicationPage() {
  const { selectedProfile } = useSelectedStudentProfile();
  const { user } = useCurrentUser();
  const [activeView, setActiveView] = useState<string>('send');
  const [ticketCategory, setTicketCategory] = useState<TicketCategory | ''>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [latestComments, setLatestComments] = useState<Record<string, TicketComment>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);
  const [ticketType, setTicketType] = useState<TicketType>('General');
  const [selectedTeacherOptionKey, setSelectedTeacherOptionKey] = useState('');
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const resolvedProfileId = selectedProfile?.id 
    || user?.selectedProfile?.id 
    || user?.profiles?.find(p => p.profileType === 'Student')?.id 
    || null;

  // Fetch student classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!resolvedProfileId) {
        setClassId(null);
        setTeacherOptions([]);
        setSelectedTeacherOptionKey('');
        return;
      }

      try {
        const response: any = await getStudentClassesByToken({
          pageSize: 100,
          studentProfileId: resolvedProfileId,
        });

        if (response?.isSuccess || response?.success) {
          const classes = normalizeClassItems(response);
          setClassId(classes[0]?.id ?? null);

          const teachers = classes
            .filter((item) => item.mainTeacherId && item.mainTeacherName)
            .map((item, index) => ({
              optionKey: `${item.id ?? 'class'}-${item.mainTeacherId ?? 'teacher'}-${index}`,
              teacherId: item.mainTeacherId!,
              teacherName: item.mainTeacherName!,
              classId: item.id,
              classLabel: item.title || item.className || item.name || item.code,
            }));

          setTeacherOptions(teachers);
          setSelectedTeacherOptionKey((prev) => {
            if (teachers.length === 0) return '';
            if (teachers.some((teacher) => teacher.optionKey === prev)) return prev;
            return teachers[0].optionKey;
          });
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, [resolvedProfileId]);

  // Load tickets
  useEffect(() => {
    if (resolvedProfileId) {
      loadTickets();
    }
  }, [activeView, resolvedProfileId, user]);

  const loadTickets = async () => {
    if (!resolvedProfileId) return;

    try {
      setIsLoading(true);
      const response = await getTickets({ 
        openedByProfileId: resolvedProfileId,
        pageSize: 100 
      });
      if (response.isSuccess && response.data) {
        const data = response.data as any;
        const allTickets = Array.isArray(data) 
          ? data 
          : (data.items ?? data.tickets?.items ?? []);
        const filtered = resolvedProfileId
          ? allTickets.filter((t: any) => t.openedByProfileId === resolvedProfileId)
          : allTickets;
        setTickets(filtered);

        const ticketsWithComments = filtered.filter((t: Ticket) => t.commentCount > 0);
        if (ticketsWithComments.length > 0) {
          const results = await Promise.allSettled(
            ticketsWithComments.map((t: Ticket) => getTicketById(t.id))
          );
          const map: Record<string, TicketComment> = {};
          results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
              const detail = result.value;
              const comments: TicketComment[] = (detail as any)?.data?.comments ?? (detail as any)?.comments ?? [];
              if (comments.length > 0) {
                map[ticketsWithComments[i].id] = comments[comments.length - 1];
              }
            }
          });
          setLatestComments(map);
        }
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.destructive({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải danh sách đơn. Vui lòng thử lại sau.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabOptions: TabOption[] = [
    { id: 'send', label: 'Gửi đơn mới', icon: <Plus size={16} /> },
    { id: 'history', label: 'Lịch sử đơn', count: tickets?.length || 0, icon: <History size={16} /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketCategory) {
      toast.warning({ title: 'Thiếu thông tin', description: 'Vui lòng chọn danh mục' });
      return;
    }
    if (!subject.trim()) {
      toast.warning({ title: 'Thiếu thông tin', description: 'Vui lòng nhập tiêu đề' });
      return;
    }
    if (!message.trim()) {
      toast.warning({ title: 'Thiếu thông tin', description: 'Vui lòng nhập nội dung' });
      return;
    }
    if (ticketType === 'DirectToTeacher' && !selectedTeacherOptionKey) {
      toast.warning({ title: 'Thiếu thông tin', description: 'Vui lòng chọn giáo viên để gửi trực tiếp' });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (!resolvedProfileId) {
        toast.destructive({ title: 'Lỗi dữ liệu', description: 'Không tìm thấy thông tin profile. Vui lòng chọn lại học sinh.' });
        return;
      }
      
      if (!user?.branchId) {
        toast.destructive({ title: 'Lỗi dữ liệu', description: 'Không tìm thấy thông tin chi nhánh. Vui lòng đăng nhập lại.' });
        return;
      }
      
      const selectedTeacher = teacherOptions.find((teacher) => teacher.optionKey === selectedTeacherOptionKey);
      const payload: CreateTicket = {
        openedByProfileId: resolvedProfileId,
        branchId: user.branchId,
        category: ticketCategory,
        subject: subject.trim(),
        message: message.trim(),
        type: ticketType,
      };

      const classIdForTicket = ticketType === 'DirectToTeacher'
        ? selectedTeacher?.classId ?? classId
        : classId;

      if (classIdForTicket) payload.classId = classIdForTicket;
      if (ticketType === 'DirectToTeacher' && selectedTeacher?.teacherId) {
        payload.assignedToUserId = selectedTeacher.teacherId;
      }

      const response = await createTicket(payload);
      
      if (response.isSuccess) {
        toast.success({
          title: 'Thành công!',
          description: 'Đã gửi đơn hỗ trợ thành công. Chúng tôi sẽ phản hồi trong vòng 48 giờ.',
        });
        setTicketCategory('');
        setSubject('');
        setMessage('');
        setTicketType('General');
        setSelectedTeacherOptionKey(teacherOptions[0]?.optionKey ?? '');
        if (activeView === 'history') loadTickets();
      } else {
        toast.destructive({
          title: 'Gửi đơn thất bại',
          description: response.message || 'Không thể gửi đơn. Vui lòng thử lại.',
        });
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.destructive({
        title: 'Lỗi hệ thống',
        description: 'Đã xảy ra lỗi khi gửi đơn. Vui lòng thử lại sau.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = ticketCategories.find(c => c.id === category);
    return cat?.nameVi || category;
  };

  const getCategoryColor = (category: string) => {
    const cat = ticketCategories.find(c => c.id === category);
    return cat?.color || 'from-purple-500 to-pink-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'InProgress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
  }), [tickets]);

  const selectedCategoryObj = ticketCategories.find(c => c.id === ticketCategory);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header Section */}
      <div className={`shrink-0 px-6 pt-6 pb-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        

        {/* Contact Info Bar */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 backdrop-blur-sm">
            <Mail size={14} className="text-purple-400" />
            <span className="text-xs text-purple-300">support@rex.edu.vn</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 backdrop-blur-sm">
            <Phone size={14} className="text-purple-400" />
            <span className="text-xs text-purple-300">028.73005585</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <FilterTabs 
          tabs={tabOptions}
          activeTab={activeView}
          onChange={setActiveView}
          variant="outline"
          size="md"
          className="mb-5"
        />
      </div>

      {/* Content */}
      <div className={`flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        
        {/* Send Ticket Form */}
        {activeView === 'send' ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl shadow-xl shadow-purple-500/10 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-5 py-3 border-b border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      <Send size={14} className="text-white" />
                    </div>
                    <h2 className="font-bold text-white">Tạo đơn hỗ trợ mới</h2>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                  {/* Ticket Type */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      Loại hỗ trợ <span className="text-pink-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTicketType('General')}
                        className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                          ticketType === 'General'
                            ? 'border-purple-400/60 bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20'
                            : 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-bold text-white text-sm">Gửi trung tâm</div>
                          <div className="text-xs text-purple-400/70 mt-0.5">Hỗ trợ chung</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTicketType('DirectToTeacher')}
                        className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                          ticketType === 'DirectToTeacher'
                            ? 'border-purple-400/60 bg-gradient-to-r from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20'
                            : 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-bold text-white text-sm">Gửi giáo viên</div>
                          <div className="text-xs text-purple-400/70 mt-0.5">Hỗ trợ trực tiếp</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Teacher Select */}
                  {ticketType === 'DirectToTeacher' && (
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        Giáo viên nhận đơn <span className="text-pink-400">*</span>
                      </label>
                      <select
                        value={selectedTeacherOptionKey}
                        onChange={(e) => setSelectedTeacherOptionKey(e.target.value)}
                        className="w-full bg-slate-900/80 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
                      >
                        <option value="" className="text-white">Chọn giáo viên</option>
                        {teacherOptions.map((teacher) => (
                          <option key={teacher.optionKey} value={teacher.optionKey} className="text-white">
                            {teacher.teacherName}{teacher.classLabel ? ` - ${teacher.classLabel}` : ''}
                          </option>
                        ))}
                      </select>
                      {teacherOptions.length === 0 && (
                        <p className="text-xs text-amber-300 mt-1.5">
                          Chưa tìm thấy giáo viên chủ nhiệm trong danh sách lớp của học sinh.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      Danh mục <span className="text-pink-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {ticketCategories.map((cat) => (
                        <CategorySelectCard
                          key={cat.id}
                          category={cat}
                          isSelected={ticketCategory === cat.id}
                          onClick={() => setTicketCategory(cat.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      Tiêu đề <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Nhập tiêu đề ngắn gọn..."
                      className="w-full bg-slate-900/80 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-purple-400/40"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      Nội dung <span className="text-pink-400">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                      rows={5}
                      className="w-full bg-slate-900/80 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-purple-400/40"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex items-center gap-3 pt-3 border-t border-purple-500/30 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setTicketCategory('');
                        setSubject('');
                        setMessage('');
                        setTicketType('General');
                        setSelectedTeacherOptionKey(teacherOptions[0]?.optionKey ?? '');
                      }}
                      className="px-5 py-2.5 text-sm bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 rounded-xl font-semibold transition-all text-purple-300 hover:text-white cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {isSubmitting ? 'Đang gửi...' : 'Gửi đơn'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl shadow-xl shadow-purple-500/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={18} className="text-purple-400" />
                  <h3 className="font-bold text-white">Lưu ý quan trọng</h3>
                </div>
                <ul className="space-y-2 text-sm text-purple-300/70">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Bộ phận xử lý sẽ trả lời trong vòng 48h
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Cung cấp thông tin chi tiết để được hỗ trợ nhanh chóng
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    Theo dõi trạng thái đơn tại mục "Lịch sử đơn"
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl shadow-xl shadow-purple-500/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck size={18} className="text-purple-400" />
                  <h3 className="font-bold text-white">Thông tin liên hệ</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-300/70 text-sm">
                    <Phone size={14} className="text-purple-400" />
                    <span>028.73005585</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300/70 text-sm">
                    <Mail size={14} className="text-purple-400" />
                    <span>support@rex.edu.vn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Ticket History */
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl shadow-xl shadow-purple-500/10 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-5 py-3 border-b border-purple-500/30">
              <div className="flex items-center gap-2">
                <History size={18} className="text-purple-300" />
                <h2 className="font-bold text-white">Lịch sử đơn hỗ trợ</h2>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300">
                  {tickets.length} đơn
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <span className="ml-3 text-white font-semibold">Đang tải...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-purple-500/10 mb-3">
                  <FileText className="w-12 h-12 text-purple-400/40" />
                </div>
                <h3 className="font-bold text-purple-300 mb-1">Chưa có đơn nào</h3>
                <p className="text-purple-400/60 text-sm">Bạn chưa gửi đơn hỗ trợ nào</p>
                <button
                  onClick={() => setActiveView('send')}
                  className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:scale-105 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  Gửi đơn mới
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-purple-950/40 border-b border-purple-500/30">
                        <th className="px-4 py-3 text-left text-xs font-bold text-purple-400 uppercase tracking-wider">Danh mục</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-purple-400 uppercase tracking-wider">Tiêu đề</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-purple-400 uppercase tracking-wider hidden md:table-cell">Nội dung</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-purple-400 uppercase tracking-wider hidden lg:table-cell">Phản hồi mới</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-purple-400 uppercase tracking-wider hidden sm:table-cell">Ngày tạo</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-purple-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-purple-400 uppercase tracking-wider">Bình luận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/20">
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-purple-500/5 transition-all">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${getCategoryColor(ticket.category)} bg-opacity-20 text-purple-200`}>
                              {getCategoryLabel(ticket.category)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-white font-medium">{ticket.subject}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-sm text-purple-300/70 line-clamp-2">{ticket.message}</p>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell max-w-[200px]">
                            {latestComments[ticket.id] ? (
                              <div className="space-y-0.5">
                                <p className="text-xs text-purple-400 font-medium truncate">
                                  {latestComments[ticket.id].commenterProfileName || latestComments[ticket.id].commenterUserName}
                                </p>
                                <p className="text-sm text-purple-300/70 line-clamp-2">{latestComments[ticket.id].message}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-purple-400/50 italic">Chưa có phản hồi</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs text-purple-400/70">{formatDate(ticket.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={ticket.status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <MessageSquare size={14} className="text-purple-400" />
                              <span className="text-sm text-purple-300 font-semibold">{ticket.commentCount}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Note */}
                <div className="px-5 py-3 bg-purple-950/20 border-t border-purple-500/30">
                  <p className="text-[11px] text-purple-400/60 text-center">
                    Học sinh có nhu cầu thực hiện các thủ tục, dịch vụ vui lòng liên hệ Trung tâm Dịch vụ Học sinh, 
                    điện thoại: <span className="text-purple-300">028.73005585</span>, 
                    email: <span className="text-purple-300">support@rex.edu.vn</span>
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}