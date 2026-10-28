import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import MarketingChrome from "@/components/landing/MarketingChrome";
import {
  KRONIS_PRODUCTS,
  KRONIS_SHARED,
  formatInr,
  getKronisProduct,
} from "@/lib/kronisProducts";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return KRONIS_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = getKronisProduct(slug);
  if (!product) return { title: "Kronis pump" };
  return {
    title: `${product.name} | Kronis`,
    description: product.lede,
  };
}

function shortName(name: string) {
  return name.replace("Kronis ", "");
}

export default async function KronisProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getKronisProduct(slug);
  if (!product) notFound();

  const index = KRONIS_PRODUCTS.findIndex((item) => item.slug === product.slug);
  const others = KRONIS_PRODUCTS.filter((item) => item.slug !== product.slug);
  const display = shortName(product.name);

  return (
    <MarketingChrome>
      <main className="bg-[#070807] text-white">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_78%_42%,rgba(200,120,40,0.18),transparent_58%),linear-gradient(180deg,#10140f_0%,#070807_100%)]"
          />
          <div className="page-live-copy relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:pb-24 lg:pt-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
                <span>/</span>
                <Link href="/pump" className="hover:text-white">
                  Pump
                </Link>
                <span>/</span>
                <span className="text-white/70">{display}</span>
              </nav>
              <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                {KRONIS_PRODUCTS.map((item) => {
                  const active = item.slug === product.slug;
                  return (
                    <Link
                      key={item.slug}
                      href={`/pump/${item.slug}`}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition sm:px-4 ${
                        active ? "bg-white text-[#142119]" : "text-white/55 hover:text-white"
                      }`}
                    >
                      {shortName(item.name)}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
              <div className="relative z-10 max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e39a4a]">
                  {String(index + 1).padStart(2, "0")} — {product.label}
                </p>
                <h1 className="mt-4 text-[clamp(2.6rem,7vw,5.4rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
                  {display}
                </h1>
                <p className="mt-5 max-w-[38ch] text-base leading-relaxed text-white/60 sm:text-lg">
                  {product.lede}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {product.specs.map((spec) => (
                    <span
                      key={spec}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/70"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="mt-10 flex items-end justify-between gap-6 border-t border-white/10 pt-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">From</p>
                    <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
                      {formatInr(product.priceInr)}
                    </p>
                    <p className="mt-2 text-xs text-white/40">{product.priceNote}</p>
                  </div>
                  <a
                    href="tel:+917205150067"
                    className="hidden h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600 text-white shadow-[0_12px_40px_rgba(234,88,12,0.35)] sm:inline-flex"
                    aria-label="Book this pump"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="tel:+917205150067"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#142119] transition hover:bg-[#f0e8dc]"
                  >
                    Book this pump
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/pump"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-white/75 transition hover:border-white/40 hover:text-white"
                  >
                    Compare lineup
                  </Link>
                </div>
              </div>

              <figure className="relative m-0 isolate min-h-[360px] sm:min-h-[480px] lg:min-h-[560px]">
                <p
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[8%] z-0 w-[140%] -translate-x-1/2 text-center text-[clamp(4.5rem,14vw,9.5rem)] font-semibold leading-none tracking-[-0.08em] text-white/[0.055] select-none"
                >
                  {display.toUpperCase()}
                </p>
                <div
                  aria-hidden
                  className="absolute left-1/2 top-[58%] h-[52%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(243,232,216,0.16)_0%,transparent_68%)] blur-2xl"
                />
                <Image
                  src={product.image}
                  alt={product.name}
                  width={980}
                  height={980}
                  priority
                  className="page-live-hero relative z-10 mx-auto h-auto w-[min(96%,640px)] object-contain drop-shadow-[0_40px_70px_rgba(0,0,0,0.55)]"
                />
              </figure>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0c0e0c]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
            {KRONIS_SHARED.map((item) => (
              <div key={item.label} className="bg-[#0c0e0c] px-5 py-8">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{item.label}</p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#f3ece2] py-16 text-[#142119] sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c87828]">
                In the kit
              </p>
              <h2 className="mt-3 max-w-[12ch] text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
                Everything that ships with {display}
              </h2>
              <ul className="mt-10 space-y-0">
                {product.includes.map((line, i) => (
                  <li
                    key={line}
                    className="flex items-start gap-4 border-t border-[#142119]/10 py-4 last:border-b"
                  >
                    <span className="mt-0.5 w-8 shrink-0 text-xs font-semibold tracking-[0.14em] text-[#c87828]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.98rem] leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c87828]">
                Specs
              </p>
              <h2 className="mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
                Product details
              </h2>
              <dl className="mt-10 overflow-hidden rounded-[1.6rem] bg-[#142119] text-white">
                {product.features.map((row, i) => {
                  const yes = row.value === "Yes";
                  const no = row.value === "No";
                  return (
                    <div
                      key={row.name}
                      className={`flex items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
                        i !== 0 ? "border-t border-white/10" : ""
                      }`}
                    >
                      <dt className="text-sm text-white/55">{row.name}</dt>
                      <dd>
                        {yes || no ? (
                          <span
                            className={`inline-flex min-w-[3.2rem] items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                              yes ? "bg-orange-400/15 text-orange-300" : "bg-white/8 text-white/30"
                            }`}
                          >
                            {yes ? (
                              <span className="inline-flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" /> Yes
                              </span>
                            ) : (
                              "—"
                            )}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold">{row.value}</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
        </section>

        <section className="bg-[#070807] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e39a4a]">
                  Lineup
                </p>
                <h2 className="mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold tracking-[-0.04em]">
                  Other Kronis models
                </h2>
              </div>
              <Link href="/pump" className="text-sm text-white/50 transition hover:text-white">
                View all →
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
              {others.map((item) => (
                <Link
                  key={item.slug}
                  href={`/pump/${item.slug}`}
                  className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#111411] p-6 transition hover:border-white/25 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e39a4a]">
                        {item.label}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight">{item.name}</h3>
                      <p className="mt-2 max-w-[32ch] text-sm text-white/50">{item.lede}</p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 transition group-hover:bg-white group-hover:text-[#142119]">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <p className="text-lg font-semibold">{formatInr(item.priceInr)}</p>
                    <Image
                      src={item.image}
                      alt=""
                      width={220}
                      height={220}
                      className="h-28 w-28 object-contain transition duration-500 group-hover:scale-105 sm:h-36 sm:w-36"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
