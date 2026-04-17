'use client';

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import Image from "next/image";
import { FilterTabs } from "@/components/portal/student/FilterTabs";
import { getStudentMedia } from "@/lib/api/studentPortalService";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { useSearchParams } from "next/navigation";
import { buildFileUrl } from "@/constants/apiURL";

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
  monthTag?: string;
  title: string;
  className: string;
  date: string;
  coverImage: string;
  mediaCount: number;
  type: 'class' | 'personal';
  media: MediaItem[];
}

function normalizeOwnershipScope(value: unknown): Album['type'] {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'personal' || raw === 'student' || raw === 'child') return 'personal';
  return 'class';
}

function normalizeMediaUrl(value?: string) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/files/serve")) return url;
  return buildFileUrl(url);
}

function formatDisplayDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toLocaleDateString("vi-VN");
}

function isVideoAssetUrl(url?: string) {
  if (!url) return false;
  return /\.(mp4|mov|webm|avi|m4v|mkv)(\?|$)/i.test(url);
}

function normalizeStudentAlbums(payload: any): Album[] {
  const layer = payload?.data?.data ?? payload?.data ?? payload ?? {};
  const source = layer?.media ?? layer;
  const rawAlbums = Array.isArray(source?.albums)
    ? source.albums
    : Array.isArray(layer?.albums)
      ? layer.albums
      : [];
  const topItems = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(layer?.items)
      ? layer.items
      : [];

  const mediaByAlbum = topItems.reduce((acc: Record<string, any[]>, item: any) => {
    const category = normalizeOwnershipScope(item.ownershipScope ?? item.scope ?? item.albumType ?? item.type);
    const albumId = String(item.monthTag ?? item.albumId ?? item.month ?? "general");
    const bucketKey = `${category}:${albumId}`;
    if (!acc[bucketKey]) acc[bucketKey] = [];
    acc[bucketKey].push(item);
    return acc;
  }, {});

  const mappedAlbums = rawAlbums.map((album: any) => {
    const albumId = String(album.monthTag ?? album.albumId ?? album.id ?? album.month ?? "general");
    const normalizedType: Album["type"] = normalizeOwnershipScope(
      album.ownershipScope ?? album.scope ?? album.type ?? album.albumType
    );
    const fallbackKey = `${normalizedType}:${albumId}`;
    const rawMedia = Array.isArray(album.media)
      ? album.media
      : Array.isArray(album.items)
        ? album.items
        : Array.isArray(album.medias)
          ? album.medias
        : mediaByAlbum[fallbackKey] ?? [];

    const media = rawMedia.map((item: any, itemIndex: number) => {
      const rawType = String(item.type ?? item.mediaType ?? "").toLowerCase();
      return {
        id: String(item.id ?? item.mediaId ?? `${albumId}-${itemIndex}`),
        type: rawType.includes("video") ? "video" : "image",
        url: normalizeMediaUrl(String(item.url ?? item.fileUrl ?? item.coverUrl ?? "")),
        thumbnail: normalizeMediaUrl(String(item.thumbnail ?? item.coverUrl ?? item.url ?? item.fileUrl ?? "")),
        title: String(item.title ?? item.caption ?? album.title ?? "Media"),
        date: formatDisplayDate(String(item.date ?? item.createdAt ?? album.date ?? "")),
        likes: Number(item.likes ?? 0),
        isLiked: Boolean(item.isLiked),
      } as MediaItem;
    });

    const fallbackCover = normalizeMediaUrl(String(album.coverUrl ?? album.coverImage ?? media[0]?.thumbnail ?? ""));

    return {
      id: albumId,
      monthTag: String(album.monthTag ?? albumId),
      title: String(album.title ?? "Album lớp học"),
      className: String(album.className ?? album.classTitle ?? ""),
      date: formatDisplayDate(String(album.date ?? media[0]?.date ?? "")),
      coverImage: fallbackCover,
      mediaCount: Number(album.count ?? album.mediaCount ?? media.length ?? 0),
      type: normalizedType,
      media,
    };
  });

  const fallbackAlbums = Object.entries(mediaByAlbum).map(([bucketKey, rawMedia], groupIndex) => {
    const [scopeRaw, monthTagRaw] = bucketKey.split(":");
    const albumId = String(monthTagRaw ?? `album-${groupIndex}`);
    const media = (rawMedia as any[]).map((item: any, itemIndex: number) => {
      const rawType = String(item.type ?? item.mediaType ?? "").toLowerCase();
      return {
        id: String(item.id ?? item.mediaId ?? `${albumId}-${itemIndex}`),
        type: rawType.includes("video") ? "video" : "image",
        url: normalizeMediaUrl(String(item.url ?? item.fileUrl ?? item.coverUrl ?? "")),
        thumbnail: normalizeMediaUrl(String(item.thumbnail ?? item.coverUrl ?? item.url ?? item.fileUrl ?? "")),
        title: String(item.title ?? item.caption ?? `Media ${itemIndex + 1}`),
        date: formatDisplayDate(String(item.date ?? item.createdAt ?? albumId ?? "")),
        likes: Number(item.likes ?? 0),
        isLiked: Boolean(item.isLiked),
      } as MediaItem;
    });

    return {
      id: String(albumId || `album-${groupIndex}`),
      monthTag: String(albumId || "general"),
      title: String(albumId || "Album"),
      className: "",
      date: formatDisplayDate(String(media[0]?.date ?? "")),
      coverImage: normalizeMediaUrl(String(media[0]?.thumbnail ?? "")),
      mediaCount: Number(media.length),
      type: normalizeOwnershipScope(scopeRaw),
      media,
    };
  });

  const sourceAlbums = mappedAlbums.length > 0 ? mappedAlbums : fallbackAlbums;
  const grouped = new Map<string, Album>();

  sourceAlbums.forEach((album: Album) => {
    const key = `${album.type}:${String(album.monthTag ?? (album.id || album.title || "general"))}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...album,
        mediaCount: album.media.length,
      });
      return;
    }

    const mergedMediaMap = new Map<string, MediaItem>();
    [...existing.media, ...album.media].forEach((item) => {
      const mediaKey = String(item.id || item.url || item.thumbnail);
      if (!mergedMediaMap.has(mediaKey)) {
        mergedMediaMap.set(mediaKey, item);
      }
    });

    const mergedMedia = Array.from(mergedMediaMap.values());
    grouped.set(key, {
      ...existing,
      title: existing.title || album.title,
      className: existing.className || album.className,
      date: existing.date !== "-" ? existing.date : album.date,
      coverImage: existing.coverImage || album.coverImage || mergedMedia[0]?.thumbnail || "",
      media: mergedMedia,
      mediaCount: mergedMedia.length,
    });
  });

  return Array.from(grouped.values());
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
  const showVideoCover = isVideoAssetUrl(album.coverImage);

  return (
    <GlassCard className="overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10" />
        {album.coverImage ? (
          showVideoCover ? (
            <video
              src={album.coverImage}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={album.coverImage} alt={album.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/10">
            <ImageIcon className="text-white/60" size={36} />
          </div>
        )}
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
          className="w-full py-2 bg-linear-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/50"
        >
          Xem Album
        </button>
      </div>
    </GlassCard>
  );
}

// --- Media Grid Item ---
function MediaGridItem({ item, onClick }: { item: MediaItem, onClick: () => void }) {
  const previewSource = item.thumbnail || (item.type === "image" ? item.url : "");

  return (
    <div 
      className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-cyan-400/50 transition-all"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      
      {previewSource ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewSource} alt={item.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white/10">
          <ImageIcon size={30} className="text-white/70" />
        </div>
      )}

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
  if (!current) return null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-3000 flex items-center justify-center bg-black/95 p-4" onClick={onClose}>
      {/* Close Button */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-6 top-6 rounded-full border border-white/30 bg-black/70 p-2 text-white transition-all"
      >
        <X size={20} />
      </button>

      {/* Media Content */}
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onPrev}
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/70 p-2 text-white transition-all"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={onNext}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/70 p-2 text-white transition-all"
        >
          <ChevronRight size={22} />
        </button>

        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
          <div>
            <h3 className="text-sm font-semibold">{current.title}</h3>
            <p className="text-xs text-white/70">{current.date}</p>
          </div>
          <div className="text-xs text-white/70">{currentIndex + 1} / {media.length}</div>
        </div>

        <div className="flex h-[70vh] items-center justify-center overflow-hidden bg-black/70 p-8">
          {current.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={current.title} className="max-h-full w-auto max-w-full rounded-lg object-contain" />
          ) : (
            <video 
              src={current.url} 
              controls 
              autoPlay
              className="max-h-full w-auto max-w-full rounded-lg object-contain"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Main Page Component ---
export default function MediaPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'all' | 'class' | 'personal'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useSelectedStudentProfile();

  useEffect(() => {
    if (viewerIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewerIndex]);

  useEffect(() => {
    let alive = true;
    const studentProfileId = selectedProfile?.studentId ?? selectedProfile?.id;
    setLoading(true);
    getStudentMedia(studentProfileId ? { studentProfileId } : undefined)
      .then((res: any) => {
        if (!alive) return;
        setAlbums(normalizeStudentAlbums(res));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedProfile?.id, selectedProfile?.studentId]);

  useEffect(() => {
    if (viewerIndex === null || !selectedAlbum) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewerIndex(null);
        return;
      }
      if (event.key === "ArrowLeft") {
        setViewerIndex((prev) => {
          if (typeof prev !== "number") return prev;
          return prev <= 0 ? selectedAlbum.media.length - 1 : prev - 1;
        });
      }
      if (event.key === "ArrowRight") {
        setViewerIndex((prev) => {
          if (typeof prev !== "number") return prev;
          return prev >= selectedAlbum.media.length - 1 ? 0 : prev + 1;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewerIndex, selectedAlbum]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "class" || tab === "personal") {
      setActiveTab(tab);
      return;
    }
    setActiveTab("all");
  }, [searchParams]);

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

            {/* Tabs - using shared FilterTabs component */}
            <FilterTabs
              tabs={[
                { id: 'all', label: 'Tất cả', count: albums.length },
                { id: 'class', label: 'Lớp học', count: albums.filter(a => a.type === 'class').length, icon: <Users size={18} /> },
                { id: 'personal', label: 'Cá nhân', count: albums.filter(a => a.type === 'personal').length, icon: <User size={18} /> },
              ]}
              activeTab={activeTab}
              onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
              variant="outline"
              size="lg"
              className="mb-6"
            />

            {/* Albums Grid */}
            {loading ? (
              <div className="rounded-2xl border border-white/20 bg-white/10 p-8 text-center text-white/80">
                Đang tải thư viện media...
              </div>
            ) : (
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
              className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-black/50 hover:bg-white/20 text-white transition-all border border-white/20"
            >
              <ChevronLeft size={20} />
              <span className="font-semibold">Quay lại</span>
            </button>

            {/* Album Header */}
            <GlassCard className="p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-2 border-white/30">
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
            onNext={() =>
              setViewerIndex((prev) => {
                if (typeof prev !== "number") return prev;
                return prev >= selectedAlbum.media.length - 1 ? 0 : prev + 1;
              })
            }
            onPrev={() =>
              setViewerIndex((prev) => {
                if (typeof prev !== "number") return prev;
                return prev <= 0 ? selectedAlbum.media.length - 1 : prev - 1;
              })
            }
          />
        )}
      </div>
    </div>
  );
}
