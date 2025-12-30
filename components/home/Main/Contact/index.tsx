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
  MapPin,
  Send,
  User,
  Building,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Globe,
  Clock,
  CheckCircle,
  Users,
  Heart
} from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
    inquiryType: "general"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    alert("Thank you! Your message has been sent.");
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      subject: "",
      message: "",
      inquiryType: "general"
    });
    setIsSubmitting(false);
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
      {/* Main Content */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 -mt-40 bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100 rounded-t-3xl shadow-2xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {/* Contact Info Cards */}
          <div className="space-y-6">
            {/* Call Us Card */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Call Us</h3>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Available 8AM - 8PM
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
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Email Us Card */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Email Us</h3>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      We reply within hours
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
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Visit Us Card */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Visit Us</h3>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      Head Office
                    </p>
                    <p className="text-gray-700 font-medium">
                      123 Nguyen Hue Street, <br />
                      District 1, Ho Chi Minh City
                    </p>
                  </div>
                </div>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Social Media Card */}
            <motion.div
              variants={cardVariants}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white grid place-items-center shadow-md">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Follow Our Journey</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: Facebook, color: "bg-gradient-to-br from-blue-500 to-blue-600", label: "Facebook" },
                    { icon: Instagram, color: "bg-gradient-to-br from-pink-500 to-orange-500", label: "Instagram" },
                    { icon: Twitter, color: "bg-gradient-to-br from-sky-500 to-blue-400", label: "Twitter" },
                    { icon: MessageCircle, color: "bg-gradient-to-br from-green-500 to-emerald-500", label: "Zalo" }
                  ].map((item, idx) => (
                    <a
                      key={idx}
                      href="#"
                      className="group/social"
                      aria-label={item.label}
                    >
                      <div className={`
                        w-full aspect-square rounded-xl ${item.color} 
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

          {/* Contact Form */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-2"
          >
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 p-6 border-b border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Send Us a Message</h3>
                    <p className="text-gray-600">Fill out the form below and we'll get back to you soon</p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Full Name *
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address *
                        </div>
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                        placeholder="john@example.com"
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
                          Phone Number
                        </div>
                      </label>
                      <input
                        type="tel"
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                        placeholder="+84 999 888 777"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Company / School
                        </div>
                      </label>
                      <input
                        type="text"
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                        placeholder="Your organization"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inquiry Type *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: "general", label: "General Inquiry" },
                        { value: "admission", label: "Admission" },
                        { value: "partnership", label: "Partnership" },
                        { value: "support", label: "Support" }
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          className={`
                            px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium text-sm
                            ${form.inquiryType === type.value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm"
                              : "border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900"
                            }
                          `}
                          onClick={() => setForm({ ...form, inquiryType: type.value })}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
                      placeholder="How can we help you?"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300 bg-white hover:border-gray-300 resize-none"
                      placeholder="Tell us more about your inquiry..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      By submitting, you agree to our{" "}
                      <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Privacy Policy
                      </a>
                    </p>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative px-8 py-4 rounded-full text-white font-bold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      <span className="relative">
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </span>
                      {!isSubmitting && (
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      )}
                      
                      {/* Animated background effect */}
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Decoration SVG */}
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