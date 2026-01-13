'use client';

import { useState, useMemo } from 'react';
import {
  Gift,
  Star,
  Sparkles,
  ShoppingCart,
  Search,
  Check,
  Clock,
  Package,
  Award,
  ImageIcon,
  MessageCircle,
  Frame
} from 'lucide-react';
import { FilterTabs, TabOption } from '@/components/portal/student/FilterTabs';

// Types
interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'avatar' | 'frame' | 'sticker' | 'badge' | 'voucher' | 'physical';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  stock?: number;
  owned?: boolean;
  isNew?: boolean;
  isHot?: boolean;
}

interface ExchangeHistory {
  id: string;
  rewardName: string;
  cost: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
  icon: string;
}

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState<string>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'popular'>('popular');

  // User stars balance
  const userStars = 8640;

  // Tab options
  const tabOptions: TabOption[] = [
    { id: 'shop', label: 'Cửa hàng', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'inventory', label: 'Kho đồ', icon: <Package className="w-4 h-4" /> },
    { id: 'history', label: 'Lịch sử', icon: <Clock className="w-4 h-4" /> },
  ];

  // Category filters
  const categories = [
    { id: 'all', label: 'Tất cả', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'avatar', label: 'Avatar', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'frame', label: 'Khung ảnh', icon: <Frame className="w-4 h-4" /> },
    { id: 'sticker', label: 'Sticker', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'badge', label: 'Huy hiệu', icon: <Award className="w-4 h-4" /> },
    { id: 'voucher', label: 'Voucher', icon: <Gift className="w-4 h-4" /> },
  ];

  // Mock rewards data
  const rewards: RewardItem[] = [
    // Avatars
    { id: '1', name: 'Avatar Vương Miện', description: 'Avatar VIP với vương miện vàng', cost: 2000, category: 'avatar', rarity: 'legendary', icon: '👑', isNew: true },
    { id: '2', name: 'Avatar Ninja', description: 'Hóa thân thành ninja siêu ngầu', cost: 1500, category: 'avatar', rarity: 'epic', icon: '🥷', isHot: true },
    { id: '3', name: 'Avatar Robot', description: 'Avatar robot công nghệ', cost: 1000, category: 'avatar', rarity: 'rare', icon: '🤖' },
    { id: '4', name: 'Avatar Mèo', description: 'Avatar mèo dễ thương', cost: 500, category: 'avatar', rarity: 'common', icon: '🐱' },
    
    // Frames
    { id: '5', name: 'Khung Cầu Vồng', description: 'Khung ảnh 7 màu lung linh', cost: 1800, category: 'frame', rarity: 'legendary', icon: '🌈', isNew: true },
    { id: '6', name: 'Khung Lửa', description: 'Khung ảnh hiệu ứng lửa', cost: 1200, category: 'frame', rarity: 'epic', icon: '🔥' },
    { id: '7', name: 'Khung Băng', description: 'Khung ảnh phong cách băng giá', cost: 800, category: 'frame', rarity: 'rare', icon: '❄️' },
    { id: '8', name: 'Khung Hoa', description: 'Khung ảnh hoa lá xinh xắn', cost: 400, category: 'frame', rarity: 'common', icon: '🌸' },
    
    // Stickers
    { id: '9', name: 'Pack Sticker VIP', description: 'Bộ 50 sticker độc quyền', cost: 1500, category: 'sticker', rarity: 'epic', icon: '✨', isHot: true },
    { id: '10', name: 'Sticker Cảm Xúc', description: 'Bộ 30 sticker biểu cảm', cost: 600, category: 'sticker', rarity: 'rare', icon: '😄' },
    { id: '11', name: 'Sticker Động Vật', description: 'Bộ 20 sticker động vật', cost: 300, category: 'sticker', rarity: 'common', icon: '🐶' },
    
    // Badges
    { id: '12', name: 'Huy Hiệu Siêu Sao', description: 'Huy hiệu cao cấp nhất', cost: 3000, category: 'badge', rarity: 'legendary', icon: '⭐', stock: 10 },
    { id: '13', name: 'Huy Hiệu Chiến Binh', description: 'Huy hiệu dành cho chiến binh', cost: 1000, category: 'badge', rarity: 'epic', icon: '⚔️' },
    { id: '14', name: 'Huy Hiệu Học Giỏi', description: 'Huy hiệu học sinh giỏi', cost: 500, category: 'badge', rarity: 'rare', icon: '📚' },
    
    // Vouchers
    { id: '15', name: 'Giảm 10% học phí', description: 'Voucher giảm 10% cho khóa học tiếp theo', cost: 5000, category: 'voucher', rarity: 'legendary', icon: '🎫', stock: 5 },
    { id: '16', name: 'Sách miễn phí', description: 'Đổi lấy 1 cuốn sách học tiếng Anh', cost: 2000, category: 'voucher', rarity: 'epic', icon: '📖', stock: 20 },
  ];

  // Mock owned items
  const ownedItems: RewardItem[] = [
    { id: '4', name: 'Avatar Mèo', description: 'Avatar mèo dễ thương', cost: 500, category: 'avatar', rarity: 'common', icon: '🐱', owned: true },
    { id: '8', name: 'Khung Hoa', description: 'Khung ảnh hoa lá xinh xắn', cost: 400, category: 'frame', rarity: 'common', icon: '🌸', owned: true },
    { id: '11', name: 'Sticker Động Vật', description: 'Bộ 20 sticker động vật', cost: 300, category: 'sticker', rarity: 'common', icon: '🐶', owned: true },
  ];

  // Mock exchange history
  const exchangeHistory: ExchangeHistory[] = [
    { id: '1', rewardName: 'Avatar Mèo', cost: 500, date: '10/01/2026', status: 'completed', icon: '🐱' },
    { id: '2', rewardName: 'Khung Hoa', cost: 400, date: '05/01/2026', status: 'completed', icon: '🌸' },
    { id: '3', rewardName: 'Sticker Động Vật', cost: 300, date: '01/01/2026', status: 'completed', icon: '🐶' },
    { id: '4', rewardName: 'Sách miễn phí', cost: 2000, date: '25/12/2025', status: 'processing', icon: '📖' },
  ];

  // Filter and sort rewards
  const filteredRewards = useMemo(() => {
    let result = [...rewards];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(r => r.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.cost - b.cost);
        break;
      case 'price-desc':
        result.sort((a, b) => b.cost - a.cost);
        break;
      case 'popular':
        result.sort((a, b) => {
          if (a.isHot && !b.isHot) return -1;
          if (!a.isHot && b.isHot) return 1;
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;
    }
    
    return result;
  }, [rewards, selectedCategory, searchQuery, sortBy]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-500';
      case 'epic': return 'from-purple-400 via-pink-500 to-purple-600';
      case 'rare': return 'from-blue-400 via-cyan-500 to-blue-600';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getRarityBadge = (rarity: string) => {
    const labels = {
      legendary: 'Huyền Thoại',
      epic: 'Sử Thi',
      rare: 'Hiếm',
      common: 'Thường'
    };
    return labels[rarity as keyof typeof labels] || 'Thường';
  };

  const getStatusBadge = (status: ExchangeHistory['status']) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
          <Check className="w-3 h-3" /> Hoàn thành
        </span>;
      case 'processing':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">
          <Clock className="w-3 h-3" /> Đang xử lý
        </span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
          <Clock className="w-3 h-3" /> Chờ xử lý
        </span>;
    }
  };

  const handleExchange = (reward: RewardItem) => {
    if (userStars >= reward.cost) {
      alert(`Đổi thưởng "${reward.name}" thành công!`);
    } else {
      alert('Bạn không đủ sao để đổi phần thưởng này!');
    }
  };

  return (
    <div className="text-white pb-10 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
            <Gift className="w-6 h-6" />
          </div>
          Đổi thưởng
        </h1>
        <p className="text-gray-400">
          Sử dụng sao đã tích lũy để đổi lấy những phần thưởng hấp dẫn
        </p>
      </div>

      {/* Stars Balance Card */}
      <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Star className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            <div>
              <p className="text-sm text-yellow-300/80 font-semibold">Số sao hiện có</p>
              <p className="text-4xl font-black text-yellow-400">{userStars.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Đã đổi tháng này</p>
              <p className="text-lg font-bold text-white">1,200 ⭐</p>
            </div>
            <div className="h-12 w-px bg-white/10"></div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Tổng đã đổi</p>
              <p className="text-lg font-bold text-white">5,600 ⭐</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <FilterTabs
        tabs={tabOptions}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="solid"
        size="md"
        className="mb-6"
      />

      {/* Content */}
      {activeTab === 'shop' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phần thưởng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/25'
                    : 'bg-slate-800/50 text-gray-400 hover:text-white hover:bg-slate-800 border border-white/10'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRewards.map((reward) => (
              <div
                key={reward.id}
                className="group relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10"
              >
                {/* Tags */}
                <div className="absolute top-3 left-3 z-10 flex gap-2">
                  {reward.isNew && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white">
                      MỚI
                    </span>
                  )}
                  {reward.isHot && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                      HOT
                    </span>
                  )}
                </div>

                {/* Rarity Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${getRarityColor(reward.rarity)} text-white`}>
                    {getRarityBadge(reward.rarity)}
                  </span>
                </div>

                {/* Icon */}
                <div className={`h-32 bg-gradient-to-br ${getRarityColor(reward.rarity)}/20 flex items-center justify-center`}>
                  <span className="text-6xl group-hover:scale-110 transition-transform">{reward.icon}</span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 truncate">{reward.name}</h3>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{reward.description}</p>

                  {/* Stock */}
                  {reward.stock !== undefined && (
                    <p className="text-xs text-orange-400 mb-2">
                      Còn lại: {reward.stock} sản phẩm
                    </p>
                  )}

                  {/* Price & Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      <span className="font-bold text-yellow-400">{reward.cost.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleExchange(reward)}
                      disabled={userStars < reward.cost}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        userStars >= reward.cost
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/25'
                          : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Đổi ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredRewards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Gift className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Không tìm thấy phần thưởng</h3>
              <p className="text-gray-500">Thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                Kho đồ của bạn
              </h2>
              <span className="text-sm text-gray-400">{ownedItems.length} vật phẩm</span>
            </div>

            {ownedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {ownedItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-slate-800/50 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                    <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${getRarityColor(item.rarity)}/20 flex items-center justify-center mb-3`}>
                      <span className="text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{getRarityBadge(item.rarity)}</p>
                    
                    {/* Equipped badge */}
                    {item.id === '4' && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white">
                          Đang dùng
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400">Kho đồ trống</p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all text-sm"
                >
                  Đi mua sắm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white">
            <h2 className="text-lg font-bold px-6 py-4">Lịch sử đổi thưởng</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phần thưởng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Số sao</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ngày đổi</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {exchangeHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-all">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-medium text-white">{item.rewardName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                        <span className="text-yellow-400 font-semibold">{item.cost.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">{item.date}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {exchangeHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Clock className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Chưa có lịch sử</h3>
              <p className="text-gray-500">Bạn chưa đổi phần thưởng nào</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-800/30 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              Phần thưởng vật lý sẽ được gửi đến địa chỉ đăng ký trong vòng 7-14 ngày làm việc
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
