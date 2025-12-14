"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Thermometer, Droplets, Sun, Settings, Power } from "lucide-react";
import { motion } from "framer-motion";

interface EnvironmentProps {
  temperature: number;
  humidity: number;
  soil: number;
  light: number;

  shadeOn: boolean;
  setShadeOn: (v: boolean) => void;

  pumpOn: boolean;
  setPumpOn: (v: boolean) => void;

  systemMode: "AUTO" | "SLEEP";
  setSystemMode: (v: "AUTO" | "SLEEP") => void;

  sendCommand: (cmd: string) => void;
}

export default function EnvironmentOverview({
  temperature,
  humidity,
  soil,
  light,
  shadeOn,
  setShadeOn,
  pumpOn,
  setPumpOn,
  systemMode,
  setSystemMode,
  sendCommand,
}: EnvironmentProps) {
  const [calibration, setCalibration] = useState("");

  const sensors = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: `${temperature}°C`,
      target: "24°C",
      color: "bg-orange-500",
      width: (temperature / 40) * 100,
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${humidity}%`,
      target: "55%",
      color: "bg-blue-500",
      width: humidity,
    },
    {
      icon: Sun,
      label: "Light",
      value: `${light} lx`,
      target: "100%",
      color: "bg-yellow-500",
      width: (light / 100) * 100,
    },
    {
      icon: Droplets,
      label: "Soil Moisture",
      value: `${soil}%`,
      target: "40–60%",
      color: "bg-green-500",
      width: soil,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Overview</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* SENSOR CARDS */}
        <div className="grid grid-cols-2 gap-3">
          {sensors.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {s.label}
                      </div>
                      <div className="text-lg font-medium">{s.value}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.target}
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${s.color}`}
                    style={{ width: `${s.width}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <Separator />

        {/* SYSTEM MODE */}
        <div className="space-y-2">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Power className="w-4 h-4" />
            System Mode
          </div>

          <div className="flex gap-2">
            <Button
              variant={systemMode === "AUTO" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSystemMode("AUTO");
                sendCommand("AUTO");
              }}
            >
              AUTO
            </Button>
            <Button
              variant={systemMode === "SLEEP" ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                setSystemMode("SLEEP");
                sendCommand("SLEEP");
              }}
            >
              SLEEP
            </Button>
          </div>
        </div>

        <Separator />

        {/* MAINTENANCE */}
        <div className="space-y-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Maintenance
          </div>

          {/* SHADE */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <span className="text-sm">Shade</span>
            </div>
            <Switch
              checked={shadeOn}
              onCheckedChange={(v) => {
                setShadeOn(v);
                sendCommand(v ? "SHADE_ON" : "SHADE_OFF");
              }}
            />
          </div>

          {/* WATER PUMP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              <span className="text-sm">Water Pump</span>
            </div>
            <Switch
              checked={pumpOn}
              onCheckedChange={(v) => {
                setPumpOn(v);
                sendCommand(v ? "PUMP_ON" : "PUMP_OFF");
              }}
            />
          </div>

          {/* SOIL CALIBRATION */}
          <div className="mt-3 space-y-2 rounded-lg border p-3">
            <div className="text-xs font-medium text-muted-foreground">
              Soil Sensor Calibration
            </div>

            <Input
              placeholder="Enter wet,dry (e.g. 200,330)"
              value={calibration}
              onChange={(e) => setCalibration(e.target.value)}
            />

            <Button
              size="sm"
              className="w-full"
              disabled={!/^\s*\d+\s*,\s*\d+\s*$/.test(calibration)}
              onClick={() =>
                sendCommand(`CAL_SOIL:${calibration.replace(/\s+/g, "")}`)
              }
            >
              Set Calibration
            </Button>

            <p className="text-[10px] text-muted-foreground">
              Format: <code>wet,dry</code> (example: <code>200,330</code>)
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground justify-between">
        <span>Mode: {systemMode}</span>
        <span>Last update: {new Date().toLocaleTimeString()}</span>
      </CardFooter>
    </Card>
  );
}
