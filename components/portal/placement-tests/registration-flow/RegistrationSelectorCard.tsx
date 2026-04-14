import { Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

interface RegistrationOption {
  id: string;
  label: string;
}

interface RegistrationSelectorCardProps {
  registrationId: string;
  registrationOptions: RegistrationOption[];
  onValueChange: (value: string) => void;
}

export default function RegistrationSelectorCard({
  registrationId,
  registrationOptions,
  onValueChange,
}: RegistrationSelectorCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-linear-to-r from-gray-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-gray-700">Đăng ký đang thao tác</span>
        </div>
      </div>
      <div className="p-4">
        <Select
          value={registrationId}
          onValueChange={onValueChange}
          searchPlaceholder="Tìm kiếm đăng ký..."
          emptyText="Không tìm thấy đăng ký phù hợp."
        >
          <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200 data-[state=open]:border-red-400 data-[state=open]:ring-2 data-[state=open]:ring-red-200 [&>span]:text-gray-500 [&>span]:line-clamp-1">
            <SelectValue placeholder="Để trống để tạo đăng ký mới từ bài kiểm tra xếp lớp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__create_new__">Tạo đăng ký mới</SelectItem>
            {registrationOptions.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
