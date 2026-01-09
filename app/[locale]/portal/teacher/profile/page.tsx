// app/teacher/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  CheckCircle2,
  BadgeCheck,
  ShieldCheck,
  Shield,
  UserRound,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  MapPin,
  Award,
  BookOpen,
  Globe,
  Camera,
  Edit,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Download,
  Share2,
  Bell,
  BarChart3,
  Target,
  Zap,
  Heart,
  MessageSquare,
  CheckSquare,
  Plus,
  MoreVertical,
  ExternalLink,
  Activity,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ChevronRight,
  Info,
} from "lucide-react";

type TabKey = "info" | "certs" | "security" | "stats";

export default function Page() {
  const [tab, setTab] = useState<TabKey>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <UserRound size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Hồ sơ cá nhân
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý thông tin, chứng chỉ và bảo mật tài khoản
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white via-white to-pink-50/30 rounded-2xl border border-pink-200 overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="px-6 pt-6">
          <div className="flex flex-wrap gap-3">
            <TabButton 
              active={tab === "info"} 
              onClick={() => setTab("info")} 
              icon={<UserRound size={18} />}
              count={4}
              color="pink"
            >
              Thông tin cá nhân
            </TabButton>
            <TabButton 
              active={tab === "certs"} 
              onClick={() => setTab("certs")} 
              icon={<Award size={18} />}
              count={5}
              color="purple"
            >
              Chứng chỉ
            </TabButton>
            <TabButton 
              active={tab === "security"} 
              onClick={() => setTab("security")} 
              icon={<Shield size={18} />}
              color="blue"
            >
              Bảo mật
            </TabButton>
            <TabButton 
              active={tab === "stats"} 
              onClick={() => setTab("stats")} 
              icon={<BarChart3 size={18} />}
              color="emerald"
            >
              Thống kê
            </TabButton>
          </div>
        </div>

        <div className="border-t border-pink-100 mt-4" />

        {/* Tab content */}
        <div className="p-6">
          {tab === "info" && <InfoTab isEditing={isEditing} setIsEditing={setIsEditing} isPageLoaded={isPageLoaded} />}
          {tab === "certs" && <CertsTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "stats" && <StatsTab isPageLoaded={isPageLoaded} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */

function TabButton({
  active,
  children,
  icon,
  onClick,
  count,
  color = "pink"
}: {
  active?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  count?: number;
  color?: "pink" | "purple" | "blue" | "emerald";
}) {
  const colorClasses = {
    pink: "from-pink-500 to-rose-500",
    purple: "from-purple-500 to-fuchsia-500",
    blue: "from-blue-500 to-sky-500",
    emerald: "from-emerald-500 to-teal-500"
  };

  const bgColorClasses = {
    pink: "bg-pink-100 text-pink-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700"
  };

  return (
    <button
      onClick={onClick}
      className={`relative px-5 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 group ${
        active
          ? `bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`
          : "bg-white border border-pink-200 text-gray-700 hover:bg-pink-50"
      }`}
    >
      {icon}
      {children}
      {count !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs ${
          active 
            ? "bg-white/20 text-white" 
            : bgColorClasses[color]
        }`}>
          {count}
        </span>
      )}
      
      {/* Hover effect */}
      {!active && (
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity`} />
      )}
    </button>
  );
}

/* ---------- Thông tin cá nhân - Cải tiến ---------- */

function InfoTab({ 
  isEditing, 
  setIsEditing,
  isPageLoaded 
}: { 
  isEditing: boolean; 
  setIsEditing: (value: boolean) => void;
  isPageLoaded: boolean;
}) {
  const [profileImage, setProfileImage] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenThiAn");
  const [formData, setFormData] = useState({
    fullName: "Nguyễn Thị An",
    email: "nguyenthian@educenter.vn",
    phone: "0901 234 567",
    degree: "Thạc sĩ Ngôn ngữ Anh",
    specialization: "Giảng dạy tiếng Anh & Phương pháp sư phạm",
    experience: "8 năm",
    bio: "Giảng viên với 8 năm kinh nghiệm giảng dạy IELTS và TOEIC. Đam mê giúp học viên đạt được mục tiêu ngôn ngữ của mình. Chuyên môn trong việc phát triển giáo trình cá nhân hóa và phương pháp giảng dạy sáng tạo.",
    location: "Hà Nội, Việt Nam",
    birthDate: "15/05/1988",
    joinDate: "01/06/2018",
  });

  const [skills] = useState([
    { name: "IELTS Training", level: 95 },
    { name: "TOEIC Preparation", level: 90 },
    { name: "Business English", level: 85 },
    { name: "Academic Writing", level: 88 },
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  return (
    <div className="space-y-8">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-pink-500/10 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/20 to-rose-500/20 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative flex flex-col md:flex-row items-start gap-8">
          {/* Profile Image */}
          <div className="relative">
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-r from-pink-500 to-rose-500 group">
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {isEditing && (
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={32} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="absolute -top-3 -right-3 p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-white shadow-lg">
              <BadgeCheck size={24} />
            </div>
            <div className="absolute -bottom-3 -left-3 p-3 bg-white rounded-full shadow-lg">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                <Award size={18} className="text-white" />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">{formData.fullName}</h2>
                <div className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium rounded-full">
                  Giảng viên chính
                </div>
              </div>
              <p className="text-lg text-gray-600">{formData.specialization}</p>

              {/* Teaching hours inside user info */}
              <div className="flex flex-wrap items-center gap-2 mt-3">

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm">
                  <TrendingUp size={14} />
                  <span>28h/tuần</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<Mail size={18} />} label="Email" value={formData.email} />
              <InfoItem icon={<Phone size={18} />} label="Điện thoại" value={formData.phone} />
              <InfoItem icon={<GraduationCap size={18} />} label="Học vị" value={formData.degree} />
              <InfoItem icon={<Calendar size={18} />} label="Kinh nghiệm" value={formData.experience} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-pink-100">
              <StatItem label="Khóa học" value="12" color="pink" />
              <StatItem label="Học viên" value="145+" color="emerald" />
              <StatItem label="Đánh giá" value="4.9" color="amber" />
              <StatItem label="Hoàn thành" value="92%" color="green" />
              <StatItem label="Giờ dạy" value="1,240h" color="blue" />
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <div className="absolute top-6 right-6">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-gray-700 hover:bg-pink-50 transition-all shadow-sm flex items-center gap-2"
              >
                <X size={16} />
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg transition-all shadow-sm flex items-center gap-2"
              >
                <Save size={16} />
                Lưu thay đổi
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg transition-all shadow-sm flex items-center gap-2 group"
            >
              <Edit size={16} className="group-hover:rotate-12 transition-transform" />
              Chỉnh sửa hồ sơ
            </button>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Skills Progress */}
        <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-2xl border border-pink-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Kỹ năng chuyên môn</h3>
              <p className="text-sm text-gray-600">Mức độ thành thạo các kỹ năng giảng dạy</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {skills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                  <span className="text-sm font-bold text-pink-600">{skill.level}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000"
                    style={{ width: isPageLoaded ? `${skill.level}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Info Form */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Thông tin chi tiết</h3>
          
          <div className="grid gap-4">
            <LabeledInput 
              label="Địa điểm" 
              value={formData.location}
              disabled={!isEditing}
              icon={<MapPin size={16} />}
              onChange={(value) => setFormData({...formData, location: value})}
            />
            
            <LabeledInput 
              label="Ngày sinh" 
              value={formData.birthDate}
              disabled={!isEditing}
              icon={<Calendar size={16} />}
              onChange={(value) => setFormData({...formData, birthDate: value})}
            />
            
            <LabeledInput 
              label="Ngày tham gia" 
              value={formData.joinDate}
              disabled={true}
              icon={<Clock size={16} />}
            />
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Giới thiệu bản thân</h3>
            <p className="text-sm text-gray-600">Chia sẻ về kinh nghiệm và phương pháp giảng dạy</p>
          </div>
        </div>
        
        <div className="relative group">
          <textarea
            value={formData.bio}
            disabled={!isEditing}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            rows={4}
            className="w-full rounded-xl border border-blue-200 bg-white/50 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all disabled:bg-transparent disabled:cursor-not-allowed"
          />
          <div className={`absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-transparent rounded-xl pointer-events-none transition-opacity ${isEditing ? 'opacity-0' : 'opacity-100'}`} />
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-3 mt-4">
            <div className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm">
              <Heart size={12} className="inline mr-1" /> 8 năm kinh nghiệm
            </div>
            <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              <MessageSquare size={12} className="inline mr-1" /> 500+ đánh giá
            </div>
            <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm">
              <CheckSquare size={12} className="inline mr-1" /> 95% hài lòng
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-pink-100">
      <div className="p-2 bg-pink-100 rounded-lg">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    pink: "text-pink-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    blue: "text-blue-600"
  };

  return (
    <div className="text-center p-3">
      <div className={`text-2xl font-bold mb-1 ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

/* ---------- Chứng chỉ - Hiện đại hơn ---------- */

function CertsTab() {
  const [certificates, setCertificates] = useState([
    {
      id: 1,
      title: "IELTS 8.5",
      issuer: "British Council",
      year: "2020",
      verified: true,
      level: "Expert",
      color: "from-pink-500 to-rose-500",
      icon: <Globe size={24} />
    },
    {
      id: 2,
      title: "TESOL Certificate",
      issuer: "Arizona State University",
      year: "2018",
      verified: true,
      level: "Advanced",
      color: "from-purple-500 to-fuchsia-500",
      icon: <GraduationCap size={24} />
    },
    {
      id: 3,
      title: "Cambridge C2 Proficiency",
      issuer: "Cambridge Assessment",
      year: "2017",
      verified: true,
      level: "Master",
      color: "from-amber-500 to-orange-500",
      icon: <Award size={24} />
    },
    {
      id: 4,
      title: "TOEIC 990/990",
      issuer: "ETS Global",
      year: "2019",
      verified: true,
      level: "Perfect",
      color: "from-emerald-500 to-teal-500",
      icon: <Target size={24} />
    },
    {
      id: 5,
      title: "Teaching Methodology",
      issuer: "National University",
      year: "2016",
      verified: false,
      level: "Professional",
      color: "from-blue-500 to-sky-500",
      icon: <BookOpen size={24} />
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newCert = {
        id: certificates.length + 1,
        title: file.name.split('.')[0],
        issuer: "Đang xác minh",
        year: new Date().getFullYear().toString(),
        verified: false,
        level: "Basic",
        color: "from-gray-500 to-gray-600",
        icon: <FileText size={24} />
      };
      setCertificates([...certificates, newCert]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chứng chỉ giảng dạy</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý và cập nhật các chứng chỉ của bạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-gray-700 hover:bg-pink-50 transition-all flex items-center gap-2">
            <Download size={16} />
            Xuất tất cả
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white cursor-pointer hover:shadow-lg transition-all">
            <Plus size={16} />
            Thêm mới
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${cert.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            
            {/* Certificate Card */}
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${cert.color} shadow-lg`}>
                  <div className="text-white">
                    {cert.icon}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {cert.verified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} /> Đã xác nhận
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      <Clock size={12} /> Chờ duyệt
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    cert.level === "Perfect" ? "bg-rose-100 text-rose-700" :
                    cert.level === "Expert" ? "bg-pink-100 text-pink-700" :
                    cert.level === "Advanced" ? "bg-purple-100 text-purple-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {cert.level}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{cert.title}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Cấp bởi:</span>
                      <span>{cert.issuer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Năm cấp:</span>
                      <span>{cert.year}</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar for verification */}
                {!cert.verified && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Tiến trình xác minh</span>
                      <span className="text-amber-600 font-medium">65%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-2/3" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-pink-100">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
                    <Eye size={18} />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
                <button className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:shadow-md transition-all flex items-center gap-1.5">
                  <Download size={14} />
                  Tải xuống
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Certificate Card */}
      <div className="border-2 border-dashed border-pink-300 rounded-2xl bg-gradient-to-br from-white/50 to-pink-50/30 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="p-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Upload size={24} className="text-pink-500" />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Tải lên chứng chỉ mới</h4>
          <p className="text-sm text-gray-600 mb-6">
            Kéo thả file hoặc nhấn để chọn file từ máy tính
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white cursor-pointer hover:shadow-lg transition-all">
            <Upload size={16} />
            Chọn file
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-4">
            Hỗ trợ: PDF, JPG, PNG (tối đa 10MB)
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Bảo mật ---------- */

function SecurityTab() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [securitySettings] = useState([
    { id: 1, title: "Xác thực 2 lớp", description: "Bảo vệ tài khoản bằng mã xác thực", enabled: true },
    { id: 2, title: "Thông báo đăng nhập", description: "Nhận thông báo khi có đăng nhập mới", enabled: true },
    { id: 3, title: "Ghi nhớ thiết bị", description: "Tự động đăng nhập trên thiết bị tin cậy", enabled: false },
    { id: 4, title: "Kiểm tra mật khẩu", description: "Cảnh báo mật khẩu yếu", enabled: true },
  ]);

  const [activeSessions] = useState([
    { id: 1, device: "iPhone 13 Pro", location: "Hà Nội, VN", time: "Hiện tại", current: true },
    { id: 2, device: "MacBook Pro", location: "Hà Nội, VN", time: "2 giờ trước", current: false },
    { id: 3, device: "Windows PC", location: "TP.HCM, VN", time: "1 tuần trước", current: false },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password change here
    console.log("Changing password...");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bảo mật tài khoản</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý mật khẩu và cài đặt bảo mật
          </p>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg shadow-lg">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Đổi mật khẩu</h3>
            <p className="text-sm text-gray-600">Cập nhật mật khẩu để tăng cường bảo mật</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <PasswordInput
              label="Mật khẩu hiện tại"
              value={formData.currentPassword}
              onChange={(value) => setFormData({...formData, currentPassword: value})}
              showPassword={showCurrentPassword}
              onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            />
            
            <PasswordInput
              label="Mật khẩu mới"
              value={formData.newPassword}
              onChange={(value) => setFormData({...formData, newPassword: value})}
              showPassword={showNewPassword}
              onToggleShow={() => setShowNewPassword(!showNewPassword)}
            />
            
            <PasswordInput
              label="Xác nhận mật khẩu mới"
              value={formData.confirmPassword}
              onChange={(value) => setFormData({...formData, confirmPassword: value})}
              showPassword={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:shadow-lg transition-all shadow-sm"
            >
              <ShieldCheck size={16} />
              Cập nhật mật khẩu
            </button>
            <button
              type="button"
              onClick={() => setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })}
              className="px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-gray-700 hover:bg-blue-50 transition-all"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>

      {/* Security Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Cài đặt bảo mật</h3>
              <p className="text-sm text-gray-600">Tùy chỉnh các tính năng bảo mật</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {securitySettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-emerald-100">
                <div>
                  <div className="font-medium text-gray-900">{setting.title}</div>
                  <div className="text-xs text-gray-600">{setting.description}</div>
                </div>
                <ToggleSwitch enabled={setting.enabled} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl border border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Phiên đăng nhập</h3>
              <p className="text-sm text-gray-600">Quản lý các thiết bị đang đăng nhập</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div key={session.id} className={`flex items-center justify-between p-3 rounded-xl ${
                session.current ? 'bg-amber-50 border border-amber-200' : 'bg-white/50 border border-amber-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    session.current ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                    <SmartphoneIcon />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{session.device}</div>
                    <div className="text-xs text-gray-600">{session.location} • {session.time}</div>
                  </div>
                </div>
                {session.current ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                    Hiện tại
                  </span>
                ) : (
                  <button className="text-xs text-rose-600 hover:text-rose-700">
                    Đăng xuất
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-2.5 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl text-sm font-medium transition-colors">
            Xem tất cả phiên đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}

function SmartphoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={enabled} readOnly />
        <div className={`block w-10 h-5 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${enabled ? 'transform translate-x-5' : ''}`}></div>
      </div>
    </label>
  );
}

/* ---------- Thống kê với Chart ---------- */

function StatsTab({ isPageLoaded }: { isPageLoaded: boolean }) {
  const [activeTimeFilter, setActiveTimeFilter] = useState<"week" | "month" | "quarter">("month");

  const stats = [
    { label: "Tỉ lệ hoàn thành khóa học", value: 92, change: "+2.5%", color: "from-pink-500 to-rose-500" },
    { label: "Đánh giá từ học viên", value: 4.9, change: "+0.1", color: "from-amber-500 to-orange-500" },
    { label: "Tỉ lệ giữ chân học viên", value: 88, change: "+3.2%", color: "from-emerald-500 to-teal-500" },
    { label: "Thời gian phản hồi TB", value: 2.4, change: "-0.5h", color: "from-blue-500 to-sky-500" },
  ];

  const monthlyData = {
    labels: ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"],
    values: [65, 70, 75, 80, 85, 88, 90, 92, 90, 88, 85, 92]
  };

  const skillData = [
    { name: "IELTS Training", value: 95, color: "#ec4899", icon: <Globe size={14} /> },
    { name: "TOEIC Preparation", value: 90, color: "#f59e0b", icon: <Target size={14} /> },
    { name: "Business English", value: 85, color: "#10b981", icon: <BookOpen size={14} /> },
    { name: "Academic Writing", value: 88, color: "#3b82f6", icon: <Award size={14} /> },
    { name: "Communication", value: 82, color: "#8b5cf6", icon: <MessageSquare size={14} /> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Thống kê hoạt động</h2>
          <p className="text-sm text-gray-600 mt-1">
            Phân tích hiệu suất và thành tích giảng dạy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTimeFilter("week")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTimeFilter === "week" 
                  ? "bg-white text-pink-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setActiveTimeFilter("month")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTimeFilter === "month" 
                  ? "bg-white text-pink-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setActiveTimeFilter("quarter")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTimeFilter === "quarter" 
                  ? "bg-white text-pink-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quý
            </button>
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg transition-all flex items-center gap-2">
            <Download size={16} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-pink-50/30 rounded-2xl border border-pink-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className={`text-sm ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-3">
              {typeof stat.value === 'number' && stat.value % 1 !== 0 ? stat.value.toFixed(1) : stat.value}
              {stat.label.includes("Đánh giá") ? "/5.0" : stat.label.includes("Thời gian") ? "h" : "%"}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000`}
                style={{ width: isPageLoaded ? `${Math.min(stat.value, 100)}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Performance Chart */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-r from-blue-500 to-sky-500 rounded-lg">
                <LineChartIcon size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Hiệu suất theo tháng</h3>
                <p className="text-sm text-gray-600">Tỉ lệ hoàn thành khóa học 12 tháng gần nhất</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">92%</div>
          </div>
          
          <div className="h-64">
            <EnhancedLineChart 
              data={monthlyData.values} 
              labels={monthlyData.labels} 
              color="#3b82f6"
              animate={isPageLoaded}
            />
          </div>
        </div>

        {/* Skill Distribution Chart */}
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-lg">
                <PieChartIcon size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Phân bố kỹ năng</h3>
                <p className="text-sm text-gray-600">Mức độ thành thạo các lĩnh vực giảng dạy</p>
              </div>
            </div>
            <button className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1">
              Chi tiết <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="flex items-center justify-center overflow-hidden">
            <EnhancedPieChart 
              data={skillData}
              animate={isPageLoaded}
              size={220}
            />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Học viên mới</div>
              <div className="text-2xl font-bold text-emerald-600">24</div>
            </div>
          </div>
          <div className="text-xs text-emerald-500 flex items-center gap-1">
            <TrendingUp size={12} /> +5 so với tháng trước
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Thời gian dạy TB</div>
              <div className="text-2xl font-bold text-amber-600">28h</div>
            </div>
          </div>
          <div className="text-xs text-amber-500">/tuần</div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-2xl border border-pink-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
              <MessageSquare size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Phản hồi tích cực</div>
              <div className="text-2xl font-bold text-pink-600">98%</div>
            </div>
          </div>
          <div className="text-xs text-pink-500">500+ đánh giá</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Enhanced Pie Chart Component ---------- */

function EnhancedPieChart({
  data,
  animate = true,
  size = 220
}: {
  data: Array<{ name: string; value: number; color: string; icon?: React.ReactNode }>;
  animate?: boolean;
  size?: number;
}) {
  const [animatedValues, setAnimatedValues] = useState(data.map(() => 0));
  const hasAnimated = useRef(false);
  const radius = size / 2 - 20;
  const center = size / 2;
  const strokeWidth = 40;
  const innerRadius = radius - strokeWidth / 2;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  useEffect(() => {
    if (!animate || hasAnimated.current) return;
    
    const timer = setTimeout(() => {
      hasAnimated.current = true;
      let currentValues = [...animatedValues];
      const steps = 60;
      const incrementTime = 20;
      
      const step = (stepCount: number) => {
        currentValues = currentValues.map((val, idx) => {
          const target = data[idx].value;
          const increment = (target - val) / (steps - stepCount);
          return Math.min(val + increment, target);
        });
        
        setAnimatedValues([...currentValues]);
        
        if (stepCount < steps) {
          setTimeout(() => step(stepCount + 1), incrementTime);
        } else {
          setAnimatedValues(data.map(s => s.value));
        }
      };
      
      step(0);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [data, animate]);

  const displayValues = animate ? animatedValues : data.map(s => s.value);
  const displayTotal = displayValues.reduce((sum, val) => sum + val, 0);
  
  // Calculate arcs - BẮT ĐẦU TỪ GÓC 0 ĐỘ (12h)
  let currentAngle = -90; // SỬA: Bắt đầu từ -90 độ (12h) thay vì 0 độ (3h)
  const arcs = displayValues.map((value, index) => {
    const percentage = (value / displayTotal) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + innerRadius * Math.cos(startAngleRad);
    const y1 = center + innerRadius * Math.sin(startAngleRad);
    const x2 = center + innerRadius * Math.cos(endAngleRad);
    const y2 = center + innerRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = `
      M ${x1} ${y1}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
    `;
    
    currentAngle = endAngle;
    
    return {
      path: pathData,
      color: data[index].color,
      name: data[index].name,
      value: data[index].value,
      percentage: percentage,
      icon: data[index].icon,
      midAngle: startAngle + angle / 2
    };
  });

  return (
    <div className="w-full flex items-center gap-6">
      {/* Pie Chart - Bên trái */}
      <div className="flex-shrink-0  ">
        <div className="relative overflow-hidden" style={{ width: size, height: size }}>
          <svg 
            width={size} 
            height={size}
            className="overflow-hidden"
          >
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={strokeWidth}
            />
            
            {/* Pie slices */}
            {arcs.map((arc, index) => (
              <path
                key={index}
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ 
                  strokeDasharray: `${(arc.percentage / 100) * 2 * Math.PI * innerRadius} ${2 * Math.PI * innerRadius}`,
                  strokeDashoffset: 0
                }}
              />
            ))}
            
            {/* Center circle */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius - strokeWidth - 10}
              fill="white"
            />
            
            {/* Center text */}
            <text
              x={center}
              y={center}
              textAnchor="middle"
              dy="0.3em"
              className="text-2xl font-bold fill-gray-900"
            >
              {Math.round((displayTotal / data.length))}%
            </text>
            <text
              x={center}
              y={center + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              Trung bình
            </text>
          </svg>
        </div>
      </div>
      
      {/* Legend - Bên phải */}
      <div className="flex-1 space-y-2">
        {data.map((skill, index) => (
          <div key={index} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
            <div 
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: skill.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{skill.name}</div>
              <div className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                {skill.icon}
                <span className="font-semibold">{displayValues[index].toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Enhanced Line Chart with Axes ---------- */

function EnhancedLineChart({
  data,
  labels,
  color = "#3b82f6",
  height = 250,
  animate = true
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  animate?: boolean;
}) {
  const [animatedData, setAnimatedData] = useState(data.map(() => 0));
  const hasAnimated = useRef(false);
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };
  const chartWidth = 500;
  const chartHeight = height - padding.top - padding.bottom;

  useEffect(() => {
    if (!animate || hasAnimated.current) return;
    
    const timer = setTimeout(() => {
      hasAnimated.current = true;
      let currentData = [...animatedData];
      const steps = 60;
      const incrementTime = 20;
      
      const step = (stepCount: number) => {
        currentData = currentData.map((val, idx) => {
          const target = data[idx];
          const increment = (target - val) / (steps - stepCount);
          return val + increment;
        });
        
        setAnimatedData([...currentData]);
        
        if (stepCount < steps) {
          setTimeout(() => step(stepCount + 1), incrementTime);
        } else {
          setAnimatedData([...data]);
        }
      };
      
      step(0);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [data, animate]);

  const displayData = animate ? animatedData : data;
  
  // Calculate points
  const xScale = (index: number) => 
    padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  
  const yScale = (value: number) => 
    padding.top + (1 - (value - minValue) / (maxValue - minValue)) * chartHeight;

  // Create path data
  const points = displayData.map((value, index) => 
    `${xScale(index)} ${yScale(value)}`
  ).join(' L ');

  const pathData = `M ${points}`;

  return (
    <div className="w-full h-full overflow-x-auto">
      <div style={{ minWidth: chartWidth + padding.left + padding.right }}>
        <svg width="100%" height={height} className="overflow-visible">
          {/* Y-axis grid lines and labels */}
          {[0, 25, 50, 75, 100].map((percent, idx) => {
            const value = minValue + (percent / 100) * (maxValue - minValue);
            const y = yScale(value);
            return (
              <g key={`y-grid-${idx}`}>
                {/* Grid line */}
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth + padding.left}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
                {/* Y-axis label */}
                <text
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-500"
                >
                  {Math.round(value)}%
                </text>
              </g>
            );
          })}

          {/* Y-axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#9ca3af"
            strokeWidth="1"
          />

          {/* X-axis grid lines and labels */}
          {labels.map((label, index) => {
            const x = xScale(index);
            return (
              <g key={`x-grid-${index}`}>
                {/* Grid line */}
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                {/* X-axis label */}
                <text
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {label}
                </text>
                {/* X-axis tick */}
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 5}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* X-axis line */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={chartWidth + padding.left}
            y2={height - padding.bottom}
            stroke="#9ca3af"
            strokeWidth="1"
          />

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Gradient under line */}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area under line */}
          <path
            d={`${pathData} L ${xScale(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
            fill="url(#lineGradient)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Data points */}
          {displayData.map((value, index) => {
            const x = xScale(index);
            const y = yScale(value);
            return (
              <g key={`point-${index}`}>
                {/* Hover circle (larger, transparent) */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="transparent"
                  className="cursor-pointer hover:fill-gray-200/30 transition-colors"
                />
                {/* Data point */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Value label on hover */}
                <g className="opacity-0 hover:opacity-100 transition-opacity">
                  <rect
                    x={x - 25}
                    y={y - 40}
                    width="50"
                    height="24"
                    rx="6"
                    fill={color}
                  />
                  <text
                    x={x}
                    y={y - 25}
                    textAnchor="middle"
                    className="text-xs fill-white font-medium"
                  >
                    {Math.round(value)}%
                  </text>
                  <polygon
                    points={`${x - 6},${y - 16} ${x + 6},${y - 16} ${x},${y - 10}`}
                    fill={color}
                  />
                </g>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Chart info */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500 rounded-full"></div>
          <span>Tỉ lệ hoàn thành</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Cao nhất: {Math.max(...data)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span>Trung bình: {Math.round(data.reduce((a, b) => a + b, 0) / data.length)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small helpers ---------- */

function LabeledInput({
  label,
  value,
  placeholder,
  type = "text",
  disabled = false,
  icon,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
  disabled?: boolean;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-gray-900">{label}</div>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full rounded-xl border border-pink-200 bg-white/50 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all ${
            icon ? 'pl-10' : ''
          } ${disabled ? 'bg-transparent cursor-not-allowed' : ''}`}
        />
      </div>
    </label>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-gray-900">{label}</div>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Lock size={16} className="text-gray-400" />
        </div>
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-pink-200 bg-white/50 pl-10 pr-10 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}