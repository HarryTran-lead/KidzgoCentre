'use client';

import { ReactNode } from 'react';

// Types
export interface TabOption {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface FilterTabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'outline' | 'pill' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * FilterTabs - Component filter tabs dùng chung cho các screen student portal
 * Hỗ trợ 3 variants: outline (schedule style), pill (homework style), solid
 */
export function FilterTabs({ 
  tabs, 
  activeTab, 
  onChange,
  variant = 'outline',
  size = 'md',
  className = ''
}: FilterTabsProps) {
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-5 py-2 text-xs',
    lg: 'px-6 py-2.5 text-sm'
  };

  // Variant styles
  const getVariantClasses = (isActive: boolean) => {
    switch (variant) {
      case 'outline':
        // Schedule style - rounded-xl with border
        return isActive
          ? 'bg-white border-white text-indigo-900 shadow-lg'
          : 'bg-indigo-950/40 border-white/10 text-white hover:border-white/30 backdrop-blur-md';
      
      case 'pill':
        // Homework style - rounded-full with shadow
        return isActive
          ? 'bg-slate-900 text-white shadow-md border-transparent'
          : 'bg-white text-slate-950 hover:bg-slate-50 border-transparent shadow-md';
      
      case 'solid':
        // Gamification style - gradient background
        return isActive
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg border-transparent'
          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-transparent';
      
      default:
        return '';
    }
  };

  const getBaseClasses = () => {
    switch (variant) {
      case 'outline':
        return 'rounded-xl border-2 font-black tracking-widest transition-all';
      case 'pill':
        return 'rounded-full border font-bold transition-all';
      case 'solid':
        return 'rounded-xl border font-bold transition-all flex items-center justify-center gap-2';
      default:
        return '';
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            ${sizeClasses[size]}
            ${getBaseClasses()}
            ${getVariantClasses(activeTab === tab.id)}
          `}
        >
          {tab.icon && <span className="inline-flex">{tab.icon}</span>}
          <span>
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </span>
        </button>
      ))}
    </div>
  );
}

// Export default for convenience
export default FilterTabs;
