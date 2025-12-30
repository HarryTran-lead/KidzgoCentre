"use client";

import { useState } from "react";
import { Receipt, CreditCard, Wallet, History, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";
import { Badge } from "@/components/lightswind/badge";

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

  const totalDebt = MOCK_INVOICES.filter((inv) => inv.status === "pending").reduce(
    (sum, inv) => sum + inv.amount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Thanh toán</h1>
        <p className="text-slate-600">Quản lý hóa đơn và thanh toán học phí.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Receipt className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {totalDebt.toLocaleString("vi-VN")} ₫
                </div>
                <div className="text-sm text-slate-600">Công nợ</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {MOCK_PAYMENT_HISTORY.length}
                </div>
                <div className="text-sm text-slate-600">Lần thanh toán</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {MOCK_INVOICES.filter((inv) => inv.status === "paid").length}
                </div>
                <div className="text-sm text-slate-600">Đã thanh toán</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "invoices" ? "default" : "outline"}
          onClick={() => setActiveTab("invoices")}
        >
          Hóa đơn
        </Button>
        <Button
          variant={activeTab === "payment" ? "default" : "outline"}
          onClick={() => setActiveTab("payment")}
        >
          Thanh toán
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
        >
          Lịch sử
        </Button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "invoices" && (
          <div className="space-y-4">
            {MOCK_INVOICES.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{invoice.month}</h3>
                        <Badge
                          className={
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-red-100 text-red-700 border-red-300"
                          }
                        >
                          {invoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{invoice.description}</p>
                      <p className="text-sm text-slate-500">Mã hóa đơn: {invoice.id}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        {invoice.amount.toLocaleString("vi-VN")} ₫
                      </div>
                      <div className="text-sm text-slate-500">
                        {invoice.status === "paid"
                          ? `Đã thanh toán: ${invoice.paidDate}`
                          : `Hạn: ${invoice.dueDate}`}
                      </div>
                    </div>
                  </div>

                  {invoice.status === "pending" && (
                    <Button className="w-full">
                      <Wallet className="w-4 h-4 mr-2" />
                      Thanh toán ngay
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "payment" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                Thanh toán học phí (QR PayOS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Hướng dẫn thanh toán:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                    <li>Chọn hóa đơn cần thanh toán</li>
                    <li>Quét mã QR bằng ứng dụng ngân hàng</li>
                    <li>Xác nhận thông tin và thanh toán</li>
                    <li>Hệ thống tự động cập nhật sau 1-2 phút</li>
                  </ol>
                </div>

                <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
                  <QrCode className="w-24 h-24 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Chọn hóa đơn để hiển thị mã QR thanh toán</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                Lịch sử thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_PAYMENT_HISTORY.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{payment.date}</span>
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            Thành công
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {payment.method} • {payment.invoice}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">
                          {payment.amount.toLocaleString("vi-VN")} ₫
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
