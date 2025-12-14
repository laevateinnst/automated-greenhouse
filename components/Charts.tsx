"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
} from "recharts";
import { useLiveSensorData } from "@/hooks/use-data";

export default function Charts() {
  const { sensorData } = useLiveSensorData();
  const { temperature, humidity, soilMoisture, light } = sensorData;

  // History buffer
  const [history, setHistory] = useState<
    {
      time: string;
      temperature: number;
      humidity: number;
      soil: number; // must match chart dataKey
      light: number;
    }[]
  >([]);

  // Thresholds
  const [soilThreshold, setSoilThreshold] = useState(40);
  const [lightThreshold, setLightThreshold] = useState(200);

  // Update history whenever new data arrives
  useEffect(() => {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newEntry = {
      time: now,
      temperature,
      humidity,
      soil: soilMoisture, // match the chart dataKey
      light,
    };

    setHistory((prev) => {
      const next = [...prev, newEntry];
      if (next.length > 20) next.shift(); // keep last 20 readings
      return next;
    });
  }, [temperature, humidity, soilMoisture, light]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Series</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Line chart */}
          <div className="col-span-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ReTooltip />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f97316"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#0ea5e9"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="light"
                  stroke="#fde047"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="soil"
                  stroke="#4ade80"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Live chart of the last {history.length} readings
        </span>
      </CardFooter>
    </Card>
  );
}
