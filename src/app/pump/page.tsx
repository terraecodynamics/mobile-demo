import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MarketingChrome from "@/components/landing/MarketingChrome";

const TYPES = [
  {
    id: "core",
    href: "/pump/micro-4",
    image: "/pump-prototype.png",
    label: "Core",
    name: "Kronis Micro 4",
    lede: "Compact solar micro pump for everyday irrigation.",
    specs: ["Mono PERC Bi-Cut", "28 kg panels", "0.53 Hp"],
    highlights: ["Practical flow 18000 LPH at 0 m head", "6000 LPH at 10 m head"],
  },
  {
    id: "iot",
    href: "/pump/micro-4i",
    image: "/pump-prototype.png",
    label: "Connected",
    name: "Kronis Micro 4i",
    lede: "Foldable panels with IoT, portal and app control.",
    specs: ["Mono PERC Bi-Cut", "Foldable", "IoT + app"],
    highlights: ["Advanced IoT + app access", "Access to portal and app"],
  },
  {
    id: "pro",
    href: "/pump/micro-4i-pro",
    image: "/pump-prototype-black.png",
    label: "Advanced",
    name: "Kronis Micro 4i Pro",
    lede: "Lightweight bifacial array, IoT, portal and sensor-ready control.",
    specs: ["Bi-facial Dual HJT", "11 kg panels", "Sensor modules"],
    highlights: ["Advanced IoT + app access", "Integration with field sensors"],
  },
];

const SHARED = [
  { label: "0 m head", value: "18000 LPH" },
  { label: "10 m head", value: "6000 LPH" },
  { label: "Delivery head", value: "38 mm" },
  { label: "Power", value: "0.53 Hp" },
  { label: "Pump + controller", value: "12 kg" },
  { label: "Solar array", value: "480W (120W × 4)" },
];

const FEATURE_ROWS = [
  { name: "Solar panel type", four: "Mono PERC Bi-Cut", fourI: "Mono PERC Bi-Cut", pro: "Bi-facial Dual HJT" },
  { name: "Solar panel efficiency", four: "19%", fourI: "19%", pro: "23±5%" },
  { name: "Solar panel weight", four: "28 kg", fourI: "28 kg", pro: "11 kg" },
  { name: "Foldable solar panel", four: false, fourI: true, pro: true },
  { name: "Advanced IoT integration", four: false, fourI: true, pro: true },
  { name: "Access to portal & app", four: false, fourI: true, pro: true },
  { name: "Integration with sensor modules", four: false, fourI: false, pro: true },
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

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return (
      <span className={value ? "font-semibold text-[#c87828]" : "text-[#142119]/28"}>
        {value ? "Yes" : "—"}
      </span>
    );
  }
  return <span className="text-[#2e3a30]">{value}</span>;
}

export default function PumpPage() {
  return (
    <MarketingChrome>
      <main>
        <section className="relative min-h-[62svh] overflow-hidden">
          <Image
            src="/kronis-pump.jpg"
            alt="Kronis solar irrigation pump in the field"
            fill
            priority
            sizes="100vw"
            className="page-live-hero object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="page-live-copy relative z-10 mx-auto flex min-h-[62svh] max-w-7xl flex-col justify-end px-4 pb-12 pt-24 sm:px-6 sm:pb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-400">
              Pump
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Choose the Kronis for your field
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
              Same platform. Three levels of control — Kronis Micro 4, 4i and 4i Pro.
            </p>
          </div>
        </section>

        <section className="bg-[#f0e8dc] py-14 text-[#142119] sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <header className="mx-auto mb-10 max-w-xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c87828]">
                Models
              </p>
              <h2 className="mt-3 text-[clamp(1.8rem,3.8vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
                Three types. One ecosystem.
              </h2>
            </header>

            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-4">
              {TYPES.flatMap((model, index) => [
                index > 0 ? <VsMark key={`vs-${model.id}`} /> : null,
                <figure key={model.id} className="m-0 grid aspect-square max-h-[240px] w-full place-items-center">
                  <Image
                    src={model.image}
                    alt={model.name}
                    width={800}
                    height={800}
                    className="h-auto w-[min(78%,200px)] object-contain drop-shadow-[0_22px_30px_rgba(20,33,25,0.16)]"
                  />
                </figure>,
              ])}
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-9 border-t border-[rgba(20,33,25,0.12)] pt-8 sm:grid-cols-3 sm:gap-8">
              {TYPES.map((model) => (
                <article key={model.id} className="flex flex-col items-center text-center">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c87828]">
                    {model.label}
                  </p>
                  <h3 className="mb-2 text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold tracking-[-0.03em]">
                    {model.name}
                  </h3>
                  <p className="mb-5 max-w-[32ch] text-[0.98rem] leading-relaxed text-[#2e3a30]">
                    {model.lede}
                  </p>
                  <ul className="mb-4 flex flex-wrap justify-center gap-1.5">
                    {model.specs.map((spec) => (
                      <li
                        key={spec}
                        className="rounded-full bg-[rgba(20,33,25,0.06)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      >
                        {spec}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1 text-sm text-[#2e3a30]">
                    {model.highlights.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <Link
                    href={model.href}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#142119] px-5 py-2.5 text-sm font-bold text-white"
                  >
                    View {model.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>

            <div className="mx-auto mt-14 max-w-5xl">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c87828]">
                Model-specific features
              </p>
              <h3 className="mt-3 text-center text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold tracking-[-0.03em]">
                What each Kronis includes
              </h3>
              <div className="mt-8 overflow-x-auto rounded-2xl border border-[rgba(20,33,25,0.12)] bg-white/45">
                <table className="min-w-[640px] w-full text-left text-sm">
                  <thead className="bg-[rgba(20,33,25,0.05)] text-[11px] uppercase tracking-[0.14em] text-[#142119]/55">
                    <tr>
                      <th className="px-4 py-3 font-medium">Feature</th>
                      <th className="px-4 py-3 font-medium">Micro 4</th>
                      <th className="px-4 py-3 font-medium">Micro 4i</th>
                      <th className="px-4 py-3 font-medium">Micro 4i Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_ROWS.map((row) => (
                      <tr key={row.name} className="border-t border-[rgba(20,33,25,0.1)]">
                        <td className="px-4 py-3 text-[#142119]/70">{row.name}</td>
                        <td className="px-4 py-3">
                          <Cell value={row.four} />
                        </td>
                        <td className="px-4 py-3">
                          <Cell value={row.fourI} />
                        </td>
                        <td className="px-4 py-3">
                          <Cell value={row.pro} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0a0a0a] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-400">
              Lineup
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Farming made simple with smart irrigation</h2>
            <p className="mt-3 max-w-2xl text-white/60">
              Kronis Micro 4, 4i and 4i Pro — the same family, three levels of control.
            </p>
            <div className="relative mx-auto mt-8 w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:max-w-[420px] md:max-w-[520px]">
              <Image
                src="/kronis-models-flyer.jpg"
                alt="Kronis Micro 4, 4i and 4i Pro model lineup"
                width={900}
                height={1200}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#111] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-400">
              Shared performance
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">One pump family. Clear numbers.</h2>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {SHARED.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{item.label}</p>
                  <p className="mt-2 text-lg font-bold text-orange-400 sm:text-xl">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-white/35">
              Pump warranty 2 years (fixed) + 1 year extended. Solar panels 15 years (≥80% rated output).
            </p>
            <p className="mt-8 text-sm text-white/55">
              Bookings open — call{" "}
              <a href="tel:+917205150067" className="text-orange-400 hover:text-orange-300">
                +91 72051 50067
              </a>{" "}
              or{" "}
              <a href="mailto:hello@terraecodynamics.com" className="text-orange-400 hover:text-orange-300">
                hello@terraecodynamics.com
              </a>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-semibold text-white"
              >
                Request a briefing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sensor"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
              >
                Explore Sensor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
