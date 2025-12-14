// app/api/getReadings/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SensorReading from "@/models/sensors";

export async function GET() {
  try {
    await dbConnect();
    const readings = await SensorReading.find().sort({ recordedAt: -1 }).lean();
    return NextResponse.json(readings);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to fetch readings" },
      { status: 500 }
    );
  }
}
