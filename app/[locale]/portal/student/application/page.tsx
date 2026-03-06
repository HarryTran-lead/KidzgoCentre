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
  MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { FilterTabs, TabOption } from "@/components/portal/student/FilterTabs";
import { createTicket, getTickets, getTicketById } from "@/lib/api/ticketService";
import type { TicketCategory, Ticket, TicketComment } from "@/types/student/ticket";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "@/hooks/use-toast";
import { getStudentClassesByToken } from "@/lib/api/studentService";

type TicketCategoryOption = {
  id: TicketCategory;
  name: string;
  nameVi: string;
};

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

  // Resolve profileId: prefer selectedProfile from localStorage, fallback to user.selectedProfile from /me API, then Student profile
  const resolvedProfileId = selectedProfile?.id 
    || user?.selectedProfile?.id 
    || user?.profiles?.find(p => p.profileType === 'Student')?.id 
    || null;

  // Fetch student classes to get classId
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response: any = await getStudentClassesByToken({ pageSize: 10 });
        if (response.isSuccess && response.data) {
          // Handle multiple response shapes: data.items, data.classes.items, or data as array
          const classes = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data?.items)
              ? response.data.items
              : Array.isArray(response.data?.classes?.items)
                ? response.data.classes.items
                : [];
          if (classes.length > 0) {
            setClassId(classes[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  // Load tickets when viewing history
  useEffect(() => {
    if (activeView === 'history') {
      loadTickets();
    }
  }, [activeView, resolvedProfileId, user]);

  const loadTickets = async () => {
    if (!resolvedProfileId) {
      return;
    }

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
        // Client-side filter: only show tickets matching current profileId
        const filtered = resolvedProfileId
          ? allTickets.filter((t: any) => t.openedByProfileId === resolvedProfileId)
          : allTickets;
        setTickets(filtered);

        // Fetch latest comment for tickets that have comments (parallel)
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

  // Tab options for FilterTabs
  const tabOptions: TabOption[] = [
    { id: 'send', label: 'Gửi đơn mới', icon: <Plus className="w-4 h-4" /> },
    { id: 'history', label: 'Lịch sử đơn', count: tickets?.length || 0, icon: <History className="w-4 h-4" /> },
  ];

  // Ticket Categories
  const ticketCategories: TicketCategoryOption[] = [
    { id: 'Homework', name: 'Homework', nameVi: 'Bài tập' },
    { id: 'Finance', name: 'Finance', nameVi: 'Học phí' },
    { id: 'Schedule', name: 'Schedule', nameVi: 'Lịch học' },
    { id: 'Tech', name: 'Tech', nameVi: 'Kỹ thuật' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketCategory) {
      toast.warning({
        title: 'Thiếu thông tin',
        description: 'Vui lòng chọn danh mục'
      });
      return;
    }
    if (!subject.trim()) {
      toast.warning({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tiêu đề'
      });
      return;
    }
    if (!message.trim()) {
      toast.warning({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập nội dung'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!resolvedProfileId) {
        toast.destructive({
          title: 'Lỗi dữ liệu',
          description: 'Không tìm thấy thông tin profile. Vui lòng chọn lại học sinh.'
        });
        return;
      }
      
      if (!user?.branchId) {
        toast.destructive({
          title: 'Lỗi dữ liệu',
          description: 'Không tìm thấy thông tin chi nhánh. Vui lòng đăng nhập lại.'
        });
        return;
      }
      
      // Build payload with all required fields
      const payload: any = {
        openedByProfileId: resolvedProfileId,
        branchId: user.branchId,
        category: ticketCategory as TicketCategory,
        subject: subject.trim(),
        message: message.trim(),
      };

      // Add classId only if it exists
      if (classId) {
        payload.classId = classId;
      }
      const response = await createTicket(payload);
      
      if (response.isSuccess) {
        toast.success({
          title: 'Thành công!',
          description: 'Đã gửi đơn hỗ trợ thành công. Chúng tôi sẽ phản hồi trong vòng 48 giờ.',
          variant: 'success',
        });
        // Reset form
        setTicketCategory('');
        setSubject('');
        setMessage('');
        // Reload tickets if in history view
        if (activeView === 'history') {
          loadTickets();
        }
      } else {
        toast.destructive({
          title: 'Gửi đơn thất bại',
          description: response.message || 'Không thể gửi đơn. Vui lòng thử lại.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.destructive({
        title: 'Lỗi hệ thống',
        description: 'Đã xảy ra lỗi khi gửi đơn. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="w-3 h-3" />
            Đã xử lý
          </span>
        );
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock className="w-3 h-3" />
            Mới tạo
          </span>
        );
      case 'InProgress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" />
            Đang xử lý
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = ticketCategories.find(c => c.id === category);
    return cat?.nameVi || category;
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

  return (
    <div className="min-h-[calc(100vh-120px)] text-white pb-28">
      
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-black flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          Đơn yêu cầu hỗ trợ
        </h1>
        <p className="text-gray-400 text-sm">
          Gửi đơn cho giáo viên hoặc phòng quản lý trung tâm để nhận sự trợ giúp và phản hồi
        </p>
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

      {/* Content */}
      {activeView === 'send' ? (
        /* Send Ticket Form */
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-5 mb-6">
          {/* Notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 pb-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-300/80">
                  <li>Bộ phận xử lý sẽ trả lời đơn của học sinh trong vòng 48h.</li>
                  <li>Vui lòng cung cấp thông tin chi tiết để được hỗ trợ nhanh chóng.</li>
                  <li>Bạn có thể theo dõi trạng thái xử lý đơn tại mục "Lịch sử đơn".</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Danh mục <span className="text-red-400">*</span>
              </label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              >
                <option value="" className="text-white">Chọn danh mục</option>
                {ticketCategories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="text-white">
                    {cat.nameVi} ({cat.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Tiêu đề <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Nhập tiêu đề..."
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-gray-500"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Nội dung <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập nội dung chi tiết..."
                rows={7}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-gray-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/10 justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg font-semibold transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi đơn'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTicketCategory('');
                  setSubject('');
                  setMessage('');
                }}
                className="px-5 py-2.5 text-sm bg-slate-800/50 border border-white/10 hover:bg-slate-800 rounded-lg font-semibold transition-all text-gray-400 hover:text-white"
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Ticket History */
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <h2 className="text-base font-bold px-5 py-3">Lịch sử đơn hỗ trợ</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">Đang tải...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-800 border-b border-white/10">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Danh mục</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiêu đề</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nội dung</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phản hồi</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Ngày tạo</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Trạng thái</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Bình luận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(tickets || []).map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-white/5 transition-all">
                        <td className="px-3 py-3">
                          <span className="text-sm font-medium text-cyan-400">{getCategoryLabel(ticket.category)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm text-gray-300 font-medium">{ticket.subject}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm text-gray-300 line-clamp-2">{ticket.message}</p>
                        </td>
                        <td className="px-3 py-3 max-w-55">
                          {latestComments[ticket.id] ? (
                            <div className="space-y-0.5">
                              <p className="text-xs text-cyan-400 font-medium truncate">
                                {latestComments[ticket.id].commenterProfileName || latestComments[ticket.id].commenterUserName}
                              </p>
                              <p className="text-sm text-gray-300 line-clamp-2">{latestComments[ticket.id].message}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 italic">Chưa có phản hồi</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-400">{formatDate(ticket.createdAt)}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-400">{ticket.commentCount}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {(!tickets || tickets.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-gray-600 mb-3" />
                  <h3 className="text-base font-semibold text-gray-400 mb-1.5">Chưa có đơn nào</h3>
                  <p className="text-gray-500 text-sm">Bạn chưa gửi đơn hỗ trợ nào</p>
                  <button
                    onClick={() => setActiveView('send')}
                    className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Gửi đơn mới
                  </button>
                </div>
              )}
            </>
          )}

          {/* Footer Note */}
          <div className="px-5 py-2 bg-slate-800/30 border-t border-white/10">
            <p className="text-[11px] text-gray-500 text-center">
              Học sinh có nhu cầu thực hiện các thủ tục, dịch vụ vui lòng liên hệ Trung tâm Dịch vụ Học sinh, 
              điện thoại: <span className="text-cyan-400">028.73005585</span>, 
              email: <span className="text-cyan-400">support@kidzgo.edu.vn</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
