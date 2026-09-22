import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "src/data/farm-boundaries.json");

type RadiusBucket = {
  radiusAcres: number;
  boundaries: unknown[];
};

type FarmFile = {
  benchmark?: Record<string, unknown>;
  radiusAcres?: number;
  analysisRadius?: unknown;
  byRadius?: RadiusBucket[];
  boundaries?: unknown[];
  [key: string]: unknown;
};

function normalizeAcres(n: number) {
  return Number(Math.max(0.05, Math.min(3, n)).toFixed(2));
}

function ensureByRadius(file: FarmFile): RadiusBucket[] {
  if (Array.isArray(file.byRadius) && file.byRadius.length) {
    return file.byRadius.map((b) => ({
      radiusAcres: normalizeAcres(Number(b.radiusAcres)),
      boundaries: b.boundaries ?? [],
    }));
  }
  if (Array.isArray(file.boundaries) && file.boundaries.length) {
    return [
      {
        radiusAcres: normalizeAcres(
          Number(file.radiusAcres ?? file.benchmark?.analysisAcres ?? 0.84)
        ),
        boundaries: file.boundaries,
      },
    ];
  }
  return [];
}

export async function GET() {
  const raw = await fs.readFile(FILE, "utf8");
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FarmFile;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    let existing: FarmFile = {};
    try {
      existing = JSON.parse(await fs.readFile(FILE, "utf8")) as FarmFile;
    } catch {
      existing = {};
    }

    const acres = normalizeAcres(
      Number(body.radiusAcres ?? body.benchmark?.analysisAcres ?? 0.84)
    );
    const incomingBuckets = ensureByRadius(body);
    const active =
      incomingBuckets.find((b) => b.radiusAcres === acres) ??
      ({
        radiusAcres: acres,
        boundaries: Array.isArray(body.boundaries) ? body.boundaries : [],
      } as RadiusBucket);

    const merged = ensureByRadius(existing).filter((b) => b.radiusAcres !== acres);
    merged.push(active);
    merged.sort((a, b) => a.radiusAcres - b.radiusAcres);

    const out: FarmFile = {
      ...existing,
      ...body,
      benchmark: {
        ...(existing.benchmark ?? {}),
        ...(body.benchmark ?? {}),
        analysisAcres: acres,
      },
      radiusAcres: acres,
      analysisRadius: body.analysisRadius ?? existing.analysisRadius,
      byRadius: merged,
      boundaries: active.boundaries,
    };

    await fs.writeFile(FILE, `${JSON.stringify(out, null, 2)}\n`, "utf8");
    return NextResponse.json({
      ok: true,
      path: "src/data/farm-boundaries.json",
      radii: merged.map((b) => b.radiusAcres),
      activeRadiusAcres: acres,
      fieldCount: active.boundaries.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Write failed" },
      { status: 500 }
    );
  }
}
