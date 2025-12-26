"use client";

import { useState } from "react";
import { MessageSquare, Ticket, Phone, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";
import { Badge } from "@/components/lightswind/badge";
import { Textarea } from "@/components/lightswind/textarea";
import { Input } from "@/components/lightswind/input";

type TabType = "feedback" | "tickets" | "contact";

const MOCK_TICKETS = [
  {
    id: "TICKET-001",
    subject: "Thắc mắc về học phí",
    status: "open",
    date: "25/12/2024",
    lastReply: "26/12/2024",
  },
  {
    id: "TICKET-002",
    subject: "Đổi lịch học",
    status: "resolved",
    date: "20/12/2024",
    resolvedDate: "21/12/2024",
  },
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<TabType>("feedback");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hỗ trợ</h1>
        <p className="text-slate-600">Gửi phản hồi, tạo ticket hỗ trợ hoặc liên hệ trung tâm.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "feedback" ? "default" : "outline"}
          onClick={() => setActiveTab("feedback")}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Gửi phản hồi
        </Button>
        <Button
          variant={activeTab === "tickets" ? "default" : "outline"}
          onClick={() => setActiveTab("tickets")}
        >
          <Ticket className="w-4 h-4 mr-2" />
          Ticket hỗ trợ
        </Button>
        <Button
          variant={activeTab === "contact" ? "default" : "outline"}
          onClick={() => setActiveTab("contact")}
        >
          <Phone className="w-4 h-4 mr-2" />
          Liên hệ
        </Button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "feedback" && (
          <Card>
            <CardHeader>
              <CardTitle>Gửi phản hồi cho chúng tôi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Chủ đề
                </label>
                <Input placeholder="Nhập chủ đề phản hồi..." />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Nội dung phản hồi
                </label>
                <Textarea
                  placeholder="Chia sẻ ý kiến, góp ý của bạn về dịch vụ..."
                  rows={6}
                />
              </div>
              <Button className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Gửi phản hồi
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "tickets" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <Button className="w-full">
                  <Ticket className="w-4 h-4 mr-2" />
                  Tạo ticket mới
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {MOCK_TICKETS.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{ticket.subject}</h4>
                          <Badge
                            className={
                              ticket.status === "open"
                                ? "bg-blue-100 text-blue-700 border-blue-300"
                                : "bg-green-100 text-green-700 border-green-300"
                            }
                          >
                            {ticket.status === "open" ? "Đang xử lý" : "Đã giải quyết"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">ID: {ticket.id}</p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      <span>Tạo lúc: {ticket.date}</span>
                      {ticket.status === "open" && (
                        <span className="ml-4">Phản hồi gần nhất: {ticket.lastReply}</span>
                      )}
                      {ticket.status === "resolved" && (
                        <span className="ml-4">Giải quyết: {ticket.resolvedDate}</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Hotline</h4>
                  <p className="text-blue-600 font-semibold">1900 xxxx</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Email</h4>
                  <p className="text-blue-600">support@kidzgo.vn</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Địa chỉ</h4>
                  <p className="text-slate-700">123 Đường ABC, Quận 1, TP. HCM</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Giờ làm việc</h4>
                  <p className="text-slate-700">Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                  <p className="text-slate-700">Thứ 7: 8:00 - 12:00</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gửi tin nhắn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Họ và tên
                  </label>
                  <Input placeholder="Nhập họ tên..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Số điện thoại
                  </label>
                  <Input placeholder="Nhập số điện thoại..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Nội dung
                  </label>
                  <Textarea placeholder="Nhập nội dung..." rows={4} />
                </div>
                <Button className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Gửi tin nhắn
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
