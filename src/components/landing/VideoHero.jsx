'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/** Matches Kronis reference / assembly plate — flat warm beige (no vignette seam). */
const ASSEMBLY_BG = '#d8d1c9';

const FRAME_COUNT = 84;
const FRAME_PATH = (i) =>
  `/assembly-frames/frame-${String(i).padStart(3, '0')}.webp`;

/** Caption beats tied to assemble scroll progress (0 → 1). */
const CAPTIONS = [
  {
    at: 0.04,
    title: 'One pump. Every part.',
    body: 'Scroll to open the Kronis assembly — each housing, seal, and mount engineered for the field.',
  },
  {
    at: 0.22,
    title: 'Power and control',
    body: 'Motor housing and IoT-ready core designed for long irrigation days and remote operation.',
  },
  {
    at: 0.42,
    title: 'Precision hydraulics',
    body: 'Discharge flange, strainer, and suction path machined for efficient, reliable water flow.',
  },
  {
    at: 0.62,
    title: 'Built to last seasons',
    body: 'Durable finishes and sealed construction keep the system working through dust, heat, and monsoon.',
  },
  {
    at: 0.8,
    title: 'Assembled for impact',
    body: 'From exploded parts to a complete Kronis pump — ready when your crops need water.',
  },
];

function captionIndexForProgress(progress) {
  let idx = 0;
  for (let i = 0; i < CAPTIONS.length; i += 1) {
    if (progress >= CAPTIONS[i].at) idx = i;
  }
  return idx;
}

/**
 * Top landing hero: scroll progress scrubs a WebP frame sequence (pump assemble).
 */
export default function VideoHero({ dmSansFamily }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const frameIndexRef = useRef(0);
  const captionIndexRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [captionsVisible, setCaptionsVisible] = useState(false);
  const [scrollHintVisible, setScrollHintVisible] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    let cancelled = false;
    let trigger;
    const ctx = canvas.getContext('2d', { alpha: false });

    const drawFrame = (index) => {
      const img = imagesRef.current[index];
      if (!img || !img.complete || !img.naturalWidth) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = ASSEMBLY_BG;
      ctx.fillRect(0, 0, w, h);

      // Fit entire frame in view (exploded assemblies are tall — cover crops them)
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const loadImages = () =>
      Promise.all(
        Array.from({ length: FRAME_COUNT }, (_, i) => {
          const frameNum = i + 1;
          return new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => resolve({ index: i, img, ok: true });
            img.onerror = () => resolve({ index: i, img: null, ok: false });
            img.src = FRAME_PATH(frameNum);
          });
        })
      );

    const bindScroll = () => {
      trigger?.kill();
      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=280%',
        pin: true,
        pinSpacing: true,
        scrub: 0.35,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const { progress } = self;

          const next = Math.min(
            FRAME_COUNT - 1,
            Math.max(0, Math.round(progress * (FRAME_COUNT - 1)))
          );
          if (next !== frameIndexRef.current) {
            frameIndexRef.current = next;
            drawFrame(next);
          }

          const nextCaption = captionIndexForProgress(progress);
          if (nextCaption !== captionIndexRef.current) {
            captionIndexRef.current = nextCaption;
            setCaptionIndex(nextCaption);
          }

          setCaptionsVisible(progress >= CAPTIONS[0].at);
          setScrollHintVisible(progress < 0.08);
        },
      });
      ScrollTrigger.refresh();
      drawFrame(frameIndexRef.current);
    };

    loadImages().then((results) => {
      if (cancelled) return;

      const okCount = results.filter((r) => r.ok).length;
      if (okCount < FRAME_COUNT * 0.5) {
        setLoadError(true);
        return;
      }

      imagesRef.current = results.map((r) => r.img);
      drawFrame(0);
      setReady(true);
      requestAnimationFrame(() => {
        if (cancelled) return;
        bindScroll();
        requestAnimationFrame(() => {
          if (cancelled) return;
          ScrollTrigger.refresh();
          drawFrame(frameIndexRef.current);
        });
      });
    });

    const onResize = () => {
      drawFrame(frameIndexRef.current);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(section);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
      ro?.disconnect();
      trigger?.kill();
    };
  }, []);

  const active = CAPTIONS[captionIndex];

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative h-[100svh] max-h-[100vh] w-full overflow-hidden"
      style={{ fontFamily: dmSansFamily, backgroundColor: ASSEMBLY_BG }}
      aria-label="Pump assembly scroll sequence"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />

      {!ready && !loadError && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: ASSEMBLY_BG }}
        >
          <div className="h-10 w-10 animate-pulse rounded-full border-2 border-orange-500/40 border-t-orange-400" />
        </div>
      )}

      {loadError && (
        <p
          className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-black/50"
          style={{ backgroundColor: ASSEMBLY_BG }}
        >
          Unable to load assembly frames.
        </p>
      )}

      {/* Scroll-synced copy — appears after first scroll */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 transition-opacity duration-500 ${
          captionsVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!captionsVisible}
      >
        <div className="mx-auto w-full max-w-7xl px-5 pt-10 sm:px-8 sm:pt-12 md:px-10 lg:px-12">
          <div className="max-w-[18rem] sm:max-w-xs md:max-w-sm lg:max-w-md">
            {captionsVisible && (
              <div key={captionIndex} className="assembly-caption">
                <h2 className="text-2xl font-bold leading-[1.12] tracking-tight text-zinc-900 sm:text-3xl md:text-4xl lg:text-[2.75rem]">
                  {active.title}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-600 sm:mt-4 sm:text-base md:text-[1.05rem]">
                  {active.body}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 px-4 text-center transition-opacity duration-300 sm:bottom-10 ${
          scrollHintVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45 sm:text-xs">
          Scroll to assemble
        </p>
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-black/20 p-1.5">
          <span className="h-1.5 w-1 animate-bounce rounded-full bg-orange-500" />
        </div>
      </div>

      <style>{`
        @keyframes assemblyCaptionIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .assembly-caption {
          animation: assemblyCaptionIn 0.42s ease-out;
        }
      `}</style>
    </section>
  );
}
