// components/portal/menu/types.ts
import type { ComponentType } from "react";

export type IconType = ComponentType<any>;

/** Mục phẳng (một đường link) */
export type FlatItem = {
  label: string;
  icon: IconType;
  href: string; // path tuyệt đối (đã prefix root)
  badge?: number; // badge hiển thị số thông báo
};

/** Nhóm mục (collapsible) */
export type GroupItem = {
  group: string;
  icon?: IconType;
  defaultOpen?: boolean;
  items: FlatItem[];
};

/** Kiểu chung cho Sidebar: có thể là phẳng hoặc nhóm */
export type MenuItem = FlatItem | GroupItem;
