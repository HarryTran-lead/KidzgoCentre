"use client";

import { useState, useEffect } from "react";
import { X, Link as LinkIcon, Loader2, Users, Search } from "lucide-react";
import type { LinkProfileRequest } from "@/types/profile";
import { getAllStudents } from "@/lib/api/profileService";

interface LinkStudentToParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LinkProfileRequest) => Promise<void>;
  parentProfileId?: string;
  parentName?: string;
}

interface StudentItem {
  id: string;
  displayName: string;
  userId: string;
  userEmail: string;
  isActive: boolean;
}

export default function LinkStudentToParentModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  parentProfileId,
  parentName
}: LinkStudentToParentModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [manualParentId, setManualParentId] = useState(parentProfileId || '');

  // Load all students when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await getAllStudents({
          profileType: 'Student',
          isActive: true,
          pageSize: 100,
        });
        
        if (response.data?.items) {
          setStudents(response.data.items as StudentItem[]);
          setFilteredStudents(response.data.items as StudentItem[]);
        }
      } catch (error) {
        console.error('Failed to load students:', error);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
    setSelectedStudentId('');
    setSearchTerm('');
    setManualParentId(parentProfileId || '');
  }, [isOpen, parentProfileId]);

  // Filter students based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => 
      student.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualParentId || !selectedStudentId) {
      alert('Vui lòng chọn đầy đủ Parent và Student');
      return;
    }
    
    setLoading(true);
    try {
      const linkData: LinkProfileRequest = {
        parentProfileId: manualParentId,
        studentProfileId: selectedStudentId,
      };

      await onSubmit(linkData);
      onClose();
    } catch (error) {
      console.error('Link submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LinkIcon size={24} />
            Link Student với Parent
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <p className="text-sm text-green-800">
              <strong>Chức năng:</strong> Link một Student profile với Parent profile để học sinh 
              có thể truy cập hệ thống thông qua tài khoản Parent.
            </p>
          </div>

          {/* Parent Profile ID */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users size={16} />
              Parent Profile ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={manualParentId}
              onChange={(e) => setManualParentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Enter Parent Profile ID"
              disabled={!!parentProfileId}
            />
            {parentName && (
              <p className="text-xs text-gray-600 mt-1">
                Parent: <strong>{parentName}</strong>
              </p>
            )}
          </div>

          {/* Student Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users size={16} />
              Chọn Student <span className="text-red-500">*</span>
            </label>

            {/* Search Box */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="Tìm kiếm học sinh..."
              />
            </div>

            {/* Students List */}
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={32} className="animate-spin text-green-500" />
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Không tìm thấy học sinh nào
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <label
                      key={student.id}
                      className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                        selectedStudentId === student.id ? 'bg-green-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="student"
                        value={student.id}
                        checked={selectedStudentId === student.id}
                        onChange={() => setSelectedStudentId(student.id)}
                        className="mr-3 w-4 h-4 text-green-500 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{student.displayName}</p>
                        <p className="text-xs text-gray-500">ID: {student.id}</p>
                      </div>
                      {!student.isActive && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                          Inactive
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Info */}
          {selectedStudentId && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                ✓ Đã chọn Student: <strong>{filteredStudents.find(s => s.id === selectedStudentId)?.displayName}</strong>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !selectedStudentId || !manualParentId}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Đang link...' : 'Link Profiles'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
