'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const TITLE_GLOW = {
  textShadow:
    '0 0 12px rgba(255,255,255,0.55), 0 0 36px rgba(200,230,255,0.28), 0 2px 14px rgba(0,0,0,0.45)',
};

const STEPS = [
  {
    id: 'sun',
    label: 'Sun',
    kind: 'sun',
  },
  {
    id: 'panel',
    label: 'Solar',
    kind: 'image',
    src: '/solar-pump.png',
    objectPosition: 'center 20%',
  },
  {
    id: 'pump',
    label: 'Pump',
    kind: 'image',
    src: '/kronis-pump.jpg',
    objectPosition: '35% 55%',
  },
  {
    id: 'water',
    label: 'Water',
    kind: 'water',
  },
  {
    id: 'growth',
    label: 'Growth',
    kind: 'image',
    src: '/kronis-bg-image.png',
    objectPosition: '28% 70%',
  },
  {
    id: 'sensor',
    label: 'Sensor',
    kind: 'image',
    src: '/kronis-sensor.jpg',
    objectPosition: '58% 40%',
  },
];

function StepVisual({ step }) {
  if (step.kind === 'sun') {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#1a1208]">
        <div
          className="absolute inset-[-20%] rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(255,210,90,0.95) 0%, rgba(255,140,40,0.55) 32%, rgba(255,100,20,0.12) 58%, transparent 72%)',
          }}
        />
        <div
          className="relative h-[42%] w-[42%] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #FFF7D6 0%, #FFCC33 40%, #FF8A1F 100%)',
            boxShadow:
              '0 0 18px rgba(255,180,40,0.95), 0 0 40px rgba(255,120,20,0.65), inset 0 0 12px rgba(255,255,220,0.55)',
          }}
        />
      </div>
    );
  }

  if (step.kind === 'water') {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#071820]">
        <div
          className="absolute bottom-[18%] h-[42%] w-[70%] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(56,220,255,0.35) 0%, transparent 70%)',
            boxShadow: '0 0 24px rgba(56,200,255,0.35)',
          }}
        />
        {[1, 2, 3].map((ring) => (
          <div
            key={ring}
            className="absolute bottom-[22%] left-1/2 -translate-x-1/2 rounded-full border border-cyan-300/40"
            style={{
              width: `${28 + ring * 18}%`,
              height: `${10 + ring * 6}%`,
              boxShadow: '0 0 10px rgba(100,220,255,0.25)',
            }}
          />
        ))}
        <svg
          viewBox="0 0 24 32"
          className="relative z-[1] h-[46%] w-auto text-cyan-200"
          style={{
            filter:
              'drop-shadow(0 0 8px rgba(100,230,255,0.9)) drop-shadow(0 0 18px rgba(40,180,255,0.55))',
          }}
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M12 1.5C12 1.5 3.5 12.2 3.5 19a8.5 8.5 0 0017 0C20.5 12.2 12 1.5 12 1.5z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-full ${
        step.darkPad ? 'bg-[#14110e]' : 'bg-black'
      }`}
    >
      <Image
        src={step.src}
        alt=""
        fill
        sizes="140px"
        className="object-cover"
        style={{ objectPosition: step.objectPosition || 'center' }}
      />
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
    </div>
  );
}

/**
 * Section 03 — From sun to soil (parallax landscape + ecosystem flow).
 */
export default function SunToSoilSection({ dmSansFamily }) {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;
    if (!section || !bg) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        bg,
        { yPercent: -14 },
        {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );

      if (content) {
        gsap.fromTo(
          content,
          { y: 36, opacity: 0.72 },
          {
            y: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'top 28%',
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="sun-to-soil"
      className="relative isolate min-h-[85vh] w-full overflow-hidden bg-[#05070a] md:min-h-[100vh]"
      style={{ fontFamily: dmSansFamily }}
    >
      {/* Parallax background layer (taller so y-shift never gaps) */}
      <div className="pointer-events-none absolute inset-x-0 -top-[18%] bottom-[-18%] z-0 overflow-hidden" aria-hidden>
        <div ref={bgRef} className="absolute inset-0 will-change-transform">
          <Image
            src="/kronis-bg-image.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_50%]"
            style={{ opacity: 0.88 }}
            priority={false}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(5, 7, 10, 0.32)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 72% 42%, rgba(40,90,120,0.22) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 12% 68%, rgba(30,60,40,0.18) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>

      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex min-h-[85vh] w-full max-w-7xl flex-col justify-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[100vh] lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-10 lg:py-24 xl:px-12"
      >
        <div className="max-w-md shrink-0 lg:max-w-sm xl:max-w-md">
          <div className="mb-5 flex flex-col gap-2">
            <span className="h-px w-8 bg-white/50" aria-hidden />
            <span
              className="text-xs font-light tracking-[0.32em] text-white/75"
              style={{ textShadow: '0 0 10px rgba(255,255,255,0.25)' }}
            >
              03
            </span>
          </div>

          <h2
            className="text-[clamp(1.85rem,4.5vw,3.2rem)] font-light uppercase leading-[1.12] tracking-[0.08em] text-white"
            style={TITLE_GLOW}
          >
            From sun to soil.
          </h2>

          <p
            className="mt-4 max-w-sm text-sm font-normal leading-relaxed text-white/75 sm:mt-5 sm:text-base"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}
          >
            One connected system for smarter, more sustainable agriculture.
          </p>
        </div>

        {/* Flow */}
        <div className="relative min-w-0 flex-1 lg:pt-4">
          <svg
            className="pointer-events-none absolute left-0 right-0 top-[2.6rem] hidden h-20 w-full lg:block"
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="sun-soil-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFB020" />
                <stop offset="28%" stopColor="#F5D76E" />
                <stop offset="52%" stopColor="#7DD3FC" />
                <stop offset="78%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
              <filter id="sun-soil-glow" x="-20%" y="-140%" width="140%" height="380%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M30 40 C 130 12, 230 68, 350 40 S 530 12, 630 44 S 820 70, 940 36 S 1080 14, 1170 40"
              fill="none"
              stroke="url(#sun-soil-line)"
              strokeWidth="2.2"
              strokeLinecap="round"
              filter="url(#sun-soil-glow)"
              opacity="0.95"
            />
          </svg>

          <ol className="relative z-[1] flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 lg:grid lg:grid-cols-7 lg:gap-2 lg:overflow-visible lg:pb-0 xl:gap-3 [&::-webkit-scrollbar]:hidden">
            {STEPS.map((step) => (
              <li
                key={step.id}
                className="flex w-[6.75rem] shrink-0 snap-center flex-col items-center sm:w-[7.5rem] lg:w-auto"
              >
                <div
                  className="relative aspect-square w-full max-w-[7.75rem] rounded-full p-[2px] lg:max-w-none"
                  style={{
                    background:
                      'linear-gradient(145deg, rgba(255,255,255,0.55), rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.28))',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.12), 0 0 28px rgba(140,200,255,0.12)',
                  }}
                >
                  <div className="h-full w-full overflow-hidden rounded-full bg-black/80">
                    <StepVisual step={step} />
                  </div>
                </div>
                <span className="mt-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55 sm:text-[11px]">
                  {step.label}
                </span>
              </li>
            ))}

            <li className="flex w-[6.75rem] shrink-0 snap-center flex-col items-center sm:w-[7.5rem] lg:w-auto">
              <div
                className="relative flex aspect-square w-full max-w-[7.75rem] items-center justify-center rounded-full lg:max-w-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(74,222,128,0.28) 0%, rgba(16,40,24,0.9) 55%, #06140c 100%)',
                  boxShadow:
                    '0 0 0 1.5px rgba(110,255,160,0.45), 0 0 32px rgba(52,211,153,0.35), inset 0 0 24px rgba(74,222,128,0.15)',
                }}
              >
                <svg
                  viewBox="0 0 48 48"
                  className="h-[42%] w-[42%] text-emerald-300"
                  style={{
                    filter:
                      'drop-shadow(0 0 8px rgba(110,255,160,0.95)) drop-shadow(0 0 20px rgba(52,211,153,0.65))',
                  }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M24 40V22M24 22c0-9 7-15.5 16-16.5C39 15 33 21.5 24 22zm0 0c0-9-7-15.5-16-16.5C9 15 15 21.5 24 22z"
                  />
                </svg>
              </div>
              <span className="mt-3 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-300/80 sm:text-[11px]">
                Yield
              </span>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
