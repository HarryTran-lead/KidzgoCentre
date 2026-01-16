"use client";

import { useState } from "react";
import { Image as ImageIcon, Video, FileText, Download, Eye, Play, Folder, Grid3x3, List, Filter, Calendar, File, Image, Film, Search, ChevronRight, MoreVertical, Share2 } from "lucide-react";

type TabType = "photos" | "videos" | "documents";

const MOCK_MEDIA = {
  photos: [
    {
      id: "1",
      title: "Hoạt động ngoại khóa - Tháng 12",
      date: "20/12/2024",
      count: 15,
      thumbnail: "/image/placeholder.jpg",
      tags: ["Hoạt động", "Ngoại khóa"],
      featured: true
    },
    {
      id: "2",
      title: "Lớp học Speaking",
      date: "15/12/2024",
      count: 8,
      thumbnail: "/image/placeholder.jpg",
      tags: ["Lớp học", "Speaking"],
    },
    {
      id: "3",
      title: "Christmas Party 2024",
      date: "24/12/2024",
      count: 25,
      thumbnail: "/image/placeholder.jpg",
      tags: ["Sự kiện", "Lễ hội"],
      featured: true
    },
  ],
  videos: [
    {
      id: "1",
      title: "Bài thuyết trình của con",
      date: "18/12/2024",
      duration: "5:32",
      thumbnail: "/image/placeholder.jpg",
      views: 45,
    },
    {
      id: "2",
      title: "Phỏng vấn với giáo viên",
      date: "12/12/2024",
      duration: "8:15",
      thumbnail: "/image/placeholder.jpg",
      views: 32,
    },
  ],
  documents: [
    {
      id: "1",
      title: "Giáo trình Level 3",
      date: "01/12/2024",
      size: "2.5 MB",
      type: "PDF",
      subject: "Tiếng Anh",
    },
    {
      id: "2",
      title: "Bảng từ vựng Unit 5",
      date: "10/12/2024",
      size: "1.2 MB",
      type: "PDF",
      subject: "Từ vựng",
    },
    {
      id: "3",
      title: "Bài tập về nhà tuần 4",
      date: "22/12/2024",
      size: "3.1 MB",
      type: "DOCX",
      subject: "Bài tập",
    },
  ],
};

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<TabType>("photos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const getFileIcon = (type: string) => {
    if (type === "PDF") return <FileText className="w-5 h-5 text-rose-500" />;
    if (type === "DOCX") return <File className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (size: string) => {
    return size.replace("MB", " MB");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/20 via-white to-white p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <Folder className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Kho tài liệu
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Album ảnh, video và tài liệu học tập của con
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
            <Filter size={16} /> Lọc
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-pink-600">{MOCK_MEDIA.photos.length}</div>
              <div className="text-sm text-gray-600 mt-1">Album ảnh</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl">
              <Image className="w-6 h-6 text-pink-500" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {MOCK_MEDIA.photos.reduce((sum, album) => sum + album.count, 0)} ảnh
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{MOCK_MEDIA.videos.length}</div>
              <div className="text-sm text-gray-600 mt-1">Video</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-sky-500/10 rounded-xl">
              <Film className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {MOCK_MEDIA.videos.reduce((sum, video) => sum + parseInt(video.duration), 0)} phút
          </div>
        </div>

        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{MOCK_MEDIA.documents.length}</div>
              <div className="text-sm text-gray-600 mt-1">Tài liệu</div>
            </div>
            <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {MOCK_MEDIA.documents.length} tệp
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu, album hoặc video..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-pink-50 rounded-xl p-1 border border-pink-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "grid" 
                    ? "bg-white text-pink-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "list" 
                    ? "bg-white text-pink-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: "photos" as TabType, label: "Ảnh", icon: ImageIcon, count: MOCK_MEDIA.photos.length },
            { key: "videos" as TabType, label: "Video", icon: Video, count: MOCK_MEDIA.videos.length },
            { key: "documents" as TabType, label: "Tài liệu", icon: FileText, count: MOCK_MEDIA.documents.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  : "bg-white border border-pink-200 text-gray-600 hover:bg-pink-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-white/20" : "bg-gray-100"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
        {activeTab === "photos" && (
          <>
            {MOCK_MEDIA.photos.map((album) => (
              <div
                key={album.id}
                className={`group relative rounded-2xl border border-pink-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                  viewMode === "grid" ? "h-full" : ""
                } bg-gradient-to-br from-white to-pink-50`}
              >
                {/* Featured badge */}
                {album.featured && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-semibold text-white shadow-sm">
                      Nổi bật
                    </span>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-pink-400 to-rose-400 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <ImageIcon className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
                      {album.count} ảnh
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{album.title}</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {album.date}
                      </div>
                      <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Tags */}
                    {album.tags && (
                      <div className="flex flex-wrap gap-2">
                        {album.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded-lg bg-white/80 text-xs text-gray-600 border border-pink-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
                        <Eye className="w-4 h-4" />
                        Xem album
                      </button>
                      <button className="p-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors cursor-pointer">
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === "videos" && (
          <>
            {MOCK_MEDIA.videos.map((video) => (
              <div
                key={video.id}
                className="group relative rounded-2xl border border-pink-200 overflow-hidden hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50"
              >
                {/* Video Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-sky-400 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
                      {video.duration}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{video.title}</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {video.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Eye className="w-4 h-4" />
                        {video.views} lượt xem
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer">
                        <Play className="w-4 h-4" />
                        Xem video
                      </button>
                      <button className="p-2.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 transition-colors cursor-pointer">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === "documents" && (
          <>
            {MOCK_MEDIA.documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-emerald-50/30 p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl">
                      {getFileIcon(doc.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{doc.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {doc.date}
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-white border border-pink-200">
                            {doc.subject}
                          </span>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors cursor-pointer self-start">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-700 font-medium">{doc.type}</span>
                        <span className="text-gray-500">{formatFileSize(doc.size)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
                          <Eye className="w-4 h-4" />
                          Xem
                        </button>
                        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-sm font-semibold text-white hover:shadow-md transition-all cursor-pointer">
                          <Download className="w-4 h-4" />
                          Tải xuống
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Empty State */}
      {searchQuery && (
        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 flex items-center justify-center">
            <Search className="w-8 h-8 text-pink-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy kết quả</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Không có tài liệu nào phù hợp với "{searchQuery}"
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-1">💡 Lưu ý quan trọng</div>
            <div className="text-sm text-gray-600">Tài liệu sẽ được lưu trữ trong 6 tháng kể từ ngày tải lên</div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            Tải tất cả
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}