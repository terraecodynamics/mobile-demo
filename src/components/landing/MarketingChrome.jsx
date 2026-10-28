'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function MarketingChrome({ children }) {
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const liveRef = useRef(null);

  useLayoutEffect(() => {
    const root = liveRef.current;
    if (!root) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const curtain = root.querySelector('.page-live-curtain');
    const panelA = root.querySelector('.page-live-panel--a');
    const panelB = root.querySelector('.page-live-panel--b');
    const mark = root.querySelector('.page-live-mark');
    const main = root.querySelector('.page-live-main');
    if (!curtain || !panelA || !panelB || !mark || !main) return undefined;

    const ctx = gsap.context(() => {
      gsap.set(curtain, { autoAlpha: 1 });
      gsap.set(panelA, { yPercent: 0 });
      gsap.set(panelB, { yPercent: 0 });
      gsap.set(mark, { autoAlpha: 0, scale: 0.88 });
      gsap.set(main, { autoAlpha: 0, y: 28 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
      tl.to(mark, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power2.out' }, 0)
        .to(mark, { autoAlpha: 0, scale: 1.06, duration: 0.28, ease: 'power2.in' }, 0.5)
        .to(panelA, { yPercent: -105, duration: 0.78 }, 0.54)
        .to(panelB, { yPercent: 105, duration: 0.78 }, 0.54)
        .to(main, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.68)
        .set(curtain, { autoAlpha: 0 });
    }, root);

    return () => ctx.revert();
  }, [pathname]);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="Kronis home">
            <Image
              src="/kronis-logo.svg"
              alt="Kronis"
              width={112}
              height={41}
              className="h-7 w-auto object-contain sm:h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </Link>
          <nav className="flex items-center gap-4 text-sm sm:gap-6">
            <Link href="/" className="text-white/70 transition hover:text-white">
              Home
            </Link>
            <Link href="/pump" className="text-white/70 transition hover:text-white">
              Pump
            </Link>
            <Link href="/sensor" className="text-white/70 transition hover:text-white">
              Sensor
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-semibold text-white sm:text-sm"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <div key={pathname} ref={liveRef} className="page-live">
        <div className="page-live-curtain" aria-hidden>
          <div className="page-live-panel page-live-panel--a" />
          <div className="page-live-panel page-live-panel--b" />
          <div className="page-live-mark">
            <Image
              src="/kronis-logo.svg"
              alt=""
              width={168}
              height={62}
              className="h-10 w-auto object-contain sm:h-12"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>
        <div className="page-live-main">{children}</div>
      </div>
      <footer className="border-t border-white/10 bg-black px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/kronis-logo.svg"
            alt="Kronis"
            width={120}
            height={44}
            className="h-7 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <p className="text-xs text-white/45 sm:text-sm">© {year} TerraEco. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
