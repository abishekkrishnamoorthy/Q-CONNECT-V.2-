/**
 * Reusable brand panel for auth pages.
 * @param {{tagline:string,eyebrow:string,subtext:string,children?:import("react").ReactNode}} props
 * @returns {JSX.Element}
 */
export default function AuthLeftPanel({ tagline, eyebrow, subtext, children }) {
  return (
    <div className="relative h-[120px] w-full bg-[#1c1612] px-6 pb-5 pt-5 md:w-[65%] md:min-h-screen md:overflow-hidden md:p-12">
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />
        <div className="absolute -left-44 -top-44 h-[560px] w-[560px] rounded-full border border-amber/20" />
        <div className="absolute left-2 top-0 h-[360px] w-[360px] rounded-full border border-amber/15" />
        <div className="absolute -bottom-56 -right-56 h-[620px] w-[620px] rounded-full border-[96px] border-amber/[0.08]" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-start md:pt-[150px] md:pb-[56px]">
        <div className="absolute left-0 top-0 flex items-center gap-2.5 md:left-12 md:top-11">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber">
            <QconnectLogoMark />
          </div>
          <span className="font-display text-[22px] font-bold tracking-tight text-white">
            Q<span className="text-amber">connect</span>
          </span>
        </div>

        <div className="relative z-10 mt-auto hidden md:block">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[2.5px] text-amber">{eyebrow}</p>
          <h1
            className="mb-5 max-w-[520px] font-display text-[56px] leading-[1.08] text-white [&_em]:italic [&_em]:text-amber"
            dangerouslySetInnerHTML={{ __html: tagline }}
          />
          <p className="mb-9 max-w-[500px] text-[17px] leading-[1.65] text-white/50">{subtext}</p>
          {children}
        </div>

        <p className="mt-auto text-[10px] font-medium uppercase tracking-[2px] text-amber md:hidden">{eyebrow}</p>
      </div>
    </div>
  );
}

function QconnectLogoMark() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" fill="#fff" />
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M5.5 5.5l1.4 1.4M13.1 13.1l1.4 1.4M5.5 14.5l1.4-1.4M13.1 6.9l1.4-1.4"
        stroke="#fff"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
