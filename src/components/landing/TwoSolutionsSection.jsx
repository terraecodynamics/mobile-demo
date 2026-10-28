'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const GLOW = {
  textShadow:
    '0 0 10px rgba(255,255,255,0.45), 0 0 28px rgba(200,220,255,0.22)',
};

const LEFT_LINKS = [
  { id: 'irrigate', label: 'Irrigate' },
  { id: 'rental', label: 'Rental' },
  { id: 'settings', label: 'Settings' },
];

const RIGHT_LINKS = [
  { id: 'soil', label: 'Soil' },
  { id: 'weather', label: 'Weather' },
  { id: 'environment', label: 'Environment' },
];

const SENSOR_STATS = [
  {
    label: 'Temperature',
    value: '28.4°C',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path strokeLinecap="round" d="M10 14.5V6.2a2.2 2.2 0 114.4 0v8.3a3.2 3.2 0 11-4.4 0z" />
        <path strokeLinecap="round" d="M12 17.2v1.3" />
      </svg>
    ),
  },
  {
    label: 'Humidity',
    value: '65.2%',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5S7 10.2 7 13.6a5 5 0 0010 0C17 10.2 12 4.5 12 4.5z" />
      </svg>
    ),
  },
  {
    label: 'Soil Moisture',
    value: '32.5%',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V11M12 11c0-4 2.8-7 6.5-7.5C18 8.2 15.4 11 12 11zm0 0c0-4-2.8-7-6.5-7.5C6 8.2 8.6 11 12 11z" />
      </svg>
    ),
  },
];

/**
 * Section 02 — Two Solutions. One Ecosystem.
 */
export default function TwoSolutionsSection({ dmSansFamily, scrollToSection }) {
  const [activeLeft, setActiveLeft] = useState('irrigate');

  return (
    <section
      id="solutions"
      className="relative isolate w-full overflow-hidden bg-[#07080a]"
      style={{ fontFamily: dmSansFamily }}
    >
      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] grid-cols-1 lg:min-h-[100svh] lg:grid-cols-[minmax(240px,0.9fr)_1.15fr_1.15fr]">
        {/* Left copy */}
        <div className="relative z-10 flex flex-col justify-between border-b border-white/10 px-6 py-12 sm:px-8 lg:border-b-0 lg:border-r lg:border-white/10 lg:px-10 lg:py-14 xl:px-12">
          <div>
            <div className="mb-6 flex flex-col gap-2">
              <span className="h-px w-8 bg-white/50" aria-hidden />
              <span className="text-xs font-light tracking-[0.32em] text-white/70">02</span>
            </div>

            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55 sm:text-xs">
              Two solutions. One ecosystem.
            </p>

            <h2
              className="mt-5 text-[clamp(2rem,4.2vw,3.4rem)] font-light leading-[1.12] tracking-[-0.02em] text-white"
              style={GLOW}
            >
              Everything your field needs.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60 sm:text-[15px]">
              Smart devices. Real-time data. Simple control. Greater yields.
            </p>
          </div>

          <nav className="mt-12 space-y-4 lg:mt-0" aria-label="Solution areas">
            {LEFT_LINKS.map((link) => {
              const active = activeLeft === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => setActiveLeft(link.id)}
                  className={`group flex w-full max-w-none items-center justify-between border-b pb-2 text-left text-sm transition lg:max-w-[11rem] ${
                    active
                      ? 'border-amber-400/80 text-white'
                      : 'border-white/15 text-white/45 hover:border-white/35 hover:text-white/80'
                  }`}
                >
                  <span className={active ? 'font-medium' : 'font-normal'}>{link.label}</span>
                  <ArrowRight
                    className={`h-3.5 w-3.5 transition ${active ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'}`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pump card */}
        <article className="relative min-h-[52vh] overflow-hidden border-b border-white/10 lg:min-h-0 lg:border-b-0 lg:border-r lg:border-white/10">
          <Image
            src="/kronis-pump.jpg"
            alt="Kronis solar irrigation pump in the field"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-center"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          <div className="absolute left-5 top-6 z-10 sm:left-7 sm:top-8">
            <h3
              className="text-[clamp(2rem,3.5vw,3.25rem)] font-semibold uppercase tracking-[0.06em] text-white"
              style={GLOW}
            >
              Pump
            </h3>
            <p className="mt-1 text-sm text-white/80 sm:text-[15px]">Move water intelligently.</p>
          </div>

          <Link
            href="/pump"
            scroll
            className="absolute bottom-6 left-5 z-10 inline-flex items-center gap-3 text-sm font-medium text-white transition hover:opacity-90 sm:bottom-8 sm:left-7"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md"
              style={{ boxShadow: '0 0 18px rgba(255,255,255,0.15)' }}
            >
              <ArrowRight className="h-4 w-4" />
            </span>
            Explore Pump
          </Link>
        </article>

        {/* Sensor card */}
        <article className="relative min-h-[56vh] overflow-hidden lg:min-h-0">
          <Image
            src="/kronis-sensor.jpg"
            alt="Kronis field sensor mounted in crops"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-[58%_45%]"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />

          <div className="absolute left-5 top-6 z-10 sm:left-7 sm:top-8">
            <h3
              className="text-[clamp(2rem,3.5vw,3.25rem)] font-semibold uppercase tracking-[0.06em] text-white"
              style={GLOW}
            >
              Sensor
            </h3>
            <p className="mt-1 text-sm text-white/80 sm:text-[15px]">Understand the field.</p>
          </div>

          {/* Glass stats */}
          <div
            className="absolute right-4 top-6 z-10 w-[min(100%,11.5rem)] rounded-xl border border-white/20 bg-black/35 px-3.5 py-3 backdrop-blur-md sm:right-6 sm:top-8"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 20px rgba(140,200,255,0.08)' }}
          >
            <ul className="space-y-2.5">
              {SENSOR_STATS.map((stat) => (
                <li key={stat.label} className="flex items-start gap-2.5 text-white">
                  <span
                    className="mt-0.5 text-white/90"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.45))' }}
                  >
                    {stat.icon}
                  </span>
                  <span>
                    <span
                      className="block text-sm font-semibold leading-none"
                      style={{ textShadow: '0 0 8px rgba(255,255,255,0.35)' }}
                    >
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-[10px] tracking-wide text-white/60">
                      {stat.label}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/sensor"
            scroll
            className="absolute bottom-6 left-5 z-10 inline-flex items-center gap-3 text-sm font-medium text-white transition hover:opacity-90 sm:bottom-8 sm:left-7"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md"
              style={{ boxShadow: '0 0 18px rgba(255,255,255,0.15)' }}
            >
              <ArrowRight className="h-4 w-4" />
            </span>
            Explore Sensor
          </Link>

          <nav
            className="absolute bottom-6 right-5 z-10 hidden space-y-2.5 text-right sm:bottom-8 sm:right-7 md:block"
            aria-label="Sensor insights"
          >
            {RIGHT_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className="group flex w-full items-center justify-end gap-2 text-xs text-white/55 transition hover:text-white/90 sm:text-sm"
              >
                {link.label}
                <ArrowRight className="h-3 w-3 opacity-60 transition group-hover:opacity-100" />
              </button>
            ))}
          </nav>
        </article>
      </div>
    </section>
  );
}
