"use client";

import { useState } from "react";
import { X, FileText, Award, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/lightswind/button";
import { Input } from "@/components/lightswind/input";
import { Label } from "@/components/lightswind/label";
import { Textarea } from "@/components/lightswind/textarea";
import type { PlacementTestResult } from "@/types/placement-test";

interface ResultFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlacementTestResult) => Promise<void>;
  testId: string;
  initialData?: PlacementTestResult | null;
}

export default function ResultFormModal({
  isOpen,
  onClose,
  onSubmit,
  testId,
  initialData,
}: ResultFormModalProps) {
  const [formData, setFormData] = useState({
    listeningScore: initialData?.listeningScore?.toString() || "",
    speakingScore: initialData?.speakingScore?.toString() || "",
    readingScore: initialData?.readingScore?.toString() || "",
    writingScore: initialData?.writingScore?.toString() || "",
    overallScore: initialData?.overallScore?.toString() || "",
    suggestedLevel: initialData?.suggestedLevel || "",
    strengths: initialData?.strengths || "",
    weaknesses: initialData?.weaknesses || "",
    recommendations: initialData?.recommendations || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: PlacementTestResult = {
        testId,
        listeningScore: formData.listeningScore ? parseFloat(formData.listeningScore) : undefined,
        speakingScore: formData.speakingScore ? parseFloat(formData.speakingScore) : undefined,
        readingScore: formData.readingScore ? parseFloat(formData.readingScore) : undefined,
        writingScore: formData.writingScore ? parseFloat(formData.writingScore) : undefined,
        overallScore: formData.overallScore ? parseFloat(formData.overallScore) : undefined,
        suggestedLevel: formData.suggestedLevel || undefined,
        strengths: formData.strengths || undefined,
        weaknesses: formData.weaknesses || undefined,
        recommendations: formData.recommendations || undefined,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Error submitting result:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-pink-500 to-rose-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award size={24} />
            Nhập kết quả Placement Test
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="listeningScore">Điểm Nghe (Listening)</Label>
              <Input
                id="listeningScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.listeningScore}
                onChange={(e) => setFormData(prev => ({ ...prev, listeningScore: e.target.value }))}
                placeholder="0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speakingScore">Điểm Nói (Speaking)</Label>
              <Input
                id="speakingScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.speakingScore}
                onChange={(e) => setFormData(prev => ({ ...prev, speakingScore: e.target.value }))}
                placeholder="0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="readingScore">Điểm Đọc (Reading)</Label>
              <Input
                id="readingScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.readingScore}
                onChange={(e) => setFormData(prev => ({ ...prev, readingScore: e.target.value }))}
                placeholder="0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="writingScore">Điểm Viết (Writing)</Label>
              <Input
                id="writingScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.writingScore}
                onChange={(e) => setFormData(prev => ({ ...prev, writingScore: e.target.value }))}
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Overall Score */}
          <div className="space-y-2">
            <Label htmlFor="overallScore" className="flex items-center gap-2">
              <Award size={16} />
              Điểm Tổng (Overall)
            </Label>
            <Input
              id="overallScore"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.overallScore}
              onChange={(e) => setFormData(prev => ({ ...prev, overallScore: e.target.value }))}
              placeholder="0.0"
              className="font-semibold text-lg"
            />
          </div>

          {/* Suggested Level */}
          <div className="space-y-2">
            <Label htmlFor="suggestedLevel" className="flex items-center gap-2">
              <FileText size={16} />
              Trình độ đề xuất
            </Label>
            <Input
              id="suggestedLevel"
              value={formData.suggestedLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, suggestedLevel: e.target.value }))}
              placeholder="VD: Beginner, Elementary, Pre-Intermediate, ..."
            />
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <Label htmlFor="strengths" className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              Điểm mạnh
            </Label>
            <Textarea
              id="strengths"
              value={formData.strengths}
              onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
              placeholder="Mô tả điểm mạnh của học viên..."
              rows={3}
            />
          </div>

          {/* Weaknesses */}
          <div className="space-y-2">
            <Label htmlFor="weaknesses" className="flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-600" />
              Điểm yếu
            </Label>
            <Textarea
              id="weaknesses"
              value={formData.weaknesses}
              onChange={(e) => setFormData(prev => ({ ...prev, weaknesses: e.target.value }))}
              placeholder="Mô tả điểm yếu cần cải thiện..."
              rows={3}
            />
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <Label htmlFor="recommendations" className="flex items-center gap-2">
              <FileText size={16} />
              Gợi ý và đề xuất
            </Label>
            <Textarea
              id="recommendations"
              value={formData.recommendations}
              onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
              placeholder="Đề xuất lộ trình học, khóa học phù hợp..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu kết quả"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
