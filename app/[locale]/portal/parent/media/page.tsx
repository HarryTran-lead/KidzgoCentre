"use client";

import { useState } from "react";
import { Image as ImageIcon, Video, FileText, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/lightswind/card";
import { Button } from "@/components/lightswind/button";
import { Badge } from "@/components/lightswind/badge";

type TabType = "photos" | "videos" | "documents";

const MOCK_MEDIA = {
  photos: [
    {
      id: "1",
      title: "Hoạt động ngoại khóa - Tháng 12",
      date: "20/12/2024",
      count: 15,
      thumbnail: "/image/placeholder.jpg",
    },
    {
      id: "2",
      title: "Lớp học Speaking",
      date: "15/12/2024",
      count: 8,
      thumbnail: "/image/placeholder.jpg",
    },
  ],
  videos: [
    {
      id: "1",
      title: "Bài thuyết trình của con",
      date: "18/12/2024",
      duration: "5:32",
      thumbnail: "/image/placeholder.jpg",
    },
  ],
  documents: [
    {
      id: "1",
      title: "Giáo trình Level 3",
      date: "01/12/2024",
      size: "2.5 MB",
      type: "PDF",
    },
    {
      id: "2",
      title: "Bảng từ vựng Unit 5",
      date: "10/12/2024",
      size: "1.2 MB",
      type: "PDF",
    },
  ],
};

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<TabType>("photos");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kho tài liệu</h1>
        <p className="text-slate-600">Album ảnh, video và tài liệu học tập của con.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "photos" ? "default" : "outline"}
          onClick={() => setActiveTab("photos")}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Ảnh ({MOCK_MEDIA.photos.length})
        </Button>
        <Button
          variant={activeTab === "videos" ? "default" : "outline"}
          onClick={() => setActiveTab("videos")}
        >
          <Video className="w-4 h-4 mr-2" />
          Video ({MOCK_MEDIA.videos.length})
        </Button>
        <Button
          variant={activeTab === "documents" ? "default" : "outline"}
          onClick={() => setActiveTab("documents")}
        >
          <FileText className="w-4 h-4 mr-2" />
          Tài liệu ({MOCK_MEDIA.documents.length})
        </Button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "photos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_MEDIA.photos.map((album) => (
              <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-slate-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-slate-400" />
                  </div>
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0">
                    {album.count} ảnh
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1">{album.title}</h3>
                  <p className="text-sm text-slate-500 mb-3">{album.date}</p>
                  <Button variant="outline" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Xem album
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "videos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_MEDIA.videos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-slate-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-16 h-16 text-slate-400" />
                  </div>
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-0">
                    {video.duration}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1">{video.title}</h3>
                  <p className="text-sm text-slate-500 mb-3">{video.date}</p>
                  <Button variant="outline" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Xem video
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-3">
            {MOCK_MEDIA.documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                      <p className="text-sm text-slate-500">
                        {doc.date} • {doc.size} • {doc.type}
                      </p>
                    </div>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Tải xuống
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
