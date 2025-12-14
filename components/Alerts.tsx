"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface AlertsProps {
  temperature: number;
  soilMoisture: number;
  light: number;
}

export default function Alerts({
  temperature,
  soilMoisture,
  light,
}: AlertsProps) {
  const alerts = useMemo(() => {
    const a: string[] = [];
    if (temperature > 30) a.push("High temperature — check ventilation");
    if (temperature < 10) a.push("Low temperature — heater recommended");
    if (soilMoisture < 25) a.push("Soil moisture low — watering needed");
    if (light < 200) a.push("Low light — consider open shade");
    return a;
  }, [temperature, soilMoisture, light]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">All systems normal</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((msg, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm">{msg}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
