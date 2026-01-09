'use client';

import { 
  Flame, 
  Star, 
  Trophy, 
  Crown,
  Sparkles,
  Medal,
  TrendingUp,
  Award,
  Gem,
  ChevronRight,
  Clock,
  CheckCircle,
  Circle,
  Gift,
  Zap,
  Target,
  Calendar,
  Users
} from "lucide-react";
import { useState } from "react";
import { FilterTabs } from "@/components/portal/student/FilterTabs";

export default function GamificationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'rewards' | 'leaderboard'>('overview');

  // Mock Data
  const userStats = {
    name: "Nguyễn Băng Ngân",
    level: 12,
    currentXP: 2450,
    nextLevelXP: 3000,
    totalStars: 8640,
    streak: 36,
    rank: 8,
    totalUsers: 150,
  };

  const achievements = [
    { id: 1, name: "Học viên siêu sao", icon: "⭐", unlocked: true, rarity: "legendary" },
    { id: 2, name: "Thợ săn kiến thức", icon: "🎯", unlocked: true, rarity: "epic" },
    { id: 3, name: "Bậc thầy streak", icon: "🔥", unlocked: false, rarity: "rare" },
    { id: 4, name: "Người chinh phục", icon: "👑", unlocked: false, rarity: "legendary" },
  ];

  const dailyMissions = [
    { id: 1, title: "Hoàn thành bài tập", desc: "Nộp 3 bài tập hôm nay", progress: 3, total: 3, reward: 100, type: "xp", completed: true },
    { id: 2, title: "Học từ vựng", desc: "Học 20 từ mới", progress: 15, total: 20, reward: 50, type: "star", completed: false },
    { id: 3, title: "Tham gia lớp học", desc: "Tham dự đủ giờ học", progress: 2, total: 3, reward: 80, type: "xp", completed: false },
  ];

  const weeklyQuests = [
    { id: 1, title: "Chinh phục 100 từ", desc: "Học 100 từ vựng mới trong tuần", progress: 75, total: 100, reward: 500, completed: false },
    { id: 2, title: "Streak Master", desc: "Duy trì streak 7 ngày", progress: 5, total: 7, reward: 300, completed: false },
  ];

  const rewards = [
    { id: 1, name: "Avatar VIP", cost: 1000, icon: "👑", rarity: "legendary" },
    { id: 2, name: "Frame Rainbow", cost: 800, icon: "🌈", rarity: "epic" },
    { id: 3, name: "Badge Master", cost: 500, icon: "🏆", rarity: "rare" },
    { id: 4, name: "Sticker Pack", cost: 300, icon: "✨", rarity: "common" },
  ];

  const leaderboard = [
    { rank: 1, name: "Trần Minh Khôi", level: 15, stars: 12500, avatar: "🥇" },
    { rank: 2, name: "Lê Thu Hà", level: 14, stars: 11800, avatar: "🥈" },
    { rank: 3, name: "Nguyễn Văn An", level: 13, stars: 10200, avatar: "🥉" },
    { rank: 8, name: "Nguyễn Băng Ngân", level: 12, stars: 8640, avatar: "👤", isCurrentUser: true },
  ];

  const streakDays = [
    { day: "T2", active: true },
    { day: "T3", active: true },
    { day: "T4", active: true },
    { day: "T5", active: true },
    { day: "T6", active: true },
    { day: "T7", active: true },
    { day: "CN", active: false },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-500';
      case 'epic': return 'from-purple-400 via-pink-500 to-purple-600';
      case 'rare': return 'from-blue-400 via-cyan-500 to-blue-600';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] text-white p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Header Stats - Floating Card */}
      <div className="max-w-7xl mx-auto mb-8">
         <div className="max-w-7xl mx-auto mb-6">
        <div className=" p-2 rounded-2xl">
          <FilterTabs
            tabs={[
              { id: 'overview', label: 'Tổng quan', icon: <Sparkles className="w-4 h-4" /> },
              { id: 'missions', label: 'Nhiệm vụ', icon: <Target className="w-4 h-4" /> },
              { id: 'rewards', label: 'Phần thưởng', icon: <Gift className="w-4 h-4" /> },
              { id: 'leaderboard', label: 'Bảng xếp hạng', icon: <Trophy className="w-4 h-4" /> },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
            variant="outline"
            size="lg"
            className="w-full"
          />
        </div>
      </div>
        <div className="relative bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Level Badge */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRarityColor('legendary')} p-1 shadow-2xl animate-pulse`}>
                  <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-400 font-bold">LEVEL</span>
                    <span className="text-3xl font-black bg-gradient-to-b from-yellow-200 to-yellow-600 bg-clip-text text-transparent">{userStats.level}</span>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2">
                  <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" fill="currentColor" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white/90">{userStats.name}</h2>
                <p className="text-sm text-purple-300">Rank #{userStats.rank}</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="md:col-span-2">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-white/80">Experience Points</span>
                <span className="text-sm font-bold text-cyan-400">{userStats.currentXP} / {userStats.nextLevelXP} XP</span>
              </div>
              <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 relative overflow-hidden"
                  style={{ width: `${(userStats.currentXP / userStats.nextLevelXP) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">🎯 {userStats.nextLevelXP - userStats.currentXP} XP để lên Level {userStats.level + 1}</p>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-500/30">
              <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-400" fill="currentColor" />
              </div>
              <div>
                <p className="text-xs text-yellow-300/80 font-semibold">Total Stars</p>
                <p className="text-2xl font-black text-yellow-400">{userStats.totalStars.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - using shared FilterTabs component */}
     

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Achievements & Streak */}
            <div className="lg:col-span-2 space-y-6">
              {/* Achievements */}
              <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Thành tựu
                  </h3>
                  <span className="text-sm text-gray-400">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className={`relative rounded-xl p-4 border-2 transition-all ${
                        achievement.unlocked
                          ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}/20 border-${achievement.rarity === 'legendary' ? 'yellow' : achievement.rarity === 'epic' ? 'purple' : 'blue'}-500/50 hover:scale-105 cursor-pointer`
                          : 'bg-slate-800/50 border-gray-700/50 opacity-50'
                      }`}
                    >
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <p className="text-xs font-bold text-white/90 line-clamp-2">{achievement.name}</p>
                      {achievement.unlocked && (
                        <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-green-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Quest Banner */}
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImRvdHMiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2RvdHMpIi8+PC9zdmc+')] opacity-50"></div>
                <div className="relative z-10 p-6 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Medal className="w-5 h-5 text-yellow-300" />
                      <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Thách thức tuần</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-1">Chinh phục 100 từ vựng</h3>
                    <p className="text-white/80 text-sm">Hoàn thành để nhận 500 Stars + Badge đặc biệt</p>
                    <div className="mt-3">
                      <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 w-3/4"></div>
                      </div>
                      <p className="text-xs text-white/70 mt-1">75/100 từ</p>
                    </div>
                  </div>
                  <div className="text-6xl">🏆</div>
                </div>
              </div>
            </div>

            {/* Right Column - Streak */}
            <div className="space-y-6">
              {/* Streak Card */}
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10 text-center">
                  <Flame className="w-16 h-16 mx-auto text-orange-500 mb-2 animate-pulse" fill="currentColor" />
                  <h3 className="text-5xl font-black text-white mb-1">{userStats.streak}</h3>
                  <p className="text-orange-300 font-semibold mb-4">Ngày liên tiếp</p>
                  
                  <div className="flex justify-center gap-2 mb-4">
                    {streakDays.map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${
                          day.active 
                            ? 'bg-orange-500 border-orange-400' 
                            : 'bg-slate-800/50 border-gray-700'
                        }`}>
                          {day.active && <Flame className="w-4 h-4 text-white" fill="currentColor" />}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1">{day.day}</span>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-white/60">🔥 Duy trì streak để nhận thưởng x2!</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-5 border border-white/10 space-y-3">
                <h4 className="font-bold text-white/90 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Thống kê nhanh
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Nhiệm vụ hoàn thành</span>
                    <span className="text-sm font-bold text-white">248</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Giờ học tích lũy</span>
                    <span className="text-sm font-bold text-white">156h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Rank cao nhất</span>
                    <span className="text-sm font-bold text-yellow-400">#3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MISSIONS TAB */}
        {activeTab === 'missions' && (
          <div className="space-y-6">
            {/* Daily Missions */}
            <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Nhiệm vụ hàng ngày
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  Làm mới sau: 04:30:00
                </div>
              </div>
              <div className="space-y-3">
                {dailyMissions.map((mission) => (
                  <div 
                    key={mission.id}
                    className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-xl p-4 border border-white/5 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center ${
                        mission.completed ? 'bg-green-500/20' : 'bg-cyan-500/20'
                      }`}>
                        {mission.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className={`font-bold ${mission.completed ? 'text-white/50 line-through' : 'text-white'}`}>
                              {mission.title}
                            </h4>
                            <p className="text-sm text-gray-400">{mission.desc}</p>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-black/30">
                            {mission.type === 'xp' ? (
                              <Zap className="w-4 h-4 text-cyan-400" fill="currentColor" />
                            ) : (
                              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                            )}
                            <span className={`text-sm font-bold ${mission.type === 'xp' ? 'text-cyan-400' : 'text-yellow-400'}`}>
                              +{mission.reward}
                            </span>
                          </div>
                        </div>
                        {!mission.completed && (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                style={{ width: `${(mission.progress / mission.total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-400">{mission.progress}/{mission.total}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Quests */}
            <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-xl font-bold flex items-center gap-2 mb-5">
                <Trophy className="w-5 h-5 text-purple-400" />
                Thử thách tuần
              </h3>
              <div className="space-y-4">
                {weeklyQuests.map((quest) => (
                  <div key={quest.id} className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-5 border border-purple-500/30">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-white">{quest.title}</h4>
                        <p className="text-sm text-purple-300">{quest.desc}</p>
                      </div>
                      <div className="text-2xl">🏆</div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-500"
                          style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-white">{quest.progress}/{quest.total}</span>
                    </div>
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Star className="w-4 h-4" fill="currentColor" />
                      <span className="text-sm font-bold">Phần thưởng: {quest.reward} Stars</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REWARDS TAB */}
        {activeTab === 'rewards' && (
          <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                Cửa hàng phần thưởng
              </h3>
              <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/30">
                <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                <span className="font-bold text-yellow-400">{userStats.totalStars.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rewards.map((reward) => (
                <div 
                  key={reward.id}
                  className={`relative bg-gradient-to-br ${getRarityColor(reward.rarity)}/20 rounded-xl p-5 border-2 border-${reward.rarity === 'legendary' ? 'yellow' : reward.rarity === 'epic' ? 'purple' : reward.rarity === 'rare' ? 'blue' : 'gray'}-500/50 hover:scale-105 transition-all cursor-pointer group`}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{reward.icon}</div>
                    <h4 className="font-bold text-white mb-2">{reward.name}</h4>
                    <div className="flex items-center justify-center gap-2 bg-black/30 px-3 py-2 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      <span className="font-bold text-yellow-400">{reward.cost}</span>
                    </div>
                    <button className="w-full mt-3 bg-white/10 hover:bg-white/20 py-2 rounded-lg font-bold text-sm transition-all">
                      Đổi ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Bảng xếp hạng
              </h3>
              <span className="text-sm text-gray-400">Top học viên tháng này</span>
            </div>
            <div className="space-y-3">
              {leaderboard.map((user, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    user.isCurrentUser
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-2 border-purple-500/50'
                      : 'bg-slate-800/30 hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`text-3xl ${user.rank <= 3 ? 'text-4xl' : ''}`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{user.name}</span>
                      {user.isCurrentUser && (
                        <span className="text-xs bg-purple-500 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>Level {user.level}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                        {user.stars.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className={`text-2xl font-black ${
                    user.rank === 1 ? 'text-yellow-400' :
                    user.rank === 2 ? 'text-gray-400' :
                    user.rank === 3 ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    #{user.rank}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}