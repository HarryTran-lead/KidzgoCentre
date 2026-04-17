"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Play,
  User,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { buildFileUrl } from "@/constants/apiURL";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { getParentMedia } from "@/lib/api/parentPortalService";

type AlbumTab = "class" | "personal";
type MediaKind = "image" | "video";

type ParentMediaItem = {
  id: string;
  albumId: string;
  monthTag?: string;
  ownershipScope?: string;
  title: string;
  type: MediaKind;
  url: string;
  coverUrl: string;
  date: string;
};

type ParentAlbum = {
  id: string;
  monthTag?: string;
  title: string;
  date: string;
  category: "class" | "personal";
  coverUrl: string;
  media: ParentMediaItem[];
};

function normalizeOwnershipScope(value: unknown): "class" | "personal" {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "personal" || raw === "student" || raw === "child") return "personal";
  return "class";
}

function normalizeMediaUrl(value?: string) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/files/serve")) return url;
  return buildFileUrl(url);
}

function isVideoAssetUrl(url?: string) {
  if (!url) return false;
  return /\.(mp4|mov|webm|avi|m4v|mkv)(\?|$)/i.test(url);
}

function normalizeDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function normalizeParentAlbums(payload: any): ParentAlbum[] {
  const layer = payload?.data?.data ?? payload?.data ?? payload ?? {};
  const source = layer?.media ?? layer;
  const albums = Array.isArray(source?.albums)
    ? source.albums
    : Array.isArray(layer?.albums)
      ? layer.albums
      : [];
  const items = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(layer?.items)
      ? layer.items
      : [];

  const mediaByAlbum = items.reduce((acc: Record<string, ParentMediaItem[]>, item: any, index: number) => {
    const category = normalizeOwnershipScope(item.ownershipScope ?? item.scope ?? item.albumType ?? item.type);
    const albumId = String(item.monthTag ?? item.albumId ?? item.month ?? "general");
    const bucketKey = `${category}:${albumId}`;
    const rawType = String(item.type ?? item.mediaType ?? item.contentType ?? "").toLowerCase();
    const isVideo = rawType.includes("video") || rawType.includes("film");
    const mediaUrl = normalizeMediaUrl(String(item.url ?? item.fileUrl ?? item.coverUrl ?? item.thumbnail ?? ""));
    const coverUrl = normalizeMediaUrl(String(item.coverUrl ?? item.thumbnail ?? item.url ?? item.fileUrl ?? ""));

    const mapped: ParentMediaItem = {
      id: String(item.id ?? `${albumId}-${index}`),
      albumId,
      monthTag: String(item.monthTag ?? albumId),
      ownershipScope: String(item.ownershipScope ?? ""),
      title: String(item.title ?? item.caption ?? "Media"),
      type: isVideo ? "video" : "image",
      url: mediaUrl,
      coverUrl: coverUrl || mediaUrl,
      date: normalizeDate(item.date ?? item.createdAt),
    };

    if (!acc[bucketKey]) acc[bucketKey] = [];
    acc[bucketKey].push(mapped);
    return acc;
  }, {});

  const mappedAlbums = albums.map((album: any) => {
    const id = String(album.monthTag ?? album.albumId ?? album.id ?? album.month ?? "general");
    const category: "class" | "personal" = normalizeOwnershipScope(
      album.ownershipScope ?? album.scope ?? album.type ?? album.albumType
    );
    const fallbackKey = `${category}:${id}`;
    const media = Array.isArray(album.media)
      ? album.media.map((item: any, index: number) => ({
          id: String(item.id ?? `${id}-${index}`),
          albumId: id,
          monthTag: String(item.monthTag ?? id),
          ownershipScope: String(item.ownershipScope ?? album.ownershipScope ?? ""),
          title: String(item.title ?? item.caption ?? album.title ?? "Media"),
          type: String(item.type ?? item.mediaType ?? "").toLowerCase().includes("video") ? "video" : "image",
          url: normalizeMediaUrl(String(item.url ?? item.fileUrl ?? item.coverUrl ?? item.thumbnail ?? "")),
          coverUrl: normalizeMediaUrl(String(item.coverUrl ?? item.thumbnail ?? item.url ?? item.fileUrl ?? "")) || normalizeMediaUrl(String(item.url ?? item.fileUrl ?? "")),
          date: normalizeDate(item.date ?? item.createdAt ?? album.date),
        }))
      : Array.isArray(album.items)
        ? album.items.map((item: any, index: number) => ({
            id: String(item.id ?? `${id}-${index}`),
            albumId: id,
            monthTag: String(item.monthTag ?? id),
            ownershipScope: String(item.ownershipScope ?? album.ownershipScope ?? ""),
            title: String(item.title ?? item.caption ?? album.title ?? "Media"),
            type: String(item.type ?? item.mediaType ?? "").toLowerCase().includes("video") ? "video" : "image",
            url: normalizeMediaUrl(String(item.url ?? item.fileUrl ?? item.coverUrl ?? item.thumbnail ?? "")),
            coverUrl: normalizeMediaUrl(String(item.coverUrl ?? item.thumbnail ?? item.url ?? item.fileUrl ?? "")) || normalizeMediaUrl(String(item.url ?? item.fileUrl ?? "")),
            date: normalizeDate(item.date ?? item.createdAt ?? album.date),
          }))
        : mediaByAlbum[fallbackKey] ?? [];

    return {
      id,
      monthTag: String(album.monthTag ?? id),
      title: String(album.title ?? "Album"),
      date: normalizeDate(album.date),
      category,
      coverUrl: normalizeMediaUrl(String(album.coverUrl ?? album.coverImage ?? media[0]?.coverUrl ?? media[0]?.url ?? "")),
      media,
    };
  });

  const fallbackAlbums = Object.entries(mediaByAlbum).map(([bucketKey, media]) => {
    const [categoryRaw, idRaw] = bucketKey.split(":");
    const id = String(idRaw ?? "general");
    const category = normalizeOwnershipScope(categoryRaw);
    const typedMedia = media as ParentMediaItem[];
    return {
      id,
      monthTag: id,
      title: id === "general" ? "Album" : id,
      date: typedMedia[0]?.date ?? "-",
      category,
      coverUrl: typedMedia[0]?.coverUrl ?? typedMedia[0]?.url ?? "",
      media: typedMedia,
    };
  });

  const sourceAlbums = mappedAlbums.length > 0 ? mappedAlbums : fallbackAlbums;
  const grouped = new Map<string, ParentAlbum>();

  sourceAlbums.forEach((album: ParentAlbum) => {
    const key = `${album.category}:${String(album.monthTag ?? (album.id || album.title || "general"))}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...album,
        media: [...album.media],
      });
      return;
    }

    const mediaMap = new Map<string, ParentMediaItem>();
    [...existing.media, ...album.media].forEach((item) => {
      const mediaKey = String(item.id || item.url || item.coverUrl);
      if (!mediaMap.has(mediaKey)) {
        mediaMap.set(mediaKey, item);
      }
    });

    const mergedMedia = Array.from(mediaMap.values());
    grouped.set(key, {
      ...existing,
      title: existing.title || album.title,
      date: existing.date !== "-" ? existing.date : album.date,
      coverUrl: existing.coverUrl || album.coverUrl || mergedMedia[0]?.coverUrl || mergedMedia[0]?.url || "",
      media: mergedMedia,
    });
  });

  return Array.from(grouped.values());
}

export default function ParentMediaPage() {
  const { selectedProfile } = useSelectedStudentProfile();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<AlbumTab>("personal");
  const [albums, setAlbums] = useState<ParentAlbum[]>([]);

  const [activeAlbum, setActiveAlbum] = useState<ParentAlbum | null>(null);
  const [viewerItems, setViewerItems] = useState<ParentMediaItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const closeViewer = () => {
    setViewerIndex(null);
    setActiveAlbum(null);
    setViewerItems([]);
  };

  useEffect(() => {
    if (viewerIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [viewerIndex]);

  const goNext = () => {
    setViewerIndex((prev) => {
      if (typeof prev !== "number") return prev;
      return prev >= viewerItems.length - 1 ? 0 : prev + 1;
    });
  };

  const goPrev = () => {
    setViewerIndex((prev) => {
      if (typeof prev !== "number") return prev;
      return prev <= 0 ? viewerItems.length - 1 : prev - 1;
    });
  };

  useEffect(() => {
    let alive = true;
    const studentProfileId = selectedProfile?.studentId ?? selectedProfile?.id;

    setLoading(true);
    getParentMedia(studentProfileId ? { studentProfileId } : undefined)
      .then((res) => {
        if (!alive) return;
        setAlbums(normalizeParentAlbums(res));
      })
      .catch(() => {
        if (!alive) return;
        setAlbums([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [selectedProfile?.id, selectedProfile?.studentId]);

  const filteredAlbums = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return albums.filter((album) => {
      const matchTab = album.category === tab;
      const matchSearch =
        !normalizedSearch ||
        album.title.toLowerCase().includes(normalizedSearch) ||
        album.media.some((item) => item.title.toLowerCase().includes(normalizedSearch));
      return matchTab && matchSearch;
    });
  }, [albums, search, tab]);

  const currentMedia = viewerItems;
  const currentItem = viewerIndex !== null ? currentMedia[viewerIndex] : null;

  useEffect(() => {
    if (!currentItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") {
        goPrev();
      }
      if (event.key === "ArrowRight") {
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentItem, currentMedia.length]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <section className="rounded-2xl border border-red-100 bg-white p-5">
        <h1 className="text-2xl font-bold text-gray-900">Thư viện media phụ huynh</h1>
        <p className="mt-1 text-sm text-gray-600">Xem album ảnh/video đã được duyệt và công khai cho học viên.</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === "class" ? "bg-red-600 text-white" : "border border-gray-200 text-gray-700"}`}
            onClick={() => setTab("class")}
          >
            <span className="inline-flex items-center gap-1"><Users size={14} /> Ảnh của lớp ({albums.filter((album) => album.category === "class").length})</span>
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-medium ${tab === "personal" ? "bg-red-600 text-white" : "border border-gray-200 text-gray-700"}`}
            onClick={() => setTab("personal")}
          >
            <span className="inline-flex items-center gap-1"><User size={14} /> Ảnh của con ({albums.filter((album) => album.category === "personal").length})</span>
          </button>
          <input
            className="ml-auto h-10 min-w-65 rounded-xl border border-gray-200 px-3 text-sm"
            placeholder="Tìm theo tên album hoặc ảnh/video"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-red-100 bg-white p-5">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500">Đang tải media...</p>
        ) : filteredAlbums.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">Không có album phù hợp.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAlbums.map((album) => (
              <article key={album.id} className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative h-44 bg-gray-100">
                  {album.coverUrl ? (
                    isVideoAssetUrl(album.coverUrl) ? (
                      <video src={album.coverUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <Image src={album.coverUrl} alt={album.title} fill className="object-cover" />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center"><ImageIcon className="text-gray-400" size={36} /></div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                    {album.media.length} mục
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="line-clamp-1 text-base font-semibold text-gray-900">{album.title}</h3>
                  <p className="inline-flex items-center gap-1 text-xs text-gray-500"><Calendar size={12} /> {album.date}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!album.media.length) return;
                      setActiveAlbum(album);
                      setViewerItems(album.media);
                      setViewerIndex(0);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Eye size={14} /> Xem album
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {currentItem && viewerIndex !== null && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-3000 flex items-center justify-center bg-black/95 p-4" onClick={closeViewer}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                closeViewer();
              }}
              className="absolute right-6 top-6 rounded-full border border-white/30 bg-black/70 p-2 text-white"
            >
              <X size={18} />
            </button>

            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-black/40"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/70 p-2 text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/70 p-2 text-white"
              >
                <ChevronRight size={20} />
              </button>

              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
                <div>
                  <div className="text-sm font-semibold">{currentItem.title}</div>
                  <div className="text-xs text-white/70">{activeAlbum?.title} • {viewerIndex + 1}/{currentMedia.length}</div>
                </div>
              </div>
              <div className="flex h-[70vh] items-center justify-center bg-black/70 p-8">
                {currentItem.type === "video" ? (
                  <video src={currentItem.url} controls autoPlay className="max-h-full w-auto max-w-full rounded-lg object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentItem.url || currentItem.coverUrl} alt={currentItem.title} className="max-h-full w-auto max-w-full rounded-lg object-contain" />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
