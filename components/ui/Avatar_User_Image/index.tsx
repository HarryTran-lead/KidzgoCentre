import React, { useMemo, useState } from "react";

export const avatarColors = [
  "bg-slate-500",
  "bg-gray-500",
  "bg-zinc-500",
  "bg-neutral-500",
  "bg-stone-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

export const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
};

export const getInitials = (name?: string): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0]?.toUpperCase() || "";
  const last =
    parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() : "";
  return first + last || (name[0]?.toUpperCase() ?? "");
};

type Status = "online" | "busy" | "offline" | "none";
const statusColor: Record<Exclude<Status, "none">, string> = {
  online: "bg-emerald-500",
  busy: "bg-amber-500",
  offline: "bg-gray-400",
};

interface AvatarUserImageProps {
  name?: string;
  avatarUrl?: string;
  size?: number | string; // px number hoặc class "w-8 h-8"
  className?: string;
  ringClassName?: string; // ví dụ: "ring-2 ring-white"
  status?: Status;
}

const AvatarUserImage: React.FC<AvatarUserImageProps> = ({
  name = "User",
  avatarUrl,
  size = 36,
  className = "",
  ringClassName = "",
  status = "none",
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const { isNumberSize, pixelSize, fontSize } = useMemo(() => {
    const isNumberSize = typeof size === "number";
    const pixelSize = isNumberSize ? `${size}px` : undefined;
    const fontSize = isNumberSize
      ? `${Math.max(10, Math.round(Number(size) / 2.2))}px`
      : undefined;
    return { isNumberSize, pixelSize, fontSize };
  }, [size]);

  const bgColor = useMemo(() => getColorFromName(name), [name]);
  const initials = useMemo(() => getInitials(name), [name]);
  const showImage = !!avatarUrl && !imgFailed;

  return (
    <div
      className={[
        "relative rounded-full text-white flex items-center justify-center font-semibold overflow-hidden",
        bgColor,
        typeof size === "string" ? size : "",
        ringClassName,
        className,
      ].join(" ")}
      style={
        isNumberSize
          ? { width: pixelSize, height: pixelSize, fontSize }
          : undefined
      }
      aria-label={name}
      title={name}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgFailed(true)}
          draggable={false}
        />
      ) : (
        <span className="z-10 select-none">{initials}</span>
      )}

      {status !== "none" && (
        <span
          className={[
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white",
            statusColor[status as Exclude<Status, "none">],
          ].join(" ")}
          aria-hidden
        />
      )}
    </div>
  );
};

export default AvatarUserImage;
