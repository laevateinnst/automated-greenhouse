"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  light: number;
}

export type Command = "NONE" | "AUTO" | "MANUAL" | string;

export function useLiveSensorData(wsUrl: string = "ws://localhost:3001") {
  const wsRef = useRef<WebSocket | null>(null);

  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    light: 0,
  });

  const [lastCommand, setLastCommand] = useState<Command>("NONE");
  const [espOnline, setEspOnline] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({ type: "identify", client: "dashboard" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "status") {
          setEspOnline(Boolean(msg.espOnline));
        }

        if (msg.type === "sensor") {
          setSensorData(msg.data);
        }
      } catch (err) {
        console.error("Invalid WS message:", event.data);
      }
    };

    ws.onclose = () => {
      console.warn("WebSocket closed — retrying...");
      setEspOnline(false);
      wsRef.current = null;

      setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const sendCommand = useCallback((command: Command) => {
    setLastCommand(command);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "cmd", command }));
    }
  }, []);

  return {
    sensorData,
    espOnline,
    lastCommand,
    sendCommand,
  };
}
