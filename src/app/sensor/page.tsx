import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MarketingChrome from "@/components/landing/MarketingChrome";

const STATS = [
  { label: "Temperature", value: "28.4°C" },
  { label: "Humidity", value: "65.2%" },
  { label: "Soil moisture", value: "32.5%" },
];

const MODULES = [
  {
    num: "01",
    title: "Soil moisture",
    body: "Know when the root zone is dry — irrigate only when the crop actually needs water.",
  },
  {
    num: "02",
    title: "Weather & humidity",
    body: "Field climate in real time so schedules follow conditions, not a fixed timer.",
  },
  {
    num: "03",
    title: "Pump handshake",
    body: "Modules talk to Kronis independently and through the cloud bridge — no extra cabling.",
  },
];

const STEPS = [
  { num: "01", title: "Sense", body: "Modules capture field conditions and stream to the IoT bridge." },
  { num: "02", title: "Decide", body: "Portal and app show live status so growers act with context." },
  { num: "03", title: "Water", body: "Kronis starts, stops, and meters irrigation from the field or phone." },
];

export default function SensorPage() {
  return (
    <MarketingChrome>
      <main>
        <section className="relative min-h-[70svh] overflow-hidden">
          <Image
            src="/kronis-sensor.jpg"
            alt="Kronis field sensor mounted in crops"
            fill
            priority
            sizes="100vw"
            className="page-live-hero object-cover object-[58%_40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
          <div className="page-live-copy relative z-10 mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-end px-4 pb-12 pt-24 sm:px-6 sm:pb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-400">
              Sensor
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Understand the field.
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
              Sensor modules sit with the crop — so irrigation follows field conditions, not guesswork.
            </p>
          </div>
        </section>

        <section className="bg-[#0a0a0a] py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-400">
                Sensor modules
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Sense. Decide. Water.</h2>
              <p className="mt-4 max-w-xl text-white/70">
                Work independently and communicate with the pump and cloud — PoC-ready hardware for
                connected farms.
              </p>
              <div className="mt-8 space-y-6">
                {MODULES.map((item) => (
                  <article key={item.num} className="border-t border-white/10 pt-5">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-orange-400">
                      {item.num}
                    </p>
                    <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
            <aside className="rounded-3xl border border-white/15 bg-black/50 p-6 backdrop-blur-md lg:mt-10">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Live snapshot</p>
              <ul className="mt-5 space-y-4">
                {STATS.map((stat) => (
                  <li key={stat.label} className="flex items-end justify-between border-b border-white/10 pb-3">
                    <span className="text-sm text-white/55">{stat.label}</span>
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-white/40">
                Soil, weather, and environment readings from a Kronis field node.
              </p>
            </aside>
          </div>
        </section>

        <section className="bg-[#111] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-400">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Connect. Sense. Act.</h2>
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {STEPS.map((step) => (
                <article key={step.num} className="rounded-2xl border border-white/10 bg-black/40 p-6">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-orange-400">{step.num}</p>
                  <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{step.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-semibold text-white"
              >
                Open the platform
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pump"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
              >
                Explore Pump
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
