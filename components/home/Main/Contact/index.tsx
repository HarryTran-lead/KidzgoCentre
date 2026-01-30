// components/sections/Contact.tsx (CLIENT — có form state)
"use client";

import { useState } from "react";
import { motion, cubicBezier } from "framer-motion";
import Image from "next/image";
import {
  Phone,
  Mail,
  MessageSquare,
  Instagram,
  Facebook,
  Twitter,
  PhoneCall,
  Clock,
  ChevronRight,
  CheckCircle,
  Building,
  MapPin,
  Send,
  User,
  MessageCircle,
  Users,
} from "lucide-react";
import { createLeadPublic } from "@/lib/api/leadService";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    contactName: "",
    email: "",
    phone: "",
    zaloId: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await createLeadPublic({
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        zaloId: form.zaloId || undefined,
      });

      if (response.success) {
        toast({
          title: "Thành công!",
          description: "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.",
          variant: "success",
        });
        
        // Reset form
        setForm({
          contactName: "",
          email: "",
          phone: "",
          zaloId: "",
        });
      }
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gửi thông tin. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: cubicBezier(0.22, 1, 0.36, 1)
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, rotateX: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: cubicBezier(0.22, 1, 0.36, 1)
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100 mt-30">
      {/* Nội dung chính */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 -mt-40 bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100 rounded-t-3xl shadow-2xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {/* Thẻ thông tin liên hệ */}
          <div className="space-y-6">
            {/* Thẻ Gọi điện */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Gọi cho chúng tôi</h3>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Có mặt 8AM - 8PM
                    </p>
                    <a 
                      href="tel:+84999888777" 
                      className="text-lg font-bold text-gray-900 hover:text-emerald-600 transition-colors flex items-center gap-2 group-hover:gap-3"
                    >
                      +84 999 888 777
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                  </div>
                </div>
              </div>
              {/* Lớp phủ khi hover */}
              <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Thẻ Email */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-linear-to-br from-green-500 to-emerald-500 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Email</h3>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Phản hồi trong vòng vài giờ
                    </p>
                    <a 
                      href="mailto:support@kidzgo.edu.vn" 
                      className="text-base font-semibold text-gray-900 hover:text-green-600 transition-colors flex items-center gap-2 group-hover:gap-3"
                    >
                      support@kidzgo.edu.vn
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                  </div>
                </div>
              </div>
              {/* Lớp phủ khi hover */}
              <div className="absolute inset-0 bg-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Thẻ Địa chỉ */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-linear-to-br from-teal-500 to-green-500 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Đến thăm chúng tôi</h3>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      Văn phòng chính
                    </p>
                    <p className="text-gray-700 font-medium">
                      123 Đường Nguyễn Huệ, <br />
                      Quận 1, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>
              </div>
              {/* Lớp phủ khi hover */}
              <div className="absolute inset-0 bg-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Thẻ Mạng xã hội */}
            <motion.div
              variants={cardVariants}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-green-500 text-white grid place-items-center shadow-md">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Theo dõi hành trình của chúng tôi</h3>
                </div>
                <div className="grid grid-cols-4  ">
                  {[
                    { icon: Facebook, color: "bg-linear-to-br from-blue-500 to-blue-600", label: "Facebook" },
                    { icon: Instagram, color: "bg-linear-to-br from-pink-500 to-orange-500", label: "Instagram" },
                    { icon: Twitter, color: "bg-linear-to-br from-sky-500 to-blue-400", label: "Twitter" },
                    { icon: MessageCircle, color: "bg-linear-to-br from-green-500 to-emerald-500", label: "Zalo" }
                  ].map((item, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className="group/social"
                      aria-label={item.label}
                    >
                      <div className={`
                        w-10 h-10 aspect-square rounded-xl ${item.color} 
                        text-white grid place-items-center shadow-md
                        hover:shadow-lg transition-all duration-300
                        group-hover/social:-translate-y-1
                      `}>
                        <item.icon className="w-5 h-5" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Form liên hệ */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-2"
          >
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
              {/* Header form */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 p-6 border-b border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-linear-to-br from-emerald-500 to-green-500 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Gửi tin nhắn cho chúng tôi</h3>
                    <p className="text-gray-600">Điền vào biểu mẫu bên dưới và chúng tôi sẽ phản hồi sớm</p>
                  </div>
                </div>
              </div>

              {/* Nội dung form */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Họ và tên *
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                        placeholder="Nguyễn Văn A"
                        value={form.contactName}
                        onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Địa chỉ email *
                        </div>
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                        placeholder="nguyenvana@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Số điện thoại *
                        </div>
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                        placeholder="0999888777"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Zalo ID
                        </div>
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                        placeholder="Số Zalo của bạn"
                        value={form.zaloId}
                        onChange={(e) => setForm({ ...form, zaloId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Bằng cách gửi, bạn đồng ý với{" "}
                      <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Chính sách Bảo mật
                      </a> của chúng tôi
                    </p>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative px-8 py-4 rounded-full text-white font-bold bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      <span className="relative">
                        {isSubmitting ? "Đang gửi..." : "Gửi tin nhắn"}
                      </span>
                      {!isSubmitting && (
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      )}
                      
                      {/* Hiệu ứng nền động */}
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            
          </motion.div>
        </motion.div>
      </div>

      {/* SVG trang trí dưới cùng */}
      <div className="z-20 relative w-full overflow-hidden bg-[#d0fae4]" style={{ marginTop: 0, lineHeight: 0 }}>
        <Image
          src="/image/hero-deluxe-end.svg"
          alt=""
          width={1512}
          height={317}
          className="w-full h-auto"
          style={{ display: 'block', verticalAlign: 'bottom' }}
        />
      </div>
    </div>
  );
}