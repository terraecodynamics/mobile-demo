import { NextResponse } from "next/server";
import { createShare, readOrgFile } from "@/lib/orgData";

export async function GET() {
  const file = await readOrgFile();
  return NextResponse.json({ shares: file.shares });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      farmerId?: string;
      sensorIds?: string[];
      label?: string;
    };
    if (!body.farmerId || !Array.isArray(body.sensorIds)) {
      return NextResponse.json(
        { error: "farmerId and sensorIds are required" },
        { status: 400 }
      );
    }
    const share = await createShare({
      farmerId: body.farmerId,
      sensorIds: body.sensorIds,
      label: body.label,
    });
    return NextResponse.json(
      {
        share,
        apiUrl: `/api/org/sensors?token=${encodeURIComponent(share.token)}`,
        viewUrl: `/share/${encodeURIComponent(share.token)}`,
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Share failed" },
      { status: 400 }
    );
  }
}
