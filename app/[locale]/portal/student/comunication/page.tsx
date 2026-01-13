'use client';

import { 
  FileText, 
  Send, 
  Upload, 
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Paperclip,
  X,
  Plus,
  FileSpreadsheet,
  FileImage,
  File,
  History
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { FilterTabs, TabOption } from "@/components/portal/student/FilterTabs";

// Types
interface Application {
  id: string;
  type: string;
  purpose: string;
  createDate: string;
  processNote: string;
  fileName?: string;
  fileUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  responseDate?: string;
}

type ApplicationType = {
  id: string;
  name: string;
  nameVi: string;
};

export default function CommunicationPage() {
  const [activeView, setActiveView] = useState<string>('send');
  const [applicationType, setApplicationType] = useState<string>('');
  const [reason, setReason] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tab options for FilterTabs
  const tabOptions: TabOption[] = [
    { id: 'send', label: 'Gửi đơn mới', icon: <Plus className="w-4 h-4" /> },
    { id: 'history', label: 'Lịch sử đơn', count: 4, icon: <History className="w-4 h-4" /> },
  ];

  // Application Types
  const applicationTypes: ApplicationType[] = [
    { id: 'leave', name: 'Leave Request', nameVi: 'Xin nghỉ học' },
    { id: 'certificate', name: 'Certificate Request', nameVi: 'Xin giấy xác nhận' },
    { id: 'transfer', name: 'Class Transfer', nameVi: 'Chuyển lớp' },
    { id: 'tuition', name: 'Tuition Support', nameVi: 'Hỗ trợ học phí' },
    { id: 'complaint', name: 'Complaint', nameVi: 'Khiếu nại' },
    { id: 'feedback', name: 'Feedback', nameVi: 'Góp ý' },
    { id: 'schedule', name: 'Schedule Change', nameVi: 'Đổi lịch học' },
    { id: 'refund', name: 'Refund Request', nameVi: 'Hoàn học phí' },
    { id: 'other', name: 'Other', nameVi: 'Khác' },
  ];

  // Mock Application History Data
  const applications: Application[] = [
    {
      id: '1',
      type: 'Xin nghỉ học',
      purpose: 'Em xin phép nghỉ học ngày 15/01/2026 do bị ốm.',
      createDate: '12/01/2026',
      processNote: 'Đã duyệt. Học sinh nhớ bổ sung bài học khi quay lại.',
      status: 'approved',
      responseDate: '12/01/2026 08:27:08'
    },
    {
      id: '2',
      type: 'Xin giấy xác nhận',
      purpose: 'Em xin giấy xác nhận đang học để làm thủ tục.',
      createDate: '15/09/2025',
      processNote: 'Học sinh vui lòng đến Phòng quản lý nhận giấy xác nhận vào 14h00 ngày 16/09/2025 nhé.',
      status: 'approved',
      responseDate: '16/09/2025 08:35:37'
    },
    {
      id: '3',
      type: 'Chuyển lớp',
      purpose: 'Em xin đăng ký học vượt môn MLN131 sau khi hoàn tất môn học MLN111 vào đầu half 1 kỳ fall2025.',
      createDate: '31/08/2025',
      processNote: 'Không đủ điều kiện chuyển lớp. Học sinh cần hoàn thành khóa học hiện tại.',
      status: 'rejected',
      responseDate: '02/09/2025'
    },
    {
      id: '4',
      type: 'Góp ý',
      purpose: 'Em muốn góp ý về việc tăng cường hoạt động ngoại khóa cho lớp.',
      createDate: '10/01/2026',
      processNote: '',
      status: 'pending',
    },
  ];

  const allowedExtensions = ['xlsx', 'pdf', 'docx', 'doc', 'xls', 'jpg', 'png', 'zip'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && allowedExtensions.includes(extension)) {
        setSelectedFile(file);
      } else {
        alert('File không hợp lệ. Vui lòng chọn file có định dạng: ' + allowedExtensions.join(', '));
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationType) {
      alert('Vui lòng chọn loại đơn');
      return;
    }
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do');
      return;
    }
    // Handle submit logic here
    console.log('Submitting:', { applicationType, reason, selectedFile });
    alert('Đã gửi đơn thành công!');
    // Reset form
    setApplicationType('');
    setReason('');
    setSelectedFile(null);
  };

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="w-3 h-3" />
            Đã duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            Từ chối
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock className="w-3 h-3" />
            Đang xử lý
          </span>
        );
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <File className="w-4 h-4" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls'].includes(ext || '')) return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
    if (['jpg', 'png', 'jpeg'].includes(ext || '')) return <FileImage className="w-4 h-4 text-blue-400" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-[calc(100vh-120px)] text-white pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          Gửi đơn hỗ trợ
        </h1>
        <p className="text-gray-400">
          Gửi đơn cho giáo viên hoặc phòng quản lý trung tâm để nhận sự trợ giúp và phản hồi
        </p>
      </div>

      {/* Tab Navigation - using FilterTabs component */}
      <FilterTabs 
        tabs={tabOptions}
        activeTab={activeView}
        onChange={setActiveView}
        variant="outline"
        size="md"
        className="mb-6"
      />

      {/* Content */}
      {activeView === 'send' ? (
        /* Send Application Form */
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          {/* Notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                  <li>Bộ phận xử lý đơn sẽ trả lời đơn của học sinh trong vòng 48h (trừ đơn rút tiền, đơn phúc tra, chuyển cơ sở...).</li>
                  <li>Để hạn chế SPAM, thời gian trả lời đơn có tính chất SPAM theo nguyên tắc: Khi học sinh gửi N đơn (N≥1) cho cùng một yêu cầu thì thời gian trả lời trong vòng Nx48h.</li>
                  <li>Vì vậy học sinh cần cân nhắc trước khi gửi đơn với cùng một nội dung để nhận được trả lời/giải quyết nhanh nhất theo quy định.</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Application Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Loại đơn <span className="text-red-400">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between hover:border-cyan-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <span className={applicationType ? 'text-white' : 'text-gray-500'}>
                      {applicationType 
                        ? applicationTypes.find(t => t.id === applicationType)?.nameVi 
                        : 'Chọn loại đơn'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                      {/* Custom Scrollable Dropdown */}
                      <div className="max-h-48 overflow-y-auto custom-scrollbar [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900/50 [&::-webkit-scrollbar-thumb]:bg-cyan-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/70">
                        {applicationTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              setApplicationType(type.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-cyan-500/20 transition-all ${
                              applicationType === type.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300'
                            }`}
                          >
                            <span className="font-medium">{type.nameVi}</span>
                            <span className="text-gray-500 text-sm ml-2">({type.name})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  File đính kèm
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".xlsx,.pdf,.docx,.doc,.xls,.jpg,.png,.zip"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl cursor-pointer hover:bg-slate-800 hover:border-cyan-500/50 transition-all"
                  >
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Chọn tệp</span>
                  </label>
                  
                  {selectedFile ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <Paperclip className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-cyan-300 max-w-[150px] truncate">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Không có tệp nào được chọn</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Định dạng file cho phép: xlsx, pdf, docx, doc, xls, jpg, png, zip
                </p>
              </div>

              {/* Download Template */}
              <div className="pt-2">
                <button type="button" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/20 transition-all">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Tải mẫu đơn tại đây</span>
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Reason */}
              <div className="h-full flex flex-col">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Lý do <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do gửi đơn..."
                  rows={8}
                  className="flex-1 w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-gray-500 custom-scrollbar [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900/50 [&::-webkit-scrollbar-thumb]:bg-cyan-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/70"
                />
              </div>
            </div>

            {/* Submit Buttons - Full Width */}
            <div className="lg:col-span-2 flex items-center gap-4 pt-4 border-t border-white/10">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25"
              >
                <Send className="w-4 h-4" />
                Gửi đơn
              </button>
              <button
                type="button"
                onClick={() => {
                  setApplicationType('');
                  setReason('');
                  setSelectedFile(null);
                }}
                className="px-6 py-3 bg-slate-800/50 border border-white/10 hover:bg-slate-800 rounded-xl font-semibold transition-all text-gray-400 hover:text-white"
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Application History */
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <h2 className="text-lg font-bold px-6 py-4">Thông tin xử lý đơn từ</h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Loại đơn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nội dung</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phản hồi</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">File</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Trạng thái</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">Ngày phản hồi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-white/5 transition-all">
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-cyan-400">{app.type}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-300 line-clamp-2">{app.purpose}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">{app.createDate}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {app.processNote || <span className="text-gray-500 italic">Đang chờ xử lý...</span>}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {app.fileName ? (
                        <button className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all inline-flex items-center gap-1">
                          {getFileIcon(app.fileName)}
                        </button>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-gray-400">
                        {app.responseDate || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {applications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Chưa có đơn nào</h3>
              <p className="text-gray-500">Bạn chưa gửi đơn hỗ trợ nào</p>
              <button
                onClick={() => setActiveView('send')}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                Gửi đơn mới
              </button>
            </div>
          )}

          {/* Footer Note */}
          <div className="px-6 py-4 bg-slate-800/30 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
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
