// app/[locale]/page.tsx
export { default } from "../page";

// (khuyến nghị) build sẵn 2 locale để tránh 404 khi SSG
export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "vi" }];
}
