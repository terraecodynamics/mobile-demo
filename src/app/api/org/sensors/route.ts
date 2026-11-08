import { NextResponse } from "next/server";
import { getSensorPayload } from "@/lib/orgData";

/**
 * Sensor data API
 * - GET /api/org/sensors                     → all org sensors
 * - GET /api/org/sensors?farmerId=farmer-1   → sensors for one farmer
 * - GET /api/org/sensors?token=gv-ravi-soil  → shared sensor payload (no login)
 * - GET /api/org/sensors?farmerId=…&sensorId=… → one sensor
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const result = await getSensorPayload({
    farmerId: searchParams.get("farmerId"),
    token: searchParams.get("token"),
    sensorId: searchParams.get("sensorId"),
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
