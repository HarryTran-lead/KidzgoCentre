// components/sections/Contact.tsx (CLIENT — có form state)
"use client";
import { useState } from "react";
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
  Sparkles
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

  return (
    <section id="contact" className="relative overflow-hidden bg-linear-to-b from-white to-slate-50 py-24">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
              Get In Touch
            </span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Let's <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Connect</span> & 
            <span className="block">Start Your Journey</span>
          </h2>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to us and our team will 
            get back to you within 24 hours.
          </p>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">Call Us</h3>
                  <p className="text-sm text-gray-500 mb-2">Available 8AM - 8PM</p>
                  <a 
                    href="tel:+84999888777" 
                    className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-2 group-hover:gap-3"
                  >
                    +84 999 888 777
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                  </a>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">Email Us</h3>
                  <p className="text-sm text-gray-500 mb-2">We reply within hours</p>
                  <a 
                    href="mailto:support@kidzgo.edu.vn" 
                    className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors flex items-center gap-2 group-hover:gap-3"
                  >
                    support@kidzgo.edu.vn
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                  </a>
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-emerald-500 to-green-500 text-white grid place-items-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">Visit Us</h3>
                  <p className="text-sm text-gray-500 mb-2">Head Office</p>
                  <p className="text-gray-700 font-medium">
                    123 Nguyen Hue Street, <br />
                    District 1, Ho Chi Minh City
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Follow Our Journey</h3>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, color: "bg-blue-500 hover:bg-blue-600", label: "Facebook" },
                  { icon: Instagram, color: "bg-linear-to-br from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600", label: "Instagram" },
                  { icon: Twitter, color: "bg-sky-500 hover:bg-sky-600", label: "Twitter" },
                  { icon: MessageCircle, color: "bg-green-500 hover:bg-green-600", label: "Zalo" }
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="group flex-1"
                    aria-label={item.label}
                  >
                    <div className={`
                      w-full aspect-square rounded-xl ${item.color} 
                      text-white grid place-items-center shadow-md
                      hover:shadow-lg transition-all duration-300
                      group-hover:-translate-y-1
                    `}>
                      <item.icon className="w-5 h-5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 text-white grid place-items-center shadow-lg">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Send Us a Message</h3>
                    <p className="text-gray-500">Fill out the form below and we'll get back to you soon</p>
                  </div>
                </div>

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
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
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
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
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
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
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
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
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
                            px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium
                            ${form.inquiryType === type.value
                              ? "border-blue-500 bg-blue-50 text-blue-600"
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
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300 bg-white hover:border-gray-300"
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
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 bg-white hover:border-gray-300 resize-none"
                      placeholder="Tell us more about your inquiry..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-500">
                      By submitting, you agree to our{" "}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                        Privacy Policy
                      </a>
                    </p>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative px-8 py-4 rounded-full text-white font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      <span className="relative">
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </span>
                      {!isSubmitting && (
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      )}
                      
                      {/* Animated background effect */}
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "24h", label: "Response Time" },
                { value: "99%", label: "Satisfaction Rate" },
                { value: "5K+", label: "Happy Parents" },
                { value: "7/7", label: "Support Days" }
              ].map((stat, idx) => (
                <div 
                  key={idx}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-gray-200 hover:border-blue-200 transition-colors"
                >
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}