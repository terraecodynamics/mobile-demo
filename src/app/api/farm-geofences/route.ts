import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "src/data/farm-boundaries.json");

type GeofenceBucket = {
  radiusAcres: number;
  fieldIds: string[];
  boundaries: unknown[];
};

type FarmFile = {
  radiusAcres?: number;
  geofences?: GeofenceBucket[];
  [key: string]: unknown;
};

function normalizeAcres(n: number) {
  return Number(Math.max(0.05, Math.min(3, n)).toFixed(2));
}

export async function GET() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const file = JSON.parse(raw) as FarmFile;
    return NextResponse.json({
      geofences: Array.isArray(file.geofences) ? file.geofences : [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Read failed" },
      { status: 500 }
    );
  }
}

/** Merge one radius's geofence selection into farm-boundaries.json */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      radiusAcres?: number;
      fieldIds?: string[];
      boundaries?: unknown[];
      geofences?: GeofenceBucket[];
    };

    let existing: FarmFile = {};
    try {
      existing = JSON.parse(await fs.readFile(FILE, "utf8")) as FarmFile;
    } catch {
      existing = {};
    }

    const acres = normalizeAcres(Number(body.radiusAcres ?? existing.radiusAcres ?? 0.84));
    const incoming: GeofenceBucket = {
      radiusAcres: acres,
      fieldIds: Array.isArray(body.fieldIds) ? body.fieldIds.map(String) : [],
      boundaries: Array.isArray(body.boundaries) ? body.boundaries : [],
    };

    const prev = (Array.isArray(existing.geofences) ? existing.geofences : []).filter(
      (b) => normalizeAcres(Number(b.radiusAcres)) !== acres
    );
    const geofences = [...prev, incoming].sort(
      (a, b) => a.radiusAcres - b.radiusAcres
    );

    const out: FarmFile = {
      ...existing,
      radiusAcres: acres,
      geofences,
    };

    await fs.writeFile(FILE, `${JSON.stringify(out, null, 2)}\n`, "utf8");
    return NextResponse.json({
      ok: true,
      path: "src/data/farm-boundaries.json",
      radiusAcres: acres,
      fieldIds: incoming.fieldIds,
      count: incoming.fieldIds.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Write failed" },
      { status: 500 }
    );
  }
}
