import { NextResponse } from "next/server";
import { addPump, addSensor, assignDevice } from "@/lib/orgData";
import type { OrgSensor } from "@/lib/orgTypes";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: "add-pump" | "add-sensor" | "assign";
      model?: string;
      serial?: string;
      type?: OrgSensor["type"];
      label?: string;
      unitId?: string;
      modelNo?: string;
      firmware?: string;
      installLocation?: string;
      powerSource?: OrgSensor["powerSource"];
      notes?: string;
      unitCost?: number;
      unitPrice?: number;
      farmerId?: string | null;
      kind?: "pump" | "sensor";
      deviceId?: string;
    };

    if (body.action === "add-pump") {
      if (!body.serial?.trim()) {
        return NextResponse.json({ error: "Serial is required" }, { status: 400 });
      }
      const pump = await addPump({
        model: body.model ?? "Kronis 4",
        serial: body.serial,
        farmerId: body.farmerId ?? null,
      });
      return NextResponse.json({ pump }, { status: 201 });
    }

    if (body.action === "add-sensor") {
      if (!body.label?.trim()) {
        return NextResponse.json({ error: "Sensor name is required" }, { status: 400 });
      }
      if (!body.serial?.trim() && !body.unitId?.trim()) {
        return NextResponse.json(
          { error: "Serial or unit id is required" },
          { status: 400 }
        );
      }
      if (!body.modelNo?.trim()) {
        return NextResponse.json({ error: "Model number is required" }, { status: 400 });
      }
      const type = body.type ?? "soil";
      if (!["soil", "weather", "environment"].includes(type)) {
        return NextResponse.json({ error: "Invalid sensor type" }, { status: 400 });
      }
      const power = body.powerSource ?? "battery";
      if (!["battery", "solar", "wired"].includes(power)) {
        return NextResponse.json({ error: "Invalid power source" }, { status: 400 });
      }
      if (body.unitCost == null || !Number.isFinite(Number(body.unitCost))) {
        return NextResponse.json({ error: "Purchase cost is required" }, { status: 400 });
      }
      if (body.unitPrice == null || !Number.isFinite(Number(body.unitPrice))) {
        return NextResponse.json({ error: "Sell price is required" }, { status: 400 });
      }
      const sensor = await addSensor({
        type,
        label: body.label,
        unitId: body.unitId || body.serial || "",
        model: body.model,
        modelNo: body.modelNo,
        serial: body.serial || body.unitId,
        firmware: body.firmware,
        installLocation: body.installLocation,
        powerSource: power,
        notes: body.notes,
        unitCost: Number(body.unitCost),
        unitPrice: Number(body.unitPrice),
        farmerId: body.farmerId ?? null,
      });
      return NextResponse.json({ sensor }, { status: 201 });
    }

    if (body.action === "assign") {
      if (!body.deviceId || !body.kind) {
        return NextResponse.json(
          { error: "deviceId and kind are required" },
          { status: 400 }
        );
      }
      const file = await assignDevice({
        kind: body.kind,
        deviceId: body.deviceId,
        farmerId: body.farmerId ?? null,
      });
      return NextResponse.json({ ok: true, file });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Device update failed" },
      { status: 400 }
    );
  }
}
