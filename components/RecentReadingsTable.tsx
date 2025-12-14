"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Reading {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  light: number;
  recordedAt: string;
}

export default function RecentReadingsTable() {
  const [allReadings, setAllReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const readingsPerPage = 10;
  const totalPages = Math.ceil(allReadings.length / readingsPerPage);

  const fetchAllReadings = async () => {
    try {
      const res = await fetch("/api/getAllData");
      if (!res.ok) throw new Error("Failed to fetch readings");
      const data: Reading[] = await res.json();
      setAllReadings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReadings();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("All Sensor Readings", 14, 15);

    const tableColumn = ["Time", "Temp", "Humidity", "Soil Moisture", "Light"];
    const tableRows: any[] = [];

    allReadings.forEach((r) => {
      const rowData = [
        new Date(r.recordedAt).toLocaleString(),
        r.temperature,
        r.humidity,
        r.soilMoisture,
        r.light,
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
    });

    doc.save("all_sensor_readings.pdf");
  };

  if (loading) return <p>Loading readings...</p>;

  const indexOfLast = currentPage * readingsPerPage;
  const indexOfFirst = indexOfLast - readingsPerPage;
  const currentReadings = allReadings.slice(indexOfFirst, indexOfLast);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Recent Readings</CardTitle>
        <Button size="sm" onClick={exportPDF}>
          Export PDF
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Temp</TableHead>
              <TableHead>Humidity</TableHead>
              <TableHead>Soil Moisture</TableHead>
              <TableHead>Light</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentReadings.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{new Date(r.recordedAt).toLocaleString()}</TableCell>
                <TableCell>{r.temperature}</TableCell>
                <TableCell>{r.humidity}</TableCell>
                <TableCell>{r.soilMoisture}</TableCell>
                <TableCell>{r.light}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Prev
          </Button>
          <span className="text-sm px-2 flex items-center">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
