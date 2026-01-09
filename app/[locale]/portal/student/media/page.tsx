'use client';

import { 
  Image as ImageIcon, 
  Video, 
  Calendar,
  Users,
  User,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Filter
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

// --- Types ---
interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
  title: string;
  date: string;
  likes: number;
  isLiked: boolean;
}

interface Album {
  id: string;
  title: string;
  className: string;
  date: string;
  coverImage: string;
  mediaCount: number;
  type: 'class' | 'personal';
  media: MediaItem[];
}

// --- Reusable Components ---
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, action }: { icon: any, title: string, action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-white/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-wide drop-shadow-md">
          {title}
        </h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// --- Album Card Component ---
function AlbumCard({ album, onClick }: { album: Album, onClick: () => void }) {
  return (
    <GlassCard className="overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <Image 
          src={album.coverImage} 
          alt={album.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 z-20">
          <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
            album.type === 'class' 
              ? 'bg-blue-500/30 border-blue-400/50 text-blue-100' 
              : 'bg-purple-500/30 border-purple-400/50 text-purple-100'
          }`}>
            {album.type === 'class' ? (
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>Lớp học</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>Cá nhân</span>
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <h3 className="text-white font-bold text-lg mb-1 drop-shadow-lg">{album.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Calendar size={14} />
              <span>{album.date}</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <ImageIcon size={14} />
              <span>{album.mediaCount}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <button
          onClick={onClick}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/50"
        >
          Xem Album
        </button>
      </div>
    </GlassCard>
  );
}

// --- Media Grid Item ---
function MediaGridItem({ item, onClick }: { item: MediaItem, onClick: () => void }) {

  return (
    <div 
      className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-cyan-400/50 transition-all"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      
      <Image 
        src={item.thumbnail} 
        alt={item.title}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-500"
      />

      {item.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-cyan-500/80 transition-all border-2 border-white/50">
            <Play size={24} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Media Viewer Modal ---
function MediaViewer({ 
  media, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}: { 
  media: MediaItem[], 
  currentIndex: number, 
  onClose: () => void, 
  onNext: () => void, 
  onPrev: () => void 
}) {
  const current = media[currentIndex];

  return (
    <div className="fixed inset-0 backdrop-blur-xl z-100 flex items-center justify-center p-4 pt-30">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-45 right-76 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-50"
      >
        <X size={24} />
      </button>

      {/* Navigation Buttons */}
      <button
        onClick={onPrev}
        className="absolute left-70 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-30"
        disabled={currentIndex === 0}
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={onNext}
        className="absolute right-50 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-30"
        disabled={currentIndex === media.length - 1}
      >
        <ChevronRight size={32} />
      </button>

      {/* Media Content */}
      <div className="max-w-5xl w-full ml-20">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 mb-4">
          {current.type === 'image' ? (
            <Image 
              src={current.url} 
              alt={current.title}
              fill
              className="object-contain"
            />
          ) : (
            <video 
              src={current.url} 
              controls 
              autoPlay
              className="w-full h-full"
            />
          )}
        </div>

        {/* Media Info */}
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-xl font-bold mb-1">{current.title}</h3>
            <p className="text-white/60 text-sm">{current.date}</p>
          </div>
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-white/60 text-sm">
          {currentIndex + 1} / {media.length}
        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'class' | 'personal'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Mock Data
  const albums: Album[] = [
    {
      id: '1',
      title: 'LVV - Starter - 0058',
      className: 'STARTER-0058',
      date: '21 Thg 11 2023',
      coverImage: '/image/Club1.JPG',
      mediaCount: 24,
      type: 'class',
      media: [
        {
          id: 'm1',
          type: 'image',
          url: '/image/Club4.JPG',
          thumbnail: '/image/Club4.JPG',
          title: 'Hoạt động nhóm',
          date: '21/11/2023',
          likes: 15,
          isLiked: false
        },
        {
          id: 'm2',
          type: 'image',
          url: '/image/Club5.JPG',
          thumbnail: '/image/Club5.JPG',
          title: 'Giờ học trên lớp',
          date: '21/11/2023',
          likes: 12,
          isLiked: false
        },
        {
          id: 'm3',
          type: 'image',
          url: '/image/Club6.JPG',
          thumbnail: '/image/Club6.JPG',
          title: 'Hoạt động lớp',
          date: '21/11/2023',
          likes: 20,
          isLiked: true
        },
        {
          id: 'm4',
          type: 'image',
          url: '/image/Club7.JPG',
          thumbnail: '/image/Club7.JPG',
          title: 'Thảo luận nhóm',
          date: '21/11/2023',
          likes: 10,
          isLiked: false
        }
      ]
    },
    {
      id: '2',
      title: 'Ngày hội thể thao 2023',
      className: 'STARTER-0058',
      date: '15 Thg 10 2023',
      coverImage: '/image/Club8.JPG',
      mediaCount: 18,
      type: 'class',
      media: [
        {
          id: 'm5',
          type: 'image',
          url: '/image/Club9.JPG',
          thumbnail: '/image/Club9.JPG',
          title: 'Thi chạy tiếp sức',
          date: '15/10/2023',
          likes: 25,
          isLiked: true
        },
        {
          id: 'm6',
          type: 'image',
          url: '/image/Club10.JPG',
          thumbnail: '/image/Club10.JPG',
          title: 'Những khoảnh khắc đẹp',
          date: '15/10/2023',
          likes: 30,
          isLiked: false
        }
      ]
    },
    {
      id: '3',
      title: 'Album của bé',
      className: 'Cá nhân',
      date: '5 Thg 12 2023',
      coverImage: '/image/Club12.JPG',
      mediaCount: 12,
      type: 'personal',
      media: [
        {
          id: 'm7',
          type: 'image',
          url: '/image/Club13.JPG',
          thumbnail: '/image/Club13.JPG',
          title: 'Bài vẽ của bé',
          date: '5/12/2023',
          likes: 8,
          isLiked: false
        },
        {
          id: 'm8',
          type: 'image',
          url: '/image/Club15.JPG',
          thumbnail: '/image/Club15.JPG',
          title: 'Thuyết trình trước lớp',
          date: '5/12/2023',
          likes: 10,
          isLiked: true
        }
      ]
    },
    {
      id: '4',
      title: 'Hoạt động ngoại khóa',
      className: 'STARTER-0058',
      date: '20 Thg 9 2023',
      coverImage: '/image/Banner3.JPG',
      mediaCount: 30,
      type: 'class',
      media: []
    },
    {
      id: '5',
      title: 'Thành tích của bé',
      className: 'Cá nhân',
      date: '10 Thg 11 2023',
      coverImage: '/image/Banner4.JPG',
      mediaCount: 8,
      type: 'personal',
      media: []
    }
  ];

  const filteredAlbums = albums.filter(album => {
    if (activeTab === 'all') return true;
    return album.type === activeTab;
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {!selectedAlbum && (
          <>
            <SectionTitle 
              icon={ImageIcon} 
              title="Thư viện Media" 
              action={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
                  >
                    {viewMode === 'grid' ? <Grid3x3 size={20} /> : <List size={20} />}
                  </button>
                  <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20">
                    <Filter size={20} />
                  </button>
                </div>
              }
            />

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                Tất cả ({albums.length})
              </button>
              <button
                onClick={() => setActiveTab('class')}
                className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'class'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                <Users size={18} />
                Lớp học ({albums.filter(a => a.type === 'class').length})
              </button>
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'personal'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                <User size={18} />
                Cá nhân ({albums.filter(a => a.type === 'personal').length})
              </button>
            </div>

            {/* Albums Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlbums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onClick={() => setSelectedAlbum(album)}
                />
              ))}
            </div>

            {filteredAlbums.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-block p-6 rounded-full bg-white/10 mb-4">
                  <ImageIcon size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg">Chưa có album nào</p>
              </div>
            )}
          </>
        )}

        {/* Album Detail View */}
        {selectedAlbum && (
          <div>
            {/* Back Button */}
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
            >
              <ChevronLeft size={20} />
              <span className="font-semibold">Quay lại</span>
            </button>

            {/* Album Header */}
            <GlassCard className="p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/30">
                  <Image 
                    src={selectedAlbum.coverImage} 
                    alt={selectedAlbum.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                    selectedAlbum.type === 'class' 
                      ? 'bg-blue-500/30 border border-blue-400/50 text-blue-100' 
                      : 'bg-purple-500/30 border border-purple-400/50 text-purple-100'
                  }`}>
                    {selectedAlbum.type === 'class' ? 'Lớp học' : 'Cá nhân'}
                  </div>
                  <h1 className="text-3xl font-black text-white mb-2">{selectedAlbum.title}</h1>
                  <p className="text-white/70 mb-3">{selectedAlbum.className}</p>
                  <div className="flex items-center gap-4 text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{selectedAlbum.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} />
                      <span>{selectedAlbum.mediaCount} ảnh/video</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Media Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedAlbum.media.map((item, index) => (
                <MediaGridItem
                  key={item.id}
                  item={item}
                  onClick={() => setViewerIndex(index)}
                />
              ))}
            </div>

            {selectedAlbum.media.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-block p-6 rounded-full bg-white/10 mb-4">
                  <ImageIcon size={48} className="text-white/40" />
                </div>
                <p className="text-white/60 text-lg">Album này chưa có ảnh/video</p>
              </div>
            )}
          </div>
        )}

        {/* Media Viewer */}
        {viewerIndex !== null && selectedAlbum && (
          <MediaViewer
            media={selectedAlbum.media}
            currentIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
            onNext={() => setViewerIndex(Math.min(viewerIndex + 1, selectedAlbum.media.length - 1))}
            onPrev={() => setViewerIndex(Math.max(viewerIndex - 1, 0))}
          />
        )}
      </div>
    </div>
  );
}
