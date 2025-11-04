// app/head.tsx
export default function Head() {
  // preload tấm hero đầu tiên để vào là chạy animation mượt
  const firstHero =
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&h=1080&fit=crop";

  return (
    <>
      {/* giảm độ trễ bắt tay TLS tới Unsplash */}
      <link
        rel="preconnect"
        href="https://images.unsplash.com"
        crossOrigin=""
      />
      <link rel="dns-prefetch" href="https://images.unsplash.com" />

      {/* Preload ảnh LCP */}
      <link rel="preload" as="image" href={firstHero} fetchPriority="high" />

      {/* viewport chuẩn cho mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </>
  );
}
