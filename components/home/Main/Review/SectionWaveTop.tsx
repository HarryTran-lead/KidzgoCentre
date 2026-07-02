"use client";

type SectionWaveTopProps = {
  fill: string;
  className?: string;
};

export default function SectionWaveTop({
  fill,
  className = "",
}: SectionWaveTopProps) {
  return (
    <div
      className={`pointer-events-none absolute left-0 top-0 z-0 w-full -translate-y-[99%] leading-none ${className}`.trim()}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-[86px] w-full sm:h-[104px] lg:h-[116px]"
        preserveAspectRatio="none"
      >
        <path
          d="M0,70 C180,25 360,110 540,70 C720,30 900,105 1080,70 C1260,35 1350,50 1440,35 L1440,120 L0,120 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
