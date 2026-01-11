"use client";
import { useState, useEffect, useMemo } from "react";
import { 
  FilePlus2, 
  ReceiptText, 
  Download, 
  Eye, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  ChevronDown,
  Printer,
  Share2,
  BarChart3,
  FileText,
  ArrowUpDown,
  ChevronUp,
  BookOpen,
  Receipt
} from "lucide-react";

type InvoiceStatus = "draft" | "issued" | "pending" | "paid" | "overdue";
type InvoiceType = "tuition" | "material" | "exam" | "other";
type SortColumn = "id" | "student" | "amount" | "dueDate" | "status";

interface Invoice {
  id: string;
  student: string;
  studentId: string;
  course: string;
  amount: number;
  period: string;
  dueDate: string;
  status: InvoiceStatus;
  type: InvoiceType;
  createdAt: string;
  issuedAt?: string;
  paidAt?: string;
  color: string;
}

export default function Page() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { 
      id: "INV-10542", 
      student: "Nguyễn Văn A", 
      studentId: "HV001",
      course: "IELTS Foundation - A1", 
      amount: 2500000, 
      period: "10/2025", 
      dueDate: "15/10/2025",
      status: "issued", 
      type: "tuition",
      createdAt: "01/10/2025",
      issuedAt: "02/10/2025",
      color: "from-emerald-500 to-teal-500"
    },
    { 
      id: "INV-10543", 
      student: "Trần Thị B", 
      studentId: "HV002",
      course: "TOEIC Intermediate", 
      amount: 1800000, 
      period: "10/2025", 
      dueDate: "10/10/2025",
      status: "pending", 
      type: "tuition",
      createdAt: "01/10/2025",
      color: "from-amber-500 to-orange-500"
    },
    { 
      id: "INV-10544", 
      student: "Lê Văn C", 
      studentId: "HV003",
      course: "Business English", 
      amount: 3200000, 
      period: "10/2025", 
      dueDate: "05/10/2025",
      status: "overdue", 
      type: "tuition",
      createdAt: "25/09/2025",
      color: "from-rose-500 to-pink-500"
    },
    { 
      id: "INV-10545", 
      student: "Phạm Thị D", 
      studentId: "HV004",
      course: "Academic Writing", 
      amount: 1500000, 
      period: "10/2025", 
      dueDate: "20/10/2025",
      status: "paid", 
      type: "material",
      createdAt: "28/09/2025",
      issuedAt: "28/09/2025",
      paidAt: "30/09/2025",
      color: "from-blue-500 to-sky-500"
    },
    { 
      id: "INV-10546", 
      student: "Hoàng Minh Đức", 
      studentId: "HV005",
      course: "IELTS Advanced", 
      amount: 4200000, 
      period: "10/2025", 
      dueDate: "15/10/2025",
      status: "draft", 
      type: "tuition",
      createdAt: "03/10/2025",
      color: "from-gray-500 to-gray-600"
    },
    { 
      id: "INV-10547", 
      student: "Vũ Thị Lan", 
      studentId: "HV006",
      course: "TOEIC Advanced", 
      amount: 2800000, 
      period: "10/2025", 
      dueDate: "01/10/2025",
      status: "paid", 
      type: "exam",
      createdAt: "20/09/2025",
      issuedAt: "20/09/2025",
      paidAt: "25/09/2025",
      color: "from-purple-500 to-indigo-500"
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<InvoiceStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<InvoiceType | "all">("all");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const statusConfig = {
    draft: { text: "Bản nháp", color: "bg-gray-100 text-gray-700", icon: FileText },
    pending: { text: "Chờ phát hành", color: "bg-amber-100 text-amber-700", icon: Clock },
    issued: { text: "Đã phát hành", color: "bg-blue-100 text-blue-700", icon: Send },
    paid: { text: "Đã thanh toán", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    overdue: { text: "Quá hạn", color: "bg-rose-100 text-rose-700", icon: AlertCircle },
  };

  const typeConfig = {
    tuition: { text: "Học phí", color: "from-pink-500 to-rose-500", icon: BookOpen },
    material: { text: "Tài liệu", color: "from-blue-500 to-sky-500", icon: FileText },
    exam: { text: "Thi cử", color: "from-purple-500 to-indigo-500", icon: ReceiptText },
    other: { text: "Khác", color: "from-gray-500 to-gray-600", icon: Receipt },
  };

  const stats = {
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.status === "paid").length,
    overdueAmount: invoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + inv.amount, 0),
  };

  // SortableHeader Component
  function SortableHeader({ 
    label, 
    column, 
  }: { 
    label: string; 
    column: SortColumn; 
  }) {
    const isActive = sortColumn === column;
    
    return (
      <button
        onClick={() => {
          if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
          } else {
            setSortColumn(column);
            setSortDirection("asc");
          }
        }}
        className="flex items-center gap-2 hover:text-pink-600 transition-colors cursor-pointer text-left"
      >
        <span>{label}</span>
        <div className="flex flex-col">
          {isActive ? (
            sortDirection === "asc" ? (
              <ChevronUp size={14} className="text-pink-600" />
            ) : (
              <ChevronDown size={14} className="text-pink-600" />
            )
          ) : (
            <ArrowUpDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>
    );
  }

  const filteredInvoices = useMemo(() => {
    let result = invoices.filter(invoice => {
      if (activeFilter !== "all" && invoice.status !== activeFilter) return false;
      if (selectedType !== "all" && invoice.type !== selectedType) return false;
      if (searchQuery && !invoice.student.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !invoice.studentId.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !invoice.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    // Apply sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (sortColumn) {
          case "id":
            aVal = a.id;
            bVal = b.id;
            break;
          case "student":
            aVal = a.student.toLowerCase();
            bVal = b.student.toLowerCase();
            break;
          case "amount":
            aVal = a.amount;
            bVal = b.amount;
            break;
          case "dueDate":
            // Parse date: "15/10/2025" -> Date object
            const parseDate = (dateStr: string) => {
              const [day, month, year] = dateStr.split("/").map(Number);
              return new Date(year, month - 1, day);
            };
            aVal = parseDate(a.dueDate).getTime();
            bVal = parseDate(b.dueDate).getTime();
            break;
          case "status":
            const statusOrder = { draft: 0, pending: 1, issued: 2, paid: 3, overdue: 4 };
            aVal = statusOrder[a.status];
            bVal = statusOrder[b.status];
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [invoices, activeFilter, selectedType, searchQuery, sortColumn, sortDirection]);

  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  const issueInvoice = (id: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id 
        ? { ...inv, status: "issued", issuedAt: new Date().toLocaleDateString('vi-VN') }
        : inv
    ));
  };

  const exportReceipt = (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;

    const content = `
      BIÊN LAI THANH TOÁN
      ====================
      Mã hóa đơn: ${invoice.id}
      Học viên: ${invoice.student} (ID: ${invoice.studentId})
      Khóa học: ${invoice.course}
      Số tiền: ${fmt(invoice.amount)}
      Kỳ: ${invoice.period}
      Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}
      
      Trung tâm Giáo dục ABC
      Địa chỉ: 123 Đường ABC, Quận XYZ
      Số điện thoại: 0987 654 321
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bien-lai-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createNewInvoice = () => {
    const newInvoice: Invoice = {
      id: `INV-${10000 + invoices.length + 1}`,
      student: "Học viên mới",
      studentId: `HV${100 + invoices.length + 1}`,
      course: "Khóa học mới",
      amount: 0,
      period: "11/2025",
      dueDate: "15/11/2025",
      status: "draft",
      type: "tuition",
      createdAt: new Date().toLocaleDateString('vi-VN'),
      color: "from-gray-500 to-gray-600"
    };
    
    setInvoices([newInvoice, ...invoices]);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <ReceiptText size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Hóa đơn & Phiếu thu
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl border border-pink-200 overflow-hidden">
        {/* Header Actions */}
        <div className="px-6 py-4 border-b border-pink-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-pink-500" />
              <h3 className="font-bold text-gray-900">Danh sách hóa đơn</h3>
              <span className="text-sm text-gray-600">({filteredInvoices.length}/{invoices.length})</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={createNewInvoice}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
              >
                <FilePlus2 size={16} />
                Hóa đơn mới
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm hóa đơn, học viên, hoặc ID..."
                className="w-full rounded-xl border border-pink-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>
            
            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <div className="flex bg-white border border-pink-200 rounded-xl p-1">
                {(["all", "draft", "pending", "issued", "paid", "overdue"] as const).map((filter) => {
                  const config = filter === "all" 
                    ? { text: "Tất cả", color: "bg-gray-100 text-gray-700" }
                    : statusConfig[filter];
                  
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                        activeFilter === filter
                          ? filter === "all" 
                            ? "bg-gray-900 text-white"
                            : `bg-gradient-to-r ${filter === "draft" ? "from-gray-500 to-gray-600" : filter === "pending" ? "from-amber-500 to-orange-500" : filter === "issued" ? "from-blue-500 to-sky-500" : filter === "paid" ? "from-emerald-500 to-teal-500" : "from-rose-500 to-pink-500"} text-white`
                          : "bg-white text-gray-700 hover:bg-pink-50"
                      }`}
                    >
                      {filter === "all" ? "Tất cả" : config.text}
                    </button>
                  );
                })}
              </div>
              
              {/* Type Filter */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as InvoiceType | "all")}
                  className="pl-3 pr-8 py-2.5 rounded-xl border border-pink-200 bg-white text-sm appearance-none outline-none focus:ring-2 focus:ring-pink-300"
                >
                  <option value="all">Tất cả loại</option>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.text}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5">
                <tr className="text-gray-700">
                  <th className="px-6 py-3 text-left font-semibold whitespace-nowrap">
                    <SortableHeader label="Mã hóa đơn" column="id" />
                  </th>
                  <th className="px-6 py-3 text-left font-semibold whitespace-nowrap">
                    <SortableHeader label="Học viên" column="student" />
                  </th>
                  <th className="px-6 py-3 text-left font-semibold whitespace-nowrap">Khóa học</th>
                  <th className="px-6 py-3 text-left font-semibold whitespace-nowrap">
                    <SortableHeader label="Số tiền" column="amount" />
                  </th>
                  <th className="px-6 py-3 text-left font-semibold whitespace-nowrap">
                    <SortableHeader label="Hạn thanh toán" column="dueDate" />
                  </th>
                  <th className="px-6 py-3 text-left font-semibold whitespace-nowrap">
                    <SortableHeader label="Trạng thái" column="status" />
                  </th>
                  <th className="px-6 py-3 text-left font-semibold whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => {
                    const StatusIcon = statusConfig[invoice.status].icon;
                    const TypeConfig = typeConfig[invoice.type];
                    
                    return (
                      <tr key={invoice.id} className="border-t border-pink-100 hover:bg-pink-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">{invoice.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{invoice.student}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{invoice.course}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{fmt(invoice.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{invoice.dueDate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig[invoice.status].color}`}>
                            <StatusIcon size={12} />
                            {statusConfig[invoice.status].text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => exportReceipt(invoice.id)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Xuất biên lai"
                            >
                              <ReceiptText size={16} />
                            </button>
                            
                            <button
                              onClick={() => {/* View details */}}
                              className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                            
                            <button
                              onClick={() => {/* Print */}}
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="In hóa đơn"
                            >
                              <Printer size={16} />
                            </button>
                            
                            {invoice.status === "pending" && (
                              <button
                                onClick={() => issueInvoice(invoice.id)}
                                className="px-3 py-1 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:shadow-md transition-all cursor-pointer"
                              >
                                Phát hành
                              </button>
                            )}
                            
                            {invoice.status === "issued" && (
                              <button
                                onClick={() => {/* Send */}}
                                className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Gửi cho học viên"
                              >
                                <Send size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="inline-flex p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl mb-4">
                        <Search size={32} className="text-pink-500" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy hóa đơn</h4>
                      <p className="text-gray-600">Không có hóa đơn nào khớp với bộ lọc hiện tại</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="px-6 py-4 border-t border-pink-200 bg-gradient-to-r from-pink-50/50 to-rose-50/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Tổng cộng: {filteredInvoices.length} hóa đơn • {fmt(filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 text-sm rounded-xl border border-pink-200 bg-white text-gray-700 hover:bg-pink-50 transition-colors flex items-center gap-1 cursor-pointer">
                <Download size={14} />
                Xuất Excel
              </button>
              <button className="px-3 py-1.5 text-sm rounded-xl border border-pink-200 bg-white text-gray-700 hover:bg-pink-50 transition-colors flex items-center gap-1 cursor-pointer">
                <Printer size={14} />
                In tất cả
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}