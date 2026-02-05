"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

type StatusType = 'New' | 'Contacted' | 'BookedTest' | 'TestDone' | 'Enrolled' | 'Lost';

interface StatusOption {
  value: StatusType;
  label: string;
  icon: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'New', label: 'Mới', icon: '/icons/star.png' },
  { value: 'Contacted', label: 'Đang tư vấn', icon: '/icons/comunication.png' },
  { value: 'BookedTest', label: 'Đã đặt lịch test', icon: '/icons/calendar.png' },
  { value: 'TestDone', label: 'Đã test', icon: '/icons/test.png' },
  { value: 'Enrolled', label: 'Đã ghi danh', icon: '/icons/checked.png' },
  { value: 'Lost', label: 'Đã hủy', icon: '/icons/cancell.png' },
];

interface StatusSelectProps {
  value: StatusType;
  onChange: (value: StatusType) => void;
  disabled?: boolean;
  title?: string;
}

export default function StatusSelect({ value, onChange, disabled = false, title = "" }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = STATUS_OPTIONS.find(opt => opt.value === value) || STATUS_OPTIONS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: StatusOption) => {
    if (!disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        disabled={disabled}
        title={title}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-medium focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-pink-50'
        }`}
      >
        <Image
          src={currentOption.icon}
          alt={currentOption.label}
          width={14}
          height={14}
          className="object-contain"
        />
        <span className="text-gray-900">{currentOption.label}</span>
        {!disabled && <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-48 rounded-lg border border-pink-200 bg-white shadow-lg py-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-pink-50 transition-colors ${
                option.value === value ? 'bg-pink-50 text-pink-700 font-medium' : 'text-gray-700'
              }`}
            >
              <Image
                src={option.icon}
                alt={option.label}
                width={16}
                height={16}
                className="object-contain"
              />
              <span>{option.label}</span>
              {option.value === value && (
                <span className="ml-auto text-pink-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
