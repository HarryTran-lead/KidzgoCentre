"use client";

import { useState } from "react";
import { Receipt, CreditCard, Wallet, History, QrCode, ArrowRight, CheckCircle, AlertCircle, Download, Banknote, TrendingUp, Filter } from "lucide-react";

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
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Đã thanh toán
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Chưa thanh toán
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method.includes("QR")) return <QrCode className="w-4 h-4" />;
    if (method.includes("Chuyển khoản")) return <Banknote className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/20 via-white to-white p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Wallet className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Thanh toán học phí
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý hóa đơn và thanh toán trực tuyến
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
          <Filter size={16} /> Lọc theo tháng
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalDebt)}</div>
              <div className="text-sm text-gray-600 mt-1">Công nợ</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{MOCK_PAYMENT_HISTORY.length}</div>
              <div className="text-sm text-gray-600 mt-1">Lần thanh toán</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: '85%' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {MOCK_INVOICES.filter((inv) => inv.status === "paid").length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Hóa đơn đã thanh toán</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-blue-500 to-sky-500" style={{ width: '40%' }} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-2 flex gap-2">
        {[
          { key: "invoices" as TabType, label: "Hóa đơn", icon: Receipt },
          { key: "payment" as TabType, label: "Thanh toán", icon: QrCode },
          { key: "history" as TabType, label: "Lịch sử", icon: History },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                : "bg-white border border-pink-200 text-gray-600 hover:bg-pink-50"
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
                className={`rounded-2xl border ${
                  invoice.status === "pending" ? "border-rose-200" : "border-emerald-200"
                } bg-gradient-to-br from-white to-pink-50 p-5 hover:shadow-md transition-all`}
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
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer mt-2"
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
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-xl">
                  <QrCode className="w-6 h-6 text-blue-500" />
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
                          ? "border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50" 
                          : "border-pink-200 bg-white"
                      } hover:bg-pink-50 transition-all`}
                    >
                      <div className="font-medium text-gray-900">{invoice.month}</div>
                      <div className="text-sm text-gray-600 mt-1">{formatCurrency(invoice.amount)}</div>
                    </button>
                  ))}
                </div>

                <div className="md:col-span-2">
                  <div className="p-6 border-2 border-dashed border-pink-300 bg-white/50 rounded-2xl">
                    {selectedInvoice ? (
                      <div className="text-center space-y-4">
                        <div className="inline-block p-6 bg-white rounded-2xl shadow-lg">
                          <div className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center rounded-lg mb-3">
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
                        <QrCode className="w-20 h-20 text-pink-300 mx-auto mb-4" />
                        <p className="text-gray-600">Chọn hóa đơn để hiển thị mã QR thanh toán</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50/50 to-sky-50/50 rounded-xl border border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-2">💡 Hướng dẫn nhanh</div>
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
          <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-xl">
                <History className="w-6 h-6 text-gray-600" />
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
                  className="p-4 rounded-xl border border-pink-200 bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg">
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
                      <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer">
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
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-1">📞 Cần hỗ trợ?</div>
            <div className="text-sm text-gray-600">Liên hệ bộ phận tài chính để được giải đáp</div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
              <Receipt className="w-4 h-4" />
              Xuất báo cáo
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
              Sao kê
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}