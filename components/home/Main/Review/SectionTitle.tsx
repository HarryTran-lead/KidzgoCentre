"use client";

type SectionTitleProps = {
  leading: string;
  accent: string;
  align?: "left" | "center";
};

export default function SectionTitle({
  leading,
  accent,
  align = "center",
}: SectionTitleProps) {
  return (
    <h2
      className={[
        "text-4xl font-black leading-tight tracking-tight text-[#111827] sm:text-5xl lg:text-[3.05rem]",
        align === "left" ? "text-left" : "text-center",
      ].join(" ")}
    >
      {leading}{" "}
      <span className="bg-linear-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
        {accent}
      </span>
    </h2>
  );
}
