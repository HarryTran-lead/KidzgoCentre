'use client';

import { useState, useEffect } from "react";
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
  Filter,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  FolderOpen,
  Camera,
  Film,
  Music,
  Download,
  Maximize2,
  Loader2
} from "lucide-react";
import Image from "next/image";
import { FilterTabs, TabOption } from "@/components/portal/student/FilterTabs";
import { getStudentMedia } from "@/lib/api/studentPortalService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";

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
  description?: string;
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
  description?: string;
}

// --- Album Card Component ---
function AlbumCard({ album, onClick }: { album: Album; onClick: () => void }) {
  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 group shadow-xl shadow-purple-500/10">
      <div className="relative h-52 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
        <Image 
          src={album.coverImage} 
          alt={album.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 z-20">
          <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-lg ${
            album.type === 'class' 
              ? 'bg-blue-500/30 border-blue-400/50 text-blue-100' 
              : 'bg-purple-500/30 border-purple-400/50 text-purple-100'
          }`}>
            <div className="flex items-center gap-1.5">
              {album.type === 'class' ? <Users size={12} /> : <User size={12} />}
              <span>{album.type === 'class' ? 'Lớp học' : 'Cá nhân'}</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg line-clamp-1">{album.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{album.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Camera size={12} />
                <span>{album.mediaCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <button
          onClick={onClick}
          className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 cursor-pointer"
        >
          <span className="flex items-center justify-center gap-2">
            <FolderOpen size={16} />
            Xem Album
          </span>
        </button>
      </div>
    </div>
  );
}

// --- Media Grid Item ---
function MediaGridItem({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  return (
    <div 
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 bg-gradient-to-br from-purple-500/10 to-slate-900/80"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
      
      <Image 
        src={item.thumbnail} 
        alt={item.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {item.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300 border-2 border-white/50">
            <Play size={24} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-sm font-bold line-clamp-1">{item.title}</p>
        <p className="text-white/60 text-xs">{item.date}</p>
      </div>
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
  media: MediaItem[]; 
  currentIndex: number; 
  onClose: () => void; 
  onNext: () => void; 
  onPrev: () => void;
}) {
  const current = media[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 z-50 border border-white/20 cursor-pointer"
      >
        <X size={24} />
      </button>

      {/* Navigation Buttons */}
      <button
        onClick={onPrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 z-50 border border-white/20 cursor-pointer"
        disabled={currentIndex === 0}
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={onNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 z-50 border border-white/20 cursor-pointer"
        disabled={currentIndex === media.length - 1}
      >
        <ChevronRight size={28} />
      </button>

      {/* Media Content */}
      <div className="max-w-6xl w-full">
        <div className="relative rounded-2xl overflow-hidden bg-black/50 shadow-2xl">
          {current.type === 'image' ? (
            <div className="relative max-h-[80vh] min-h-[400px]">
              <Image 
                src={current.url} 
                alt={current.title}
                width={1200}
                height={800}
                className="object-contain max-h-[80vh] w-auto mx-auto"
                unoptimized
              />
            </div>
          ) : (
            <video 
              src={current.url} 
              controls 
              autoPlay
              className="w-full max-h-[80vh]"
            />
          )}
        </div>

        {/* Media Info */}
        <div className="mt-4 flex items-center justify-between text-white">
          <div>
            <h3 className="text-xl font-bold mb-1 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {current.title}
            </h3>
            <p className="text-white/50 text-sm flex items-center gap-2">
              <Calendar size={14} />
              {current.date}
            </p>
            {current.description && (
              <p className="text-white/70 text-sm mt-2">{current.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer">
              <Heart size={18} className={current.isLiked ? "fill-red-500 text-red-500" : "text-white/70"} />
              <span className="text-sm">{current.likes}</span>
            </button>
            <button className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer">
              <Download size={18} />
            </button>
            <button className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer">
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-white/50 text-sm">
          {currentIndex + 1} / {media.length}
        </div>
      </div>
    </div>
  );
}

// --- Skeleton Loader ---
function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl overflow-hidden animate-pulse">
          <div className="h-52 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
          <div className="p-4">
            <div className="h-10 bg-purple-500/20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Page Component ---
export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'class' | 'personal'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const { selectedProfile } = useSelectedStudentProfile();

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    let alive = true;
    const studentProfileId = selectedProfile?.studentId ?? selectedProfile?.id;
    getStudentMedia(studentProfileId ? { studentProfileId } : undefined)
      .then((res: any) => {
        if (!alive) return;
        const raw = res?.data?.data?.items ?? res?.data?.data ?? res?.data ?? [];
        setAlbums(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedProfile?.id]);

  const filteredAlbums = albums.filter(album => {
    if (activeTab === 'all') return true;
    return album.type === activeTab;
  });

  const totalMediaCount = albums.reduce((sum, album) => sum + album.mediaCount, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header Section */}
      <div className={`shrink-0 px-6 pt-6 pb-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        
        {/* Hero Header */}
        <div className="mb-8 relative">
          <div className="text-center pt-4">
            <div className="inline-block relative">
              {/* Glowing background effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500 opacity-30 blur-2xl"></div>

              {/* Main frame */}
              <div
                className="relative rounded-3xl px-8 md:px-16 py-8 md:py-10 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-violet-500/20 backdrop-blur-xl border border-transparent flex flex-col items-center justify-center"
                style={{
                  backgroundImage: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3), rgba(217,70,239,0.3)), linear-gradient(to right, rgba(168,85,247,0.1), rgba(236,72,153,0.1))",
                  boxShadow: "0 0 60px rgba(168,85,247,0.3), 0 0 30px rgba(236,72,153,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-3xl p-[2px] pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #ec4899, #d946ef, #a855f7)",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    padding: "4px",
                  }}
                ></div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Camera className="w-8 h-8 text-purple-400 animate-pulse" />
                    <h1 className="text-5xl md:text-6xl lg:text-5xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-lg">
                      THƯ VIỆN
                    </h1>
                    <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
                  </div>
                  <p className="text-base md:text-lg font-medium text-purple-200/80">
                    Lưu giữ những hình ảnh và video đẹp nhất
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-md mx-auto">
          <div className="rounded-xl p-3 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-sm text-center">
            <div className="text-2xl font-bold text-purple-300">{albums.length}</div>
            <div className="text-xs font-semibold text-purple-400/70">Album</div>
          </div>
          <div className="rounded-xl p-3 border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-slate-900/80 backdrop-blur-sm text-center">
            <div className="text-2xl font-bold text-pink-300">{totalMediaCount}</div>
            <div className="text-xs font-semibold text-purple-400/70">Ảnh/Video</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        
        {/* Album List View (when no album selected) */}
        {!selectedAlbum && (
          <>
            {/* Header with actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Album của con
                </h2>
                <p className="text-sm text-purple-300/60 mt-0.5">Tất cả khoảnh khắc đáng nhớ</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all duration-300 border border-purple-500/30 hover:scale-105 cursor-pointer"
                >
                  {viewMode === 'grid' ? <Grid3x3 size={18} /> : <List size={18} />}
                </button>
                <button className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all duration-300 border border-purple-500/30 hover:scale-105 cursor-pointer">
                  <Filter size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <FilterTabs
                tabs={[
                  { id: 'all', label: 'Tất cả', count: albums.length, icon: <Sparkles size={14} /> },
                  { id: 'class', label: 'Lớp học', count: albums.filter(a => a.type === 'class').length, icon: <Users size={14} /> },
                  { id: 'personal', label: 'Cá nhân', count: albums.filter(a => a.type === 'personal').length, icon: <User size={14} /> },
                ]}
                activeTab={activeTab}
                onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
                variant="outline"
                size="md"
              />
            </div>

            {/* Loading State */}
            {loading && <SkeletonLoader />}

            {/* Albums Grid */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAlbums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onClick={() => setSelectedAlbum(album)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredAlbums.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-block p-6 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 mb-4">
                  <ImageIcon size={48} className="text-purple-400/40" />
                </div>
                <p className="text-purple-300/60 text-lg font-semibold">Chưa có album nào</p>
                <p className="text-purple-300/40 text-sm mt-1">Hãy tham gia các lớp học để có thêm ảnh và video nhé!</p>
              </div>
            )}
          </>
        )}

        {/* Album Detail View */}
        {selectedAlbum && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Back Button */}
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all duration-300 border border-purple-500/30 hover:scale-105 cursor-pointer"
            >
              <ChevronLeft size={18} />
              <span className="font-semibold">Quay lại thư viện</span>
            </button>

            {/* Album Header */}
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/80 backdrop-blur-xl p-6 mb-6 overflow-hidden relative shadow-xl shadow-purple-500/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
              <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-purple-400/30 shadow-lg">
                  <Image 
                    src={selectedAlbum.coverImage} 
                    alt={selectedAlbum.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-3 ${
                    selectedAlbum.type === 'class' 
                      ? 'bg-blue-500/30 border border-blue-400/50 text-blue-100' 
                      : 'bg-purple-500/30 border border-purple-400/50 text-purple-100'
                  }`}>
                    {selectedAlbum.type === 'class' ? <Users size={12} /> : <User size={12} />}
                    {selectedAlbum.type === 'class' ? 'Lớp học' : 'Cá nhân'}
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                    {selectedAlbum.title}
                  </h1>
                  <p className="text-purple-300/60 mb-3 text-sm">{selectedAlbum.className}</p>
                  <div className="flex flex-wrap items-center gap-4 text-purple-300/50 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{selectedAlbum.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Camera size={14} />
                      <span>{selectedAlbum.mediaCount} ảnh/video</span>
                    </div>
                  </div>
                  {selectedAlbum.description && (
                    <p className="mt-3 text-purple-300/70 text-sm">{selectedAlbum.description}</p>
                  )}
                </div>
              </div>
            </div>

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

            {/* Empty Media State */}
            {selectedAlbum.media.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-block p-6 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 mb-4">
                  <Film size={48} className="text-purple-400/40" />
                </div>
                <p className="text-purple-300/60 text-lg font-semibold">Album này chưa có ảnh/video</p>
              </div>
            )}
          </div>
        )}

        {/* Media Viewer Modal */}
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(139, 92, 246, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.6);
        }
      `}</style>
    </div>
  );
}