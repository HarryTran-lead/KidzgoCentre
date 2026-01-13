'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Headphones,
  Video,
  Library,
  GraduationCap,
  BookPlus,
  Folder,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import Image from 'next/image';
import { FilterTabs, TabOption } from '@/components/portal/student/FilterTabs';

// Types
type Unit = {
  id: string;
  name: string;
  lessons: Lesson[];
};

type Lesson = {
  id: string;
  name: string;
  duration?: string;
  type: 'audio' | 'video';
};

// Mock data cho Units
const UNITS_DATA: Unit[] = [
  {
    id: 'unit-0',
    name: 'Unit 0',
    lessons: [
      { id: 'u0-l1', name: 'Lesson 1 - Introduction', duration: '3:45', type: 'audio' },
      { id: 'u0-l2', name: 'Lesson 2 - Alphabet', duration: '4:20', type: 'audio' },
    ],
  },
  {
    id: 'unit-1',
    name: 'Unit 1',
    lessons: [
      { id: 'u1-l1', name: 'Lesson 1 - Hello', duration: '5:10', type: 'audio' },
      { id: 'u1-l2', name: 'Lesson 2 - Greeting', duration: '4:55', type: 'audio' },
      { id: 'u1-l3', name: 'Lesson 3 - Practice', duration: '6:30', type: 'audio' },
    ],
  },
  {
    id: 'unit-2',
    name: 'Unit 2',
    lessons: [
      { id: 'u2-l1', name: 'Lesson 1 - Family', duration: '5:45', type: 'audio' },
      { id: 'u2-l2', name: 'Lesson 2 - Members', duration: '4:30', type: 'audio' },
    ],
  },
  {
    id: 'unit-3',
    name: 'Unit 3',
    lessons: [
      { id: 'u3-l1', name: 'Lesson 1 - School', duration: '6:00', type: 'audio' },
    ],
  },
  {
    id: 'unit-4',
    name: 'Unit 4',
    lessons: [
      { id: 'u4-l1', name: 'Lesson 1 - Food', duration: '5:20', type: 'audio' },
    ],
  },
  {
    id: 'unit-5',
    name: 'Unit 5',
    lessons: [
      { id: 'u5-l1', name: 'Lesson 1 - Colors', duration: '4:15', type: 'audio' },
    ],
  },
  {
    id: 'unit-6',
    name: 'Unit 6',
    lessons: [
      { id: 'u6-l1', name: 'Lesson 1 - Numbers', duration: '5:00', type: 'audio' },
    ],
  },
];

// Tab options
const mainTabOptions: TabOption[] = [
  { id: 'audio', label: 'File nghe', icon: <Headphones className="w-4 h-4" /> },
  { id: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { id: 'library', label: 'Thư viện', icon: <Library className="w-4 h-4" /> },
  { id: 'elearning', label: 'E-Learning', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'extra', label: 'Tài liệu bổ sung', icon: <BookPlus className="w-4 h-4" /> },
];

// Sidebar Unit Item
function UnitItem({
  unit,
  isExpanded,
  onToggle,
  selectedLesson,
  onSelectLesson,
}: {
  unit: Unit;
  isExpanded: boolean;
  onToggle: () => void;
  selectedLesson: string | null;
  onSelectLesson: (lessonId: string) => void;
}) {
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden mb-2">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${
          isExpanded ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-800">{unit.name}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {isExpanded && (
        <div className="bg-white border-t border-blue-100">
          {unit.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all ${
                selectedLesson === lesson.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-slate-50 text-gray-600'
              }`}
            >
              <Play className="w-3 h-3" />
              <span className="flex-1 truncate">{lesson.name}</span>
              {lesson.duration && (
                <span className="text-xs text-gray-400">{lesson.duration}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState('audio');
  const [subTab, setSubTab] = useState<'textbook' | 'workbook'>('textbook');
  const [expandedUnit, setExpandedUnit] = useState<string | null>('unit-0');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  const handleToggleUnit = (unitId: string) => {
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
  };

  const selectedLessonData = useMemo(() => {
    for (const unit of UNITS_DATA) {
      const lesson = unit.lessons.find((l) => l.id === selectedLesson);
      if (lesson) return { lesson, unit };
    }
    return null;
  }, [selectedLesson]);

  return (
    <div className="space-y-4">
      {/* Main Tabs */}
      <FilterTabs
        tabs={mainTabOptions}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="outline"
        size="md"
        className="justify-center"
      />

      {/* Content based on active tab */}
      {activeTab === 'audio' && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar - Units */}
          <div className="w-full lg:w-72 shrink-0">
            {/* Sub Tabs */}
            <div className="flex mb-4 border-b border-slate-200">
              <button
                onClick={() => setSubTab('textbook')}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  subTab === 'textbook'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sách giáo khoa
              </button>
              <button
                onClick={() => setSubTab('workbook')}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-all ${
                  subTab === 'workbook'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sách bài tập
              </button>
            </div>

            {/* Units List */}
            <div className="max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
              {UNITS_DATA.map((unit) => (
                <UnitItem
                  key={unit.id}
                  unit={unit}
                  isExpanded={expandedUnit === unit.id}
                  onToggle={() => handleToggleUnit(unit.id)}
                  selectedLesson={selectedLesson}
                  onSelectLesson={setSelectedLesson}
                />
              ))}
            </div>
          </div>

          {/* Main Content - Player Area */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white min-h-[400px] flex flex-col items-center justify-center p-6">
            {selectedLessonData ? (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {selectedLessonData.lesson.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedLessonData.unit.name}
                </p>
                
                {/* Simple Audio Player UI */}
                <div className="w-full max-w-md mx-auto">
                  <div className="h-2 bg-slate-200 rounded-full mb-3">
                    <div className="h-2 bg-blue-500 rounded-full w-1/3"></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>1:15</span>
                    <span>{selectedLessonData.lesson.duration}</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all">
                      <Play className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  <Image
                    src="/sticker/Anhrobot.png"
                    alt="Mascot"
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-500">Chọn bài để nghe</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'video' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 min-h-[400px] flex flex-col items-center justify-center">
          <Video className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Video bài giảng</h3>
          <p className="text-gray-400">Danh sách video sẽ được cập nhật</p>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 min-h-[400px] flex flex-col items-center justify-center">
          <Library className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Thư viện</h3>
          <p className="text-gray-400">Tài liệu thư viện sẽ được cập nhật</p>
        </div>
      )}

      {activeTab === 'elearning' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 min-h-[400px] flex flex-col items-center justify-center">
          <GraduationCap className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">E-Learning</h3>
          <p className="text-gray-400">Khóa học online sẽ được cập nhật</p>
        </div>
      )}

      {activeTab === 'extra' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 min-h-[400px] flex flex-col items-center justify-center">
          <BookPlus className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Tài liệu bổ sung</h3>
          <p className="text-gray-400">Tài liệu bổ sung sẽ được cập nhật</p>
        </div>
      )}
    </div>
  );
}
