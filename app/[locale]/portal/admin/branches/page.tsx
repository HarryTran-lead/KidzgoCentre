'use client';

import { useMemo, useState } from 'react';
import { 
  MapPin, Users, PencilLine, Plus, Building2, 
  Sparkles, TrendingUp, MoreVertical, Search, Filter,
  ChevronRight, Globe, Clock, CheckCircle,
  AlertCircle
} from 'lucide-react';

const BRANCHES = [
  {
    id: 1,
    code: 'CN01',
    name: 'KidzGo Nguyễn Văn Trỗi',
    address: '120 Nguyễn Văn Trỗi, Q. Phú Nhuận, TP.HCM',
    phone: '0909 111 222',
    students: 240,
    classes: 14,
    capacity: 300,
    status: 'active',
    openingDate: '15/03/2023',
    revenue: 125000000,
    growth: 12.5,
    teachers: 8,
    occupancy: 80,
  },
  {
    id: 2,
    code: 'CN02',
    name: 'KidzGo Phạm Văn Đồng',
    address: '15 Phạm Văn Đồng, Q. Gò Vấp, TP.HCM',
    phone: '0909 333 444',
    students: 190,
    classes: 10,
    capacity: 250,
    status: 'active',
    openingDate: '22/05/2023',
    revenue: 98000000,
    growth: 8.3,
    teachers: 6,
    occupancy: 76,
  },
  {
    id: 3,
    code: 'CN03',
    name: 'KidzGo Thủ Đức',
    address: '46 Võ Văn Ngân, TP. Thủ Đức, TP.HCM',
    phone: '0909 555 666',
    students: 120,
    classes: 6,
    capacity: 200,
    status: 'preparing',
    openingDate: '01/02/2024',
    revenue: 45000000,
    growth: 0,
    teachers: 4,
    occupancy: 60,
  },
  {
    id: 4,
    code: 'CN04',
    name: 'KidzGo Quận 7',
    address: '89 Nguyễn Thị Thập, Q.7, TP.HCM',
    phone: '0909 777 888',
    students: 180,
    classes: 12,
    capacity: 280,
    status: 'active',
    openingDate: '10/08/2023',
    revenue: 110000000,
    growth: 15.2,
    teachers: 7,
    occupancy: 64,
  },
  {
    id: 5,
    code: 'CN05',
    name: 'KidzGo Bình Thạnh',
    address: '203 Điện Biên Phủ, Q. Bình Thạnh, TP.HCM',
    phone: '0909 999 000',
    students: 210,
    classes: 13,
    capacity: 320,
    status: 'active',
    openingDate: '05/12/2023',
    revenue: 135000000,
    growth: 18.7,
    teachers: 9,
    occupancy: 66,
  },
  {
    id: 6,
    code: 'CN06',
    name: 'KidzGo Tân Bình',
    address: '312 Cộng Hòa, Q. Tân Bình, TP.HCM',
    phone: '0909 121 212',
    students: 95,
    classes: 5,
    capacity: 180,
    status: 'maintenance',
    openingDate: '20/10/2023',
    revenue: 32000000,
    growth: -5.2,
    teachers: 3,
    occupancy: 53,
  },
];

function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "blue" | "red" | "green" | "purple" | "yellow" | "pink" | "orange";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    red: "bg-rose-50 text-rose-700 border border-rose-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    pink: "bg-pink-50 text-pink-700 border border-pink-200",
    orange: "bg-orange-50 text-orange-700 border border-orange-200"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const getConfig = () => {
    switch(status) {
      case 'active':
        return {
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-100',
          text: 'Đang hoạt động',
          icon: CheckCircle
        };
      case 'preparing':
        return {
          color: 'text-amber-500',
          bgColor: 'bg-amber-100',
          text: 'Chuẩn bị mở',
          icon: Clock
        };
      case 'maintenance':
        return {
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
          text: 'Bảo trì',
          icon: AlertCircle
        };
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          text: status,
          icon: Clock
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bgColor} ${config.color} text-xs font-medium`}>
      <Icon size={12} />
      {config.text}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  change, 
  icon,
  color = "from-pink-500 to-rose-500"
}: { 
  label: string; 
  value: string | number; 
  change?: number; 
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-gray-600 truncate">{label}</div>
            {change !== undefined && (
              <span className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                change > 0 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : change < 0 
                    ? 'text-rose-600 bg-rose-50'
                    : 'text-gray-600 bg-gray-50'
              }`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function BranchesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredBranches = useMemo(() => {
    return BRANCHES.filter(branch => {
      const matchesSearch = 
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filterStatus === 'all' || 
        branch.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const total = BRANCHES.length;
    const active = BRANCHES.filter(b => b.status === 'active').length;
    const totalStudents = BRANCHES.reduce((sum, b) => sum + b.students, 0);
    const totalClasses = BRANCHES.reduce((sum, b) => sum + b.classes, 0);
    const avgOccupancy = BRANCHES.reduce((sum, b) => sum + b.occupancy, 0) / total;
    const totalRevenue = BRANCHES.reduce((sum, b) => sum + b.revenue, 0);
    
    return {
      total,
      active,
      totalStudents,
      totalClasses,
      avgOccupancy: Math.round(avgOccupancy),
      totalRevenue: new Intl.NumberFormat('vi-VN').format(totalRevenue),
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Quản lý chi nhánh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi và quản lý toàn bộ chi nhánh của hệ thống KidzGo
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all">
          <Plus size={16} />
          Thêm chi nhánh mới
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Tổng chi nhánh" 
          value={stats.total} 
          icon={<Building2 size={20} />}
          color="from-pink-500 to-rose-500"
        />
        <StatCard 
          label="Đang hoạt động" 
          value={stats.active} 
          icon={<CheckCircle size={20} />}
          color="from-emerald-500 to-teal-500"
        />
        <StatCard 
          label="Tổng học viên" 
          value={stats.totalStudents} 
          change={12.5}
          icon={<Users size={20} />}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard 
          label="Lớp học" 
          value={stats.totalClasses} 
          change={8.3}
          icon={<Globe size={20} />}
          color="from-purple-500 to-violet-500"
        />
      </div>

      {/* Filters and Search */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm chi nhánh theo tên, mã hoặc địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-pink-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-pink-200 rounded-xl bg-white">
              <Filter size={16} className="text-pink-500" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm bg-transparent outline-none text-gray-700"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="preparing">Chuẩn bị mở</option>
                <option value="maintenance">Bảo trì</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map((branch) => (
          <div 
            key={branch.id}
            className="group rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-pink-100/50"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-pink-50 text-pink-700 text-xs font-medium rounded-full border border-pink-200">
                    {branch.code}
                  </span>
                  <StatusIndicator status={branch.status} />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-pink-600 transition-colors">
                  {branch.name}
                </h3>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="mt-0.5 text-pink-500 flex-shrink-0" />
                  <span className="line-clamp-2">{branch.address}</span>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-pink-50 transition-colors opacity-0 group-hover:opacity-100">
                <MoreVertical size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-pink-100">
                  <div className="text-xs text-gray-500 mb-1">Học viên</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900">{branch.students}</span>
                    <span className="text-xs text-gray-500">/{branch.capacity}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${branch.occupancy}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-3 border border-pink-100">
                  <div className="text-xs text-gray-500 mb-1">Lớp học</div>
                  <div className="text-lg font-bold text-gray-900">{branch.classes}</div>
                  <div className="text-xs text-gray-500 mt-1">{branch.teachers} giáo viên</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-pink-100">
              <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
                <PencilLine size={14} />
                Chỉnh sửa
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-pink-700 hover:text-pink-800 hover:bg-pink-50 rounded-lg transition-colors">
                Xem chi tiết
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBranches.length === 0 && (
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
            <Building2 size={24} className="text-pink-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy chi nhánh</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Không có chi nhánh nào phù hợp với tiêu chí tìm kiếm của bạn
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Sparkles size={16} className="text-pink-500" />
            <span>Hiển thị {filteredBranches.length}/{BRANCHES.length} chi nhánh</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Đang hoạt động</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Chuẩn bị mở</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>Bảo trì</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}