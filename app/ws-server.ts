import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3001 });
console.log("WebSocket server running on ws://localhost:3001");

let espClient: any = null;
let dashboardClients: any[] = [];

let lastCommand = "NONE";

function broadcastToDashboards(data: any) {
  dashboardClients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (err) {
      console.log("Invalid JSON");
      return;
    }

    if (msg.type === "identify" && msg.client === "esp") {
      espClient = ws;
      console.log("ESP-01 connected");

      broadcastToDashboards({ type: "status", espOnline: true });

      if (lastCommand !== "NONE" && espClient.readyState === 1) {
        espClient.send(JSON.stringify({ type: "cmd", command: lastCommand }));
        console.log("Resent last command to ESP:", lastCommand);
      }
      return;
    }

    if (msg.type === "identify" && msg.client === "dashboard") {
      dashboardClients.push(ws);
      console.log("Dashboard connected");

      ws.send(
        JSON.stringify({ type: "status", espOnline: espClient !== null })
      );
      return;
    }

    if (msg.type === "sensor") {
      console.log("Sensor Data:", msg.data);
      broadcastToDashboards({ type: "sensor", data: msg.data });
      return;
    }

    if (msg.type === "cmd") {
      lastCommand = msg.command;
      console.log("Dashboard Command:", lastCommand);

      if (espClient && espClient.readyState === 1) {
        espClient.send(JSON.stringify({ type: "cmd", command: lastCommand }));
      }

      broadcastToDashboards({
        type: "status",
        espOnline: espClient !== null,
        mode: lastCommand,
      });
      return;
    }
  });

  ws.on("close", () => {
    if (ws === espClient) {
      console.log("ESP-01 disconnected");
      espClient = null;
      broadcastToDashboards({ type: "status", espOnline: false });
    }

    dashboardClients = dashboardClients.filter((c) => c !== ws);
  });
});
