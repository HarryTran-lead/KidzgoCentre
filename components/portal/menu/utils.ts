// components/portal/menu/utils.ts
import type { IconType } from "./types";
import type { FlatItem, GroupItem } from "./types";

export type RawItem = [label: string, icon: IconType, path: string]; // path tương đối với root

/** Biến RAWS -> danh sách FlatItem, tự gắn root */
export function makeMenu(root: string, raws: RawItem[]): FlatItem[] {
  return raws.map(([label, icon, path]) => ({
    label,
    icon,
    href: root + path,
  }));
}

/** Tạo một group từ RAWS */
export function makeGroup(
  root: string,
  title: string,
  icon: IconType | undefined,
  raws: RawItem[],
  defaultOpen = false
): GroupItem {
  return {
    group: title,
    icon,
    defaultOpen,
    items: makeMenu(root, raws),
  };
}
