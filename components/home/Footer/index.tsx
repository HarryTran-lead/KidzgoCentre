"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ExternalLink,
  Facebook,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import { LOGO } from "@/lib/theme/theme";
import {
  DEFAULT_LOCALE,
  localizePath,
  pickLocaleFromPath,
  type Locale,
} from "@/lib/i18n";
import { EndPoint } from "@/lib/routes";

const PHONE_TEXT = "0867 405 801";
const PHONE_HREF = "tel:0867405801";
const FANPAGE_URL = "https://www.facebook.com/kidzgovn";
const ZALO_URL = "https://zalo.me/0867405801";
const MAP_LAT = 10.8395793;
const MAP_LNG = 106.8421165;
const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}&z=17&output=embed`;

const footerHeadingIcons = {
  about: "/image/footer-icons/about-3d.svg",
  programs: "/image/footer-icons/programs-3d.svg",
  address: "/image/footer-icons/location-3d.svg",
  contact: "/image/footer-icons/contact-3d.svg",
} as const;

const footerCopy = {
  vi: {
    intro:
      "Rex đồng hành cùng trẻ xây nền tảng tiếng Anh vững chắc qua lộ trình rõ ràng, lớp học gần gũi và hoạt động thực hành tự nhiên.",
    aboutTitle: "Về chúng tôi",
    programsTitle: "Chương trình học",
    addressTitle: "Địa chỉ",
    contactTitle: "Liên hệ",
    mapLabel: "Mở Google Maps",
    mapTitle: "Bản đồ Rex English Center",
    displayAddress:
      "Số 23 đường T2, Vinhomes Grand Park, phường Long Bình, TP. HCM",
    mapSearchAddress:
      "T2-23 Manhattan Grand Park, Vinhomes Grand Park, phường Long Bình, TP Thủ Đức, TP. HCM",
    phoneLabel: "Số điện thoại",
    fanpageLabel: "Fanpage",
    zaloLabel: "Zalo",
    rights: "Bảo lưu mọi quyền.",
    aboutLinks: [
      "Thông tin trung tâm",
      "Các khóa học",
      "Tại sao chọn Rex",
      "Tư vấn học thử miễn phí",
      "Đội ngũ giáo viên",
      "Feedback phụ huynh",
    ],
    programLinks: [
      "Khơi dậy sự yêu thích tiếng Anh cho bé",
      "Cambridge Starters, Movers, Flyers",
      "KET, PET, Tiền IELTS",
      "Phonics",
      "Kèm LMS, chương trình tích hợp",
      "Giao tiếp / Thuyết trình",
      "Kỹ năng phát triển bản thân / Ngoại khóa",
    ],
    fanpageValue: "Rex English Center",
  },
  en: {
    intro:
      "Rex helps children build confident English foundations through clear pathways, caring classes, and practical activities.",
    aboutTitle: "About us",
    programsTitle: "Learning programs",
    addressTitle: "Address",
    contactTitle: "Contact",
    mapLabel: "Open Google Maps",
    mapTitle: "Map of Rex English Center",
    displayAddress:
      "23 T2 Street, Vinhomes Grand Park, Long Binh Ward, Ho Chi Minh City",
    mapSearchAddress:
      "T2-23 Manhattan Grand Park, Vinhomes Grand Park, Long Binh Ward, Thu Duc City, Ho Chi Minh City",
    phoneLabel: "Phone",
    fanpageLabel: "Fanpage",
    zaloLabel: "Zalo",
    rights: "All rights reserved.",
    aboutLinks: [
      "Center overview",
      "Courses",
      "Why choose Rex",
      "Free trial consultation",
      "Teaching team",
      "Parent feedback",
    ],
    programLinks: [
      "Inspiring a love of English from the start",
      "Cambridge Starters, Movers, Flyers",
      "KET, PET, Pre-IELTS",
      "Phonics",
      "LMS support and integrated programs",
      "Communication / Presentation",
      "Personal development skills / Extracurriculars",
    ],
    fanpageValue: "Rex English Center",
  },
} as const;

function useFooterLocale() {
  const pathname = usePathname();

  return useMemo(
    () => (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as Locale,
    [pathname],
  );
}

export default function Footer() {
  const locale = useFooterLocale();
  const copy = footerCopy[locale];
  const homePath = localizePath(EndPoint.HOME, locale);
  const contactPath = localizePath(EndPoint.CONTACT, locale);
  const contactHref = `${contactPath}#contact-form-section`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    copy.mapSearchAddress,
  )}`;

  const aboutLinks = [
    { label: copy.aboutLinks[0], href: `${homePath}#about` },
    { label: copy.aboutLinks[1], href: `${homePath}#courses` },
    { label: copy.aboutLinks[2], href: `${homePath}#why-rex` },
    { label: copy.aboutLinks[3], href: contactHref },
    { label: copy.aboutLinks[4], href: `${homePath}#teachers` },
    { label: copy.aboutLinks[5], href: `${homePath}#feedback` },
  ];

  const programLinks = copy.programLinks.map((label) => ({
    label,
    href: `${homePath}#courses`,
  }));

  return (
    <footer
      className="footer-page relative isolate z-40 overflow-hidden text-[#2c2e2a]"
      style={{ backgroundColor: "#fbf8ef" }}
    >
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8 lg:pb-4">
        <div className="mb-6 border-b border-red-900/10 px-1 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={homePath}
              className="group inline-flex w-fit items-center"
            >
              <Image
                src={LOGO}
                alt="Rex logo"
                width={280}
                height={110}
                className="h-20 w-auto transition duration-300 group-hover:scale-[1.03]"
              />
            </Link>
            <div className="max-w-3xl text-left sm:text-right">
              <p className="max-w-2xl text-sm font-medium leading-6 text-[#2c2e2a]/80 sm:ml-auto">
                {copy.intro}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-[1fr_1.22fr_1.18fr_1.1fr] lg:gap-9">
          <FooterColumn
            title={copy.aboutTitle}
            iconSrc={footerHeadingIcons.about}
          >
            {aboutLinks.map((link) => (
              <FooterLink key={link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn
            title={copy.programsTitle}
            iconSrc={footerHeadingIcons.programs}
          >
            {programLinks.map((link) => (
              <FooterLink key={link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <section className="space-y-4">
            <ColumnHeading
              title={copy.addressTitle}
              iconSrc={footerHeadingIcons.address}
            />
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-start gap-2 text-sm font-medium leading-6 text-[#30332f]/85 transition hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300/40"
            >
              <span>{copy.displayAddress}</span>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-red-600 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
            </a>
            <div className="relative overflow-hidden rounded-xl border border-red-900/10 bg-white shadow-xl shadow-slate-900/10">
              <div className="relative h-48 overflow-hidden sm:h-52 lg:h-48">
                <iframe
                  title={copy.mapTitle}
                  src={MAP_EMBED_URL}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block h-full w-full"
                />
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-bold text-[#1a73e8] shadow-md shadow-slate-900/12 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  aria-label={`${copy.mapLabel}: ${copy.mapSearchAddress}`}
                >
                  {copy.mapLabel}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <ColumnHeading
              title={copy.contactTitle}
              iconSrc={footerHeadingIcons.contact}
            />
            <div className="space-y-3.5">
              <ContactRow
                icon={<Phone />}
                label={copy.phoneLabel}
                value={PHONE_TEXT}
                href={PHONE_HREF}
                tone="phone"
              />
              <ContactRow
                icon={<Facebook />}
                label={copy.fanpageLabel}
                value={copy.fanpageValue}
                href={FANPAGE_URL}
                tone="facebook"
              />
              <ContactRow
                icon={<MessageCircle />}
                label={copy.zaloLabel}
                value={PHONE_TEXT}
                href={ZALO_URL}
                tone="zalo"
              />
            </div>
          </section>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 border-t border-red-900/10 pt-4 text-center text-sm font-semibold text-[#2c2e2a]/80 sm:mt-14">
          <span>© Rex. {copy.rights}</span>
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  iconSrc,
  children,
}: {
  title: string;
  iconSrc: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <ColumnHeading title={title} iconSrc={iconSrc} />
      <nav className="grid gap-2.5" aria-label={title}>
        {children}
      </nav>
    </section>
  );
}

function ColumnHeading({ title, iconSrc }: { title: string; iconSrc: string }) {
  return (
    <h2 className="group flex items-center gap-3 text-sm font-black uppercase tracking-normal text-[#111827]">
      <Image
        src={iconSrc}
        alt=""
        width={44}
        height={44}
        aria-hidden="true"
        className="h-10 w-10 shrink-0 object-contain transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105"
      />
      {title}
    </h2>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-8 items-center justify-between gap-3 rounded-md px-1 py-0.5 text-sm font-medium leading-5 text-[#30332f]/85 transition hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300/40"
    >
      <span className="relative pb-1 after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-gradient-to-r after:from-red-600 after:via-red-400 after:to-amber-400 after:transition-transform after:duration-300 group-hover:after:scale-x-100">
        {children}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
    </Link>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  tone: "phone" | "facebook" | "zalo";
}) {
  const external = href.startsWith("http");
  const toneClass = {
    phone: "bg-emerald-500",
    facebook: "bg-[#1877F2]",
    zalo: "bg-[#0068FF]",
  }[tone];

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_14px_32px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full text-white shadow-sm transition duration-300 group-hover:scale-105 ${toneClass} [&>svg]:h-5 [&>svg]:w-5`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="block truncate text-sm font-black text-slate-900 transition duration-300 group-hover:text-red-700">
          {label}
        </span>
        <span className="block truncate text-xs font-medium text-slate-500">
          {value}
        </span>
      </span>
      <ExternalLink
        size={16}
        className="ml-1 shrink-0 text-slate-400 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-red-600"
      />
    </a>
  );
}
