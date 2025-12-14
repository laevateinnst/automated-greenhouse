import mongoose, { Schema, model, models } from "mongoose";

const SensorReadingSchema = new Schema({
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  soilMoisture: { type: Number, required: true },
  light: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now },
});

const SensorReading = models.SensorReading || model("SensorReading", SensorReadingSchema);

export default SensorReading;
