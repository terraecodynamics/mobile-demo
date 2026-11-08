import { NextResponse } from "next/server";
import { getSensorPayload } from "@/lib/orgData";

/** Organization overview — farmers, pumps, sensors, shares */
export async function GET() {
  const result = await getSensorPayload({});
  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
