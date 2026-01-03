"use client";

import { useState } from "react";
import { User, Lock, LogOut, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";
import { Input } from "@/components/lightswind/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/lightswind/avatar";

type TabType = "profile" | "password" | "logout";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tài khoản</h1>
        <p className="text-slate-600">Quản lý thông tin tài khoản và bảo mật.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "profile" ? "default" : "outline"}
          onClick={() => setActiveTab("profile")}
        >
          <User className="w-4 h-4 mr-2" />
          Thông tin cá nhân
        </Button>
        <Button
          variant={activeTab === "password" ? "default" : "outline"}
          onClick={() => setActiveTab("password")}
        >
          <Lock className="w-4 h-4 mr-2" />
          Đổi mật khẩu
        </Button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phụ huynh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-slate-200">
                  <AvatarImage src="/image/avatar-placeholder.png" alt="Parent" />
                  <AvatarFallback className="bg-slate-100 text-slate-700 text-2xl font-bold">
                    BK
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Đổi ảnh đại diện
                  </Button>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG tối đa 2MB</p>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Họ và tên
                  </label>
                  <Input defaultValue="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Số điện thoại
                  </label>
                  <Input defaultValue="0912345678" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
                  <Input defaultValue="parent@email.com" type="email" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Ngày sinh
                  </label>
                  <Input defaultValue="01/01/1985" type="date" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Địa chỉ</label>
                  <Input defaultValue="123 Đường ABC, Quận 1, TP. HCM" />
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "password" && (
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Mật khẩu hiện tại
                </label>
                <Input type="password" placeholder="Nhập mật khẩu hiện tại" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Mật khẩu mới
                </label>
                <Input type="password" placeholder="Nhập mật khẩu mới" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Xác nhận mật khẩu mới
                </label>
                <Input type="password" placeholder="Nhập lại mật khẩu mới" />
              </div>

              <Button className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Đổi mật khẩu
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Logout Card */}
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Đăng xuất</h3>
              <p className="text-sm text-slate-600">Đăng xuất khỏi tài khoản của bạn</p>
            </div>
            <Button variant="destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
