import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SensorReading from "@/models/sensors";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { temperature, humidity, soilMoisture, light } = await req.json();

    if (
      temperature === undefined ||
      humidity === undefined ||
      soilMoisture === undefined ||
      light === undefined
    ) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const newReading = new SensorReading({
      temperature,
      humidity,
      soilMoisture,
      light,
    });
    await newReading.save();

    return NextResponse.json(
      { message: "Reading saved successfully", data: newReading },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
