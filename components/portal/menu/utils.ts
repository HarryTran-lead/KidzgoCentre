// components/portal/menu/utils.ts
import type { IconType } from "./types";
import type { FlatItem, GroupItem, MenuItem } from "./types";

export type RawItem = [label: string, icon: IconType, path: string]; // path tương đối với root

export type MixedRawItem = RawItem | { group: string; icon?: IconType; defaultOpen?: boolean; items: RawItem[] };

/** Biến RAWS -> danh sách MenuItem, tự gắn root */
export function makeMenu(root: string, raws: MixedRawItem[]): MenuItem[] {
  return raws.map((raw) => {
    if (Array.isArray(raw)) {
      const [label, icon, path] = raw;
      return { label, icon, href: root + path } satisfies FlatItem;
    }
    // Group object
    return {
      group: raw.group,
      icon: raw.icon,
      defaultOpen: raw.defaultOpen,
      items: raw.items.map(([label, icon, path]) => ({
        label,
        icon,
        href: root + path,
      })),
    } satisfies GroupItem;
  });
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
    items: makeMenu(root, raws) as FlatItem[],
  };
}
