'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const MODELS = [
  {
    id: 'core',
    href: '/pump/micro-4',
    image: '/pump-prototype.png',
    alt: 'Kronis Micro 4 controller',
    label: 'Core',
    name: 'Kronis Micro 4',
    lede: 'Compact solar micro pump for everyday irrigation.',
    specs: ['Mono PERC Bi-Cut', '28 kg panels', '0.53 Hp'],
  },
  {
    id: 'iot',
    href: '/pump/micro-4i',
    image: '/pump-prototype.png',
    alt: 'Kronis Micro 4i controller',
    label: 'Connected',
    name: 'Kronis Micro 4i',
    lede: 'Foldable panels with IoT, portal and app control.',
    specs: ['Mono PERC Bi-Cut', 'Foldable', 'IoT + app'],
  },
  {
    id: 'pro',
    href: '/pump/micro-4i-pro',
    image: '/pump-prototype-black.png',
    alt: 'Kronis Micro 4i Pro controller',
    label: 'Advanced',
    name: 'Kronis Micro 4i Pro',
    lede: 'Lightweight bifacial array, IoT, portal and sensor-ready control.',
    specs: ['Bi-facial Dual HJT', '11 kg panels', 'Sensor modules'],
  },
];

function VsMark() {
  return (
    <div className="relative grid h-10 w-full place-items-center sm:h-auto sm:w-12 sm:self-stretch">
      <span className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-[rgba(20,33,25,0.14)] sm:inset-x-auto sm:inset-y-[12%] sm:left-1/2 sm:h-auto sm:w-px sm:-translate-x-1/2 sm:translate-y-0" />
      <span className="relative z-[1] grid h-[42px] w-[42px] place-items-center rounded-full bg-[#142119] text-[11px] font-bold tracking-[0.08em] text-white">
        VS
      </span>
    </div>
  );
}

export default function KronisCompareSection({ dmSansFamily }) {
  return (
    <section
      id="kronis-compare"
      aria-labelledby="kronis-compare-heading"
      className="relative z-10 bg-[#f0e8dc] py-14 sm:py-16 md:py-20"
      style={{ fontFamily: dmSansFamily }}
    >
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <header className="mx-auto mb-10 max-w-lg text-center sm:mb-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c87828]">
            Compare
          </p>
          <h2
            id="kronis-compare-heading"
            className="mt-3 text-[clamp(1.8rem,3.8vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-[#142119]"
          >
            Choose the Kronis for your field
          </h2>
          <p className="mt-3 text-base text-[#2e3a30] sm:text-[1.02rem]">
            Same platform. Three levels of control.
          </p>
        </header>

        <div className="mb-8 grid grid-cols-1 items-center gap-3 sm:mb-10 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-4 md:gap-5">
          {MODELS.flatMap((model, index) => [
            index > 0 ? <VsMark key={`vs-${model.id}`} /> : null,
            <figure key={model.id} className="m-0 grid aspect-square max-h-[240px] w-full place-items-center">
              <Image
                src={model.image}
                alt={model.alt}
                width={800}
                height={800}
                className="h-auto w-[min(78%,200px)] object-contain drop-shadow-[0_22px_30px_rgba(20,33,25,0.16)]"
              />
            </figure>,
          ])}
        </div>

        <div className="grid grid-cols-1 gap-9 border-t border-[rgba(20,33,25,0.12)] pt-8 sm:grid-cols-3 sm:gap-6 md:gap-8 md:pt-10">
          {MODELS.map((model) => (
            <article key={model.id} className="flex min-w-0 flex-col items-center text-center">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c87828]">
                {model.label}
              </p>
              <h3 className="mb-2 text-[clamp(1.4rem,2.4vw,1.85rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#142119]">
                {model.name}
              </h3>
              <p className="mb-5 max-w-[28ch] text-[0.98rem] leading-relaxed text-[#2e3a30]">
                {model.lede}
              </p>
              <ul className="mb-6 flex flex-wrap justify-center gap-1.5">
                {model.specs.map((spec) => (
                  <li
                    key={spec}
                    className="rounded-full bg-[rgba(20,33,25,0.06)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#142119]"
                  >
                    {spec}
                  </li>
                ))}
              </ul>
              <Link
                href={model.href}
                className="mt-auto inline-flex items-center gap-2 rounded-full bg-[#142119] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1c2a22]"
              >
                View {model.name}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
