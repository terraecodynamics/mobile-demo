'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { ArrowRight, Play, Plus } from 'lucide-react';

/** Orange–red palette (aligned with TerraEco branding) */
const ACCENT_ORANGE = '#f97316';
const ACCENT_RED = '#ef4444';

const HERO_TITLE_METAL = {
  background: 'linear-gradient(180deg, #f5f5f5 0%, #6b6b6b 45%, #1f1f1f 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

const HOTSPOTS = [
  { id: 'panel', label: 'Foldable solar array', top: '28%', left: '58%' },
  { id: 'iot', label: 'IoT control unit', top: '62%', left: '78%' },
  { id: 'pump', label: 'High-efficiency pump', top: '38%', left: '28%' },
  { id: 'base', label: 'Stable mounting base', top: '78%', left: '22%' },
];

function HotspotButton({ active, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black/80 shadow-[0_0_20px_rgba(249,115,22,0.45)] transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:h-8 sm:w-8"
      style={{
        background: `linear-gradient(145deg, ${ACCENT_ORANGE} 0%, ${ACCENT_RED} 100%)`,
      }}
      aria-expanded={active}
      aria-label={label}
    >
      <Plus
        className={`h-3.5 w-3.5 text-white transition-transform sm:h-4 sm:w-4 ${active ? 'rotate-45' : ''}`}
      />
    </button>
  );
}

export default function TerraecoHero({ dmSansFamily, onBookDemo, scrollToSection }) {
  const [activeHotspot, setActiveHotspot] = useState(null);

  const toggleHotspot = useCallback((id) => {
    setActiveHotspot((prev) => (prev === id ? null : id));
  }, []);

  return (
    <section
      id="product"
      className="relative box-border min-h-0 overflow-x-clip overflow-y-visible px-0 py-10 sm:py-12 md:h-[100vh] md:max-h-[100vh] md:overflow-hidden md:py-0 md:pt-24"
      style={{ fontFamily: dmSansFamily, backgroundColor: '#0a1410' }}
    >
      {/* Fill padding-top so page bg never peeks through */}
      <div
        className="pointer-events-none absolute -top-20 left-0 right-0 bottom-0 z-0 overflow-hidden sm:-top-24 md:-top-28"
        aria-hidden
      >
        {/* Deep forest base — cooler agri-tech, orange accents still pop */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(165deg, #12201a 0%, #0e1a15 35%, #0b1511 65%, #09120e 100%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              180deg,
              rgba(34, 120, 90, 0.22) 0%,
              rgba(20, 70, 55, 0.14) 45%,
              rgba(12, 40, 32, 0.18) 100%
            )`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              125deg,
              rgba(249, 115, 22, 0.12) 0%,
              rgba(45, 140, 110, 0.10) 40%,
              rgba(20, 90, 75, 0.12) 70%,
              rgba(15, 50, 42, 0.16) 100%
            )`,
          }}
        />
        <div
          className="absolute -left-[18%] top-[12%] h-[min(95vw,560px)] w-[min(95vw,560px)] rounded-full blur-[118px]"
          style={{
            background: `linear-gradient(145deg, rgba(52, 180, 140, 0.9) 0%, rgba(34, 140, 110, 0.55) 40%, rgba(249, 115, 22, 0.45) 100%)`,
            opacity: 0.28,
          }}
        />
        <div
          className="absolute -right-[12%] top-[38%] h-[min(85vw,500px)] w-[min(85vw,500px)] rounded-full blur-[112px]"
          style={{
            background: `linear-gradient(315deg, rgba(249, 115, 22, 0.55) 0%, rgba(220, 100, 40, 0.35) 45%, rgba(40, 130, 100, 0.5) 100%)`,
            opacity: 0.22,
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[48vh] w-[150%] max-w-none -translate-x-1/2"
          style={{
            background: `radial-gradient(ellipse 85% 100% at 50% 100%, rgba(34, 140, 110, 0.28) 0%, rgba(249, 115, 22, 0.10) 45%, transparent 75%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.22] [mask-image:radial-gradient(ellipse_85%_75%_at_50%_42%,#000_20%,transparent_78%)]"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
            backgroundSize: '56px 56px',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px opacity-70"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(52, 180, 140, 0.35), rgba(249, 115, 22, 0.28), transparent)`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-4 pb-6 pt-2 sm:px-5 sm:pb-10 sm:pt-5 md:px-6 md:pb-12 lg:px-8">
        {/* Line 1 left, line 2 right — stacked on mobile so words never split */}
        <h1
          className="pointer-events-none relative z-[2] mb-4 flex w-full min-w-0 flex-col items-stretch gap-0 font-black uppercase tracking-[-0.03em] md:absolute md:inset-x-0 md:top-0 md:mb-0 md:px-2 md:tracking-[-0.035em]"
          style={{ filter: 'drop-shadow(0 1px 12px rgba(0,0,0,0.25))' }}
        >
          <span
            className="block max-w-full text-left text-[clamp(1.85rem,10vw,2.85rem)] leading-[0.95] sm:text-[clamp(1.85rem,min(8vw_10vmin),6.9rem)] md:mt-4 md:whitespace-nowrap md:text-[clamp(2.15rem,7.4vw,7.25rem)] lg:text-[clamp(2.45rem,6.6vw,7.75rem)] xl:text-[clamp(2.5rem,6.2vw,7.75rem)]"
            style={{
              background: 'radial-gradient(circle closest-corner at 50% 50%, #ffffff, #fff6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            Precision
            <br className="md:hidden" />
            <span className="hidden md:inline"> </span>
            Agriculture
          </span>
          <span
            className="mt-1 block w-full max-w-full text-right text-[clamp(1.85rem,10vw,2.85rem)] leading-[0.95] sm:text-[clamp(2.1rem,min(8.8vw_11vmin),7.35rem)] md:-mt-2 md:whitespace-nowrap md:text-[clamp(2.45rem,8vw,7.85rem)] lg:text-[clamp(2.75rem,7.2vw,8.5rem)] xl:text-[clamp(2.85rem,6.8vw,8.5rem)]"
            style={{
              background: 'radial-gradient(circle closest-corner at 50% 50%, #ffffff, #fff6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            Solutions
          </span>
        </h1>

        <div className="relative z-[5] flex min-h-0 flex-1 flex-col gap-5 overflow-visible pt-1 sm:gap-8 md:gap-9 md:overflow-y-auto md:pt-[clamp(5.75rem,16vw,10rem)] lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:overflow-y-visible lg:pt-4 lg:pb-10 xl:gap-8 2xl:gap-10">
        {/* Product + hotspots — title sits above in page box; pump draws over title via z-10 */}
        <div className="relative flex min-w-0 flex-1 items-start justify-center self-start">
          <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-[28rem] md:max-w-xl lg:max-w-2xl xl:max-w-[42rem] 2xl:max-w-[46rem]">
            <Image
              src="/4i-pro-new.png"
              alt="Kronis Micro 4i Pro solar irrigation kit"
              width={980}
              height={980}
              priority
              className="relative z-10 mx-auto h-auto w-full object-contain"
            />
            {HOTSPOTS.map((h) => (
              <div
                key={h.id}
                className="absolute z-20"
                style={{ top: h.top, left: h.left }}
              >
                <HotspotButton
                  active={activeHotspot === h.id}
                  onToggle={() => toggleHotspot(h.id)}
                  label={h.label}
                />
                {activeHotspot === h.id && (
                  <div className="absolute left-1/2 top-full z-30 mt-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-left text-xs text-white shadow-xl backdrop-blur-md">
                    <span
                      className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text font-semibold text-transparent"
                    >
                      {h.label}
                    </span>
                    <div
                      className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-white/10 bg-black/90"
                      aria-hidden
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column: flush right, lower so it clears the headline */}
        <div className="mx-auto mt-2 flex w-full max-w-lg flex-col gap-4 self-stretch sm:mt-8 sm:max-w-xl sm:gap-5 md:mt-10 lg:ml-auto lg:mt-14 lg:w-[min(100%,23rem)] lg:max-w-none lg:shrink-0 lg:self-end lg:pb-5 xl:mt-16 xl:w-96">
          <div className="flex flex-row items-center gap-3 sm:items-start sm:gap-4">
            <button
              type="button"
              onClick={() => scrollToSection('platform')}
              className="group relative w-[7.5rem] shrink-0 overflow-hidden rounded-xl border border-emerald-500/20 bg-[#0e1a15]/90 text-left shadow-lg backdrop-blur-sm transition hover:border-orange-500/40 sm:w-full sm:max-w-[11rem]"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/solar-pump-with-web.png"
                  alt=""
                  fill
                  className="object-cover opacity-95 transition group-hover:opacity-100"
                  sizes="(max-width: 640px) 168px, 176px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1410]/80 via-[#0a1410]/25 to-transparent" />
                <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-orange-950/40 bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_16px_rgba(249,115,22,0.45)] transition group-hover:scale-105">
                  <Play className="ml-0.5 h-[18px] w-[18px] fill-white text-white" />
                </span>
              </div>
              <span className="sr-only">Watch platform overview</span>
            </button>

            <p className="min-w-0 flex-1 text-left text-[12px] leading-snug text-white/85 sm:text-[13px] md:text-sm">
              <span className="font-semibold text-white">Experience</span> reliable solar irrigation,
              real-time telemetry, and smooth remote control.{' '}
              <span className="text-white/55">Solutions tailored for modern farms.</span>
            </p>
          </div>

          {/* <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-start xl:flex-row xl:items-center">
            <button
              type="button"
              onClick={onBookDemo}
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 px-7 py-3 text-base font-bold text-white shadow-lg shadow-orange-900/30 transition hover:brightness-110 active:scale-[0.98] sm:w-auto lg:self-start"
            >
              Book a demo
              <FiArrowRight className="ml-2 h-5 w-5" />
            </button>
            <Link
              href="/auth/user-login"
              className="text-center text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline sm:text-left lg:text-left"
            >
              Sign in to dashboard
            </Link>
          </div> */}

          <div className="flex flex-nowrap items-center gap-2 border-t border-white/10 pt-4 sm:gap-3 sm:pt-6">
            <div className="flex shrink-0 -space-x-2">
              {['from-orange-400 to-red-500', 'from-amber-500 to-orange-700', 'from-rose-400 to-red-600', 'from-orange-600 to-red-700'].map(
                (g, i) => (
                  <div
                    key={i}
                    className={`h-7 w-7 rounded-full border-2 border-[#0a1410] bg-gradient-to-br sm:h-8 sm:w-8 md:h-9 md:w-9 ${g}`}
                    aria-hidden
                  />
                )
              )}
            </div>
            <p className="min-w-0 flex-1 text-[11px] leading-snug sm:text-xs md:text-[13px]">
              <span className="font-semibold text-orange-400" aria-hidden>
                ★{' '}
              </span>
              <span className="font-semibold text-white">Trusted deployments</span>
              <span className="text-white/40"> · </span>
              <span className="text-white/55">Loved by growers and partners worldwide</span>
            </p>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
