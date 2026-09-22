import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ z: string; x: string; y: string }> };

/**
 * Same-origin proxy for Google satellite tiles.
 * Avoids browser CORS / referrer blocks so imagery matches Google Earth.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { z, x, y } = await ctx.params;
  const zi = Number(z);
  const xi = Number(x);
  const yi = Number(y);
  if (![zi, xi, yi].every((n) => Number.isFinite(n) && n >= 0) || zi > 22) {
    return new NextResponse("bad tile", { status: 400 });
  }

  const server = xi % 4;
  const upstream = `https://mt${server}.google.com/vt/lyrs=s&x=${xi}&y=${yi}&z=${zi}&scale=2`;

  try {
    const res = await fetch(upstream, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.google.com/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      // Cache tiles for a day on the Next server
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return new NextResponse("upstream error", { status: res.status });
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
}
