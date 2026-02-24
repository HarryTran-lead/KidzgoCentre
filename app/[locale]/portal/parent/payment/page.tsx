"use client";

import { useState } from "react";
import { Receipt, CreditCard, Wallet, History, QrCode, ArrowRight, CheckCircle, AlertCircle, Download, Banknote, TrendingUp, Filter, Sparkles, Calendar, Users } from "lucide-react";

type TabType = "invoices" | "payment" | "history";

const MOCK_INVOICES = [
  {
    id: "INV-2024-001",
    month: "Tháng 01/2025",
    amount: 2500000,
    dueDate: "15/01/2025",
    status: "pending",
    description: "Học phí tháng 1/2025",
  },
  {
    id: "INV-2024-012",
    month: "Tháng 12/2024",
    amount: 2500000,
    dueDate: "15/12/2024",
    status: "paid",
    paidDate: "10/12/2024",
    description: "Học phí tháng 12/2024",
  },
];

const MOCK_PAYMENT_HISTORY = [
  {
    id: "PAY-001",
    date: "10/12/2024",
    amount: 2500000,
    method: "Chuyển khoản",
    invoice: "INV-2024-012",
    status: "success",
  },
  {
    id: "PAY-002",
    date: "08/11/2024",
    amount: 2500000,
    method: "QR PayOS",
    invoice: "INV-2024-011",
    status: "success",
  },
];

// Badge Component
function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "red" | "black";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    black: "bg-gray-900 text-white border border-gray-800"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const totalDebt = MOCK_INVOICES.filter((inv) => inv.status === "pending").reduce(
    (sum, inv) => sum + inv.amount,
    0
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + " ₫";
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return <Badge color="black">Đã thanh toán</Badge>;
    }
    return <Badge color="red">Chưa thanh toán</Badge>;
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method.includes("QR")) return <QrCode className="w-4 h-4 text-gray-700" />;
    if (method.includes("Chuyển khoản")) return <Banknote className="w-4 h-4 text-gray-700" />;
    return <CreditCard className="w-4 h-4 text-gray-700" />;
  };

  const paidInvoices = MOCK_INVOICES.filter((inv) => inv.status === "paid").length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <Wallet className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Thanh toán học phí
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý hóa đơn và thanh toán trực tuyến
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer text-gray-700">
          <Filter size={16} className="text-gray-600" /> Lọc theo tháng
        </button>
      </div>

      {/* Stats Cards - Redesigned with Red-Black-White theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Công nợ</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(totalDebt)}</div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex items-center gap-1">
            <Calendar size={12} className="text-red-600" />
            Hạn thanh toán: 15/01/2025
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Lần thanh toán</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">{MOCK_PAYMENT_HISTORY.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex items-center gap-1">
            <Users size={12} className="text-gray-700" />
            Giao dịch thành công
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Hóa đơn đã thanh toán</div>
              <div className="text-2xl font-bold mt-2 text-gray-900">{paidInvoices}</div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 flex items-center gap-1">
            <CheckCircle size={12} className="text-gray-700" />
            Đã thanh toán đầy đủ
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1 flex gap-1">
        {[
          { key: "invoices" as TabType, label: "Hóa đơn", icon: Receipt },
          { key: "payment" as TabType, label: "Thanh toán", icon: QrCode },
          { key: "history" as TabType, label: "Lịch sử", icon: History },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === "invoices" && (
          <div className="space-y-3">
            {MOCK_INVOICES.map((invoice) => (
              <div
                key={invoice.id}
                className={`bg-white rounded-2xl border ${
                  invoice.status === "pending" ? "border-red-200" : "border-gray-200"
                } p-5 hover:shadow-md transition-all`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{invoice.month}</h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">{invoice.description}</div>
                    <div className="text-xs text-gray-500">Mã: {invoice.id}</div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {invoice.status === "paid" 
                        ? `Đã thanh toán: ${invoice.paidDate}`
                        : `Hạn: ${invoice.dueDate}`}
                    </div>
                    
                    {invoice.status === "pending" && (
                      <button 
                        onClick={() => setSelectedInvoice(invoice.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer mt-2"
                      >
                        <Wallet className="w-4 h-4" />
                        Thanh toán ngay
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "payment" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                  <QrCode className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Thanh toán bằng QR PayOS</h3>
                  <p className="text-sm text-gray-600">Quét mã để thanh toán nhanh chóng</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  {MOCK_INVOICES.filter(inv => inv.status === "pending").map((invoice) => (
                    <button
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice.id)}
                      className={`w-full text-left p-4 rounded-xl border ${
                        selectedInvoice === invoice.id 
                          ? "border-red-300 bg-gradient-to-r from-red-50 to-red-100" 
                          : "border-gray-200 bg-white"
                      } hover:bg-gray-50 transition-all`}
                    >
                      <div className="font-medium text-gray-900">{invoice.month}</div>
                      <div className="text-sm text-gray-600 mt-1">{formatCurrency(invoice.amount)}</div>
                    </button>
                  ))}
                </div>

                <div className="md:col-span-2">
                  <div className="p-6 border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl">
                    {selectedInvoice ? (
                      <div className="text-center space-y-4">
                        <div className="inline-block p-6 bg-white rounded-2xl shadow-md border border-gray-200">
                          <div className="w-48 h-48 mx-auto bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center rounded-lg mb-3 shadow-lg">
                            <QrCode className="w-32 h-32 text-white" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-700">
                            {MOCK_INVOICES.find(inv => inv.id === selectedInvoice)?.month}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(MOCK_INVOICES.find(inv => inv.id === selectedInvoice)?.amount || 0)}
                          </div>
                          <div className="text-xs text-gray-500">Mã: {selectedInvoice}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <QrCode className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Chọn hóa đơn để hiển thị mã QR thanh toán</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-100 rounded-xl border border-gray-200">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Hướng dẫn nhanh</div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>1. Chọn hóa đơn cần thanh toán</li>
                      <li>2. Quét mã QR bằng app ngân hàng</li>
                      <li>3. Xác nhận thanh toán</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl border border-gray-200">
                <History className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lịch sử thanh toán</h3>
                <p className="text-sm text-gray-600">Các giao dịch đã hoàn thành</p>
              </div>
            </div>

            <div className="space-y-3">
              {MOCK_PAYMENT_HISTORY.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg border border-gray-200">
                        {getPaymentMethodIcon(payment.method)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{payment.date}</div>
                        <div className="text-sm text-gray-600">{payment.method}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
                        <div className="text-xs text-gray-500">Mã: {payment.invoice}</div>
                      </div>
                      <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-red-300 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-1">Cần hỗ trợ?</div>
            <div className="text-sm text-gray-600">Liên hệ bộ phận tài chính để được giải đáp</div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              <Receipt className="w-4 h-4 text-gray-600" />
              Xuất báo cáo
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
              <Download className="w-4 h-4 text-gray-600" />
              Sao kê
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-600" />
            <span>Cập nhật thời gian thực • Dữ liệu được cập nhật lúc 09:30</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>Chưa thanh toán</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>Đã thanh toán</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
              <span>Quá hạn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}