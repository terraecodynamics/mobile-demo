import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "src/data/farm-boundaries.json");

type Assignment = {
  fieldId: string;
  pumpIds: string[];
  stopIfLeaves?: boolean;
};

type FarmFile = {
  fieldPumpAssignments?: Assignment[];
  [key: string]: unknown;
};

export async function GET() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const file = JSON.parse(raw) as FarmFile;
    return NextResponse.json({
      fieldPumpAssignments: Array.isArray(file.fieldPumpAssignments)
        ? file.fieldPumpAssignments
        : [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Read failed" },
      { status: 500 }
    );
  }
}

/** Replace field↔pump assignments in farm-boundaries.json */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      fieldPumpAssignments?: Assignment[];
    };

    let existing: FarmFile = {};
    try {
      existing = JSON.parse(await fs.readFile(FILE, "utf8")) as FarmFile;
    } catch {
      existing = {};
    }

    const assignments = Array.isArray(body.fieldPumpAssignments)
      ? body.fieldPumpAssignments.map((a) => ({
          fieldId: String(a.fieldId),
          pumpIds: Array.isArray(a.pumpIds) ? a.pumpIds.map(String) : [],
          stopIfLeaves: a.stopIfLeaves !== false,
        }))
      : [];

    const out: FarmFile = {
      ...existing,
      fieldPumpAssignments: assignments,
    };

    await fs.writeFile(FILE, `${JSON.stringify(out, null, 2)}\n`, "utf8");
    return NextResponse.json({
      ok: true,
      path: "src/data/farm-boundaries.json",
      count: assignments.length,
      fieldPumpAssignments: assignments,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Write failed" },
      { status: 500 }
    );
  }
}
