'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

/** Flat white — soft shadow for contrast on bright photo */
const TEXT_SHADOW =
  '0 1px 2px rgba(0,0,0,0.55), 0 2px 14px rgba(0,0,0,0.45), 0 0 28px rgba(0,0,0,0.25)';

const WHITE_TYPE = {
  color: '#FFFFFF',
  textShadow: TEXT_SHADOW,
};

/** Mint seafoam — Energy. Intelligence. */
const MINT_TYPE = {
  color: '#9AF5D0',
  textShadow: TEXT_SHADOW,
};

const FEATURES = [
  {
    label: 'Smart Irrigation',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.2C12 3.2 6.5 9.2 6.5 13.2a5.5 5.5 0 0011 0C17.5 9.2 12 3.2 12 3.2z" />
      </svg>
    ),
  },
  {
    label: 'Solar Powered',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden>
        <circle cx="12" cy="12" r="3.25" />
        <path strokeLinecap="round" d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.9 5.9l1.4 1.4M16.7 16.7l1.4 1.4M18.1 5.9l-1.4 1.4M7.3 16.7l-1.4 1.4" />
      </svg>
    ),
  },
  {
    label: 'IoT Connected',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden>
        <path strokeLinecap="round" d="M5.2 14.2a8.2 8.2 0 0113.6 0M8.1 16.8a4.4 4.4 0 017.8 0" />
        <circle cx="12" cy="19.4" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Higher Yield',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5V11M12 11c0-4.2 3.1-7.2 7-7.7-.4 4.1-3.1 7.2-7 7.7zm0 0c0-4.2-3.1-7.2-7-7.7.4 4.1 3.1 7.2 7 7.7z" />
      </svg>
    ),
  },
];

/**
 * Kronis scenic hero — mint mockup type (Water. white · Energy. Intelligence. mint).
 */
export default function KronisFarmSection({ dmSansFamily, onExplore }) {
  return (
    <section
      id="kronis-farm"
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-[#0c1610]"
      style={{ fontFamily: dmSansFamily }}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <Image
          src="/kronis-farm-hero.webp"
          alt=""
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover object-[center_28%]"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/30 via-black/10 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[28%] bg-gradient-to-t from-black/25 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-x-3 -inset-y-2 -z-10 rounded-2xl bg-black/25 blur-xl"
              aria-hidden
            />
            <p
              className="flex items-center text-[clamp(1.85rem,4.2vw,2.75rem)] font-semibold tracking-tight text-white"
              style={WHITE_TYPE}
            >
              Kr
              <span className="relative mx-[0.04em] inline-flex h-[0.76em] w-[0.76em] items-center justify-center align-middle">
                <span className="absolute inset-0 rounded-full border-[2.5px] border-white/95" />
                <svg
                  viewBox="0 0 24 24"
                  className="relative z-[1] h-[58%] w-[58%] text-[#7DFFB0]"
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' }}
                  aria-hidden
                >
                  <path
                    fill="currentColor"
                    d="M12 19.5V10.2M12 10.2c0-4.1 3-7.1 6.8-7.5-.45 4-2.9 7-6.8 7.5zm0 0c0-4.1-3-7.1-6.8-7.5.45 4 2.9 7 6.8 7.5z"
                  />
                </svg>
              </span>
              nis
            </p>
            <p
              className="mt-1 text-[11px] font-normal tracking-wide text-white/90 sm:text-xs"
              style={{ textShadow: TEXT_SHADOW }}
            >
              by TerraEco Dynamics Pvt Ltd
            </p>
          </div>
          <p
            className="hidden pt-1.5 text-right text-[11px] font-normal tracking-[0.02em] text-black sm:block sm:text-xs md:text-sm"
            style={{ textShadow: '0 1px 2px rgba(255,255,255,0.35)' }}
          >
            Smart Agriculture | Sustainable Tomorrow
          </p>
        </div>

        {/* Hero copy — mid-left like mockup */}
        <div className="relative mt-[min(18vh,9rem)] flex max-w-full flex-col sm:mt-[min(20vh,10rem)] lg:max-w-4xl">
          <div
            className="pointer-events-none absolute -inset-x-5 -inset-y-4 -z-10 rounded-[2rem] bg-black/30 blur-2xl sm:-inset-x-8"
            aria-hidden
          />
          <h2 className="whitespace-nowrap text-[clamp(1.55rem,5.2vw,4.35rem)] font-medium leading-[1.08] tracking-tight">
            <span className="text-white" style={WHITE_TYPE}>
              Water.{' '}
            </span>
            <span style={MINT_TYPE}>Energy.</span>
            <span style={MINT_TYPE}> Intelligence.</span>
          </h2>

          <p
            className="mt-3 text-base font-normal text-white sm:mt-4 sm:text-lg md:text-xl"
            style={{ textShadow: TEXT_SHADOW }}
          >
            Agriculture, beautifully connected.
          </p>

          <button
            type="button"
            onClick={onExplore}
            className="mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-medium text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 sm:mt-8 sm:px-8 sm:py-3.5 sm:text-base"
            style={{
              background:
                'linear-gradient(90deg, rgba(46,196,168,0.85) 0%, rgba(130,230,170,0.8) 55%, rgba(170,245,190,0.78) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              textShadow: '0 1px 2px rgba(0,0,0,0.35)',
            }}
          >
            Explore Kronis
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </button>
        </div>

        <div className="relative mt-auto pb-5 pt-14 sm:pb-8 sm:pt-16">
          <div
            className="pointer-events-none absolute -inset-x-3 -inset-y-2 -z-10 rounded-2xl bg-black/25 blur-xl"
            aria-hidden
          />
          <ul className="flex flex-wrap gap-x-9 gap-y-5 sm:gap-x-12 md:gap-x-14">
            {FEATURES.map((item) => (
              <li
                key={item.label}
                className="flex min-w-[5.5rem] flex-col items-center text-center sm:min-w-[6.25rem]"
              >
                <span
                  className="text-white"
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55)) drop-shadow(0 2px 10px rgba(0,0,0,0.35))' }}
                >
                  {item.icon}
                </span>
                <span
                  className="mt-2.5 text-[11px] font-normal tracking-wide text-white sm:text-xs md:text-[13px]"
                  style={{ textShadow: TEXT_SHADOW }}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
