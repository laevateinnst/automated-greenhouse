"use client";

import Alerts from "@/components/Alerts";
import Charts from "@/components/Charts";
import EnvironmentOverview from "@/components/EnvironmentOverview";
import Header from "@/components/Header";
import RecentReadingsTable from "@/components/RecentReadingsTable";
import { useLiveSensorData } from "@/hooks/use-data";
import React, { useState, useMemo, useEffect } from "react";

export default function GreenhouseDashboard() {
  const { espOnline, sensorData, sendCommand } = useLiveSensorData();
  const { temperature, humidity, soilMoisture, light } = sensorData;

  /* ===============================
     ACTUATORS / MANUAL STATES
  =============================== */

  const [shadeOn, setShadeOn] = useState(false);
  const [pumpOn, setPumpOn] = useState(false);
  const [systemMode, setSystemMode] = useState<"AUTO" | "SLEEP">("AUTO");

  /* ===============================
     HISTORY (FOR CHARTS)
  =============================== */

  const [history, setHistory] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 20 }).map((_, i) => ({
      time: new Date(now - (19 - i) * 60 * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temperature,
      humidity,
      soilMoisture,
      light,
    }));
  });

  useEffect(() => {
    setHistory((prev) => [
      ...prev.slice(1),
      {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        temperature,
        humidity,
        soilMoisture,
        light,
      },
    ]);
  }, [temperature, humidity, soilMoisture, light]);

  const recentReadings = useMemo(() => history.slice(-8).reverse(), [history]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto">
        <Header espOnline={espOnline} />

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <section className="lg:col-span-1 space-y-4">
            <EnvironmentOverview
              temperature={temperature}
              humidity={humidity}
              soil={soilMoisture}
              light={light}
              shadeOn={shadeOn}
              setShadeOn={(v) => {
                setShadeOn(v);
                sendCommand(v ? "SHADE_ON" : "SHADE_OFF");
              }}
              pumpOn={pumpOn}
              setPumpOn={(v) => {
                setPumpOn(v);
                sendCommand(v ? "PUMP_ON" : "PUMP_OFF");
              }}
              systemMode={systemMode}
              setSystemMode={(mode) => {
                setSystemMode(mode);
                sendCommand(mode); // AUTO or SLEEP
              }}
              sendCommand={sendCommand}
            />

            <Alerts
              temperature={temperature}
              soilMoisture={soilMoisture}
              light={light}
            />
          </section>

          {/* RIGHT PANEL */}
          <section className="lg:col-span-2 space-y-4">
            <Charts history={history} soil={soilMoisture} />
            <RecentReadingsTable recentReadings={recentReadings} />
          </section>
        </main>
      </div>
    </div>
  );
}
