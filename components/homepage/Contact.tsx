// components/sections/Contact.tsx  (CLIENT — có form state)
"use client";
import { useState } from "react";
import { CTA_GRAD, SURFACE_BORDER, PRIMARY_GRAD } from "@lib/theme/theme";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  return (
    <section id="contact" className="py-20 scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold">
            Liên hệ{" "}
            <span className="bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              KidzGo
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            {[
              { icon: Phone, label: "Hotline", value: "+84 999 888 777" },
              { icon: Mail, label: "Email", value: "hello@kidzgo.edu.vn" },
              {
                icon: MapPin,
                label: "Địa chỉ",
                value: "123 Nguyen Hue, District 1, HCMC",
              },
            ].map((i, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl ${PRIMARY_GRAD} text-white grid place-items-center`}
                >
                  <i.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">{i.label}</div>
                  <div className="font-semibold">{i.value}</div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl overflow-hidden h-56 ring-1 ring-black/5">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop"
                className="w-full h-full object-cover"
                alt="Location"
              />
            </div>
          </div>

          <form
            className={`rounded-2xl bg-white border ${SURFACE_BORDER} p-6 space-y-3 shadow-sm`}
          >
            <input
              className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 outline-none"
              placeholder="Họ và tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 outline-none"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 outline-none"
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-rose-200 focus:border-rose-400 outline-none h-28"
              placeholder="Nhu cầu & mục tiêu của bé"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <button
              className={`w-full py-3 rounded-lg text-white font-semibold ${CTA_GRAD} hover:shadow-lg`}
            >
              Gửi yêu cầu tư vấn
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
