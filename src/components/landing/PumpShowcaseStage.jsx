'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Drop a transparent PNG at public/pump-showcase.png when ready. */
const SHOWCASE_PNG = '/pump-showcase.png';
const FALLBACK_PNG = '/pump-prototype.png';

export default function PumpShowcaseStage() {
  const [src, setSrc] = useState(SHOWCASE_PNG);
  const [useFallback, setUseFallback] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Ambient wash — scaled to smaller hero */}
      <div
        className="pointer-events-none absolute left-1/2 top-[36%] h-[min(44vh,400px)] w-[min(85vw,480px)] -translate-x-1/2 -translate-y-1/2"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 72% 62% at 50% 42%, rgba(55,125,235,0.32) 0%, rgba(35,85,190,0.14) 40%, transparent 72%)',
          filter: 'blur(48px)',
        }}
      />

      <div className="relative flex min-h-[min(38vh,320px)] items-center justify-center py-2 sm:min-h-[min(42vh,360px)] sm:py-4">
        <div className="relative w-full max-w-[220px] sm:max-w-[280px] md:max-w-[320px]">
          {/* Spotlight behind pump — matches reference studio glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-[8%] z-0 h-[78%] w-[200%] -translate-x-1/2"
            aria-hidden
            style={{
              background:
                'radial-gradient(ellipse 48% 72% at 50% 32%, rgba(95,175,255,0.38) 0%, rgba(50,120,230,0.18) 38%, transparent 68%)',
              filter: 'blur(32px)',
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[18%] z-0 h-[52%] w-[155%] -translate-x-1/2"
            aria-hidden
            style={{
              background:
                'radial-gradient(circle at 50% 38%, rgba(140,200,255,0.28) 0%, rgba(70,150,255,0.12) 45%, transparent 72%)',
              filter: 'blur(22px)',
            }}
          />

          {/* Blue pedestal ring — tied to pump width / base */}
          <div
            className="pointer-events-none absolute bottom-[1%] left-1/2 z-[1] -translate-x-1/2"
            style={{
              width: '118%',
              height: 'clamp(26px, 9vw, 48px)',
            }}
            aria-hidden
          >
            <div
              className="absolute inset-0 rounded-[50%]"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(55,125,255,0.22) 0%, rgba(35,90,200,0.08) 42%, transparent 70%)',
                filter: 'blur(6px)',
              }}
            />
            <div
              className="absolute inset-0 rounded-[50%]"
              style={{
                border: '1px solid rgba(110,190,255,0.55)',
                boxShadow:
                  '0 0 32px rgba(60,145,255,0.5), 0 0 64px rgba(40,110,240,0.22), inset 0 0 24px rgba(100,175,255,0.16)',
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 rounded-[50%] -translate-x-1/2 -translate-y-1/2"
              style={{
                width: '72%',
                height: '72%',
                border: '1px solid rgba(120,190,255,0.2)',
                boxShadow: '0 0 18px rgba(60,140,255,0.2)',
              }}
            />
          </div>

          <Image
            src={src}
            alt="Kronis submersible pump — precision engineered for solar irrigation"
            width={800}
            height={1000}
            sizes="(max-width: 640px) 220px, (max-width: 768px) 280px, 320px"
            className="relative z-[2] mx-auto h-auto w-full max-h-[min(44vh,380px)] object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
            style={{ width: 'auto', height: 'auto' }}
            onError={() => {
              if (!useFallback) {
                setUseFallback(true);
                setSrc(FALLBACK_PNG);
              }
            }}
            priority={false}
          />
        </div>
      </div>
    </div>
  );
}