import { NextResponse } from "next/server";
import { addFarmer, getFarmerBundle, listFarmers } from "@/lib/orgData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const farmerId = searchParams.get("id");
  if (farmerId) {
    const bundle = await getFarmerBundle(farmerId);
    if (!bundle) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }
    return NextResponse.json(bundle);
  }
  const farmers = await listFarmers();
  return NextResponse.json({ farmers });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      phone?: string;
      village?: string;
      farmName?: string;
    };
    if (!body.name?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }
    const farmer = await addFarmer({
      name: body.name,
      phone: body.phone,
      village: body.village ?? "",
      farmName: body.farmName ?? "",
    });
    return NextResponse.json({ farmer }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add farmer" },
      { status: 500 }
    );
  }
}
