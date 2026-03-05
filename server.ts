// server.ts
// Custom Next.js server that adds a WebSocket endpoint.
// WebSocket clients connect to ws://localhost:3001/ws/releases
// and receive live economic release events forwarded from the Kafka consumer.
//
// Run: npx ts-node server.ts   (dev)
//      node dist/server.js     (production)
//
// In docker: CMD ["node", "server.js"]

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";

// Kafka (confluent-kafka-js or kafkajs — using kafkajs for Node compatibility)
// import { Kafka } from "kafkajs";

const dev  = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3001", 10);
const app  = next({ dev });
const handle = app.getRequestHandler();

// Track connected browser clients
const clients = new Set<WebSocket>();

function broadcast(data: string) {
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// ── Mock event generator (used when Kafka is unavailable) ──────────────────────
const MOCK_RELEASES = [
  { source: "BLS",  release_name: "BLS_JOBS_REPORT",    indicator: "nonfarm_payrolls_thousands", market_impact: "HIGH" },
  { source: "FRED", release_name: "FOMC_RATE_DECISION",  indicator: "fed_funds_rate",             market_impact: "HIGH" },
  { source: "BLS",  release_name: "BLS_CPI_DETAIL",      indicator: "cpi_all_urban",              market_impact: "MEDIUM" },
  { source: "BEA",  release_name: "BEA_GDP_ADVANCE",     indicator: "gdp_qoq_pct",               market_impact: "HIGH" },
  { source: "FRED", release_name: "FRED_CPI",            indicator: "cpi_yoy_pct",               market_impact: "MEDIUM" },
  { source: "BLS",  release_name: "BLS_UNEMPLOYMENT",    indicator: "unemployment_rate",          market_impact: "HIGH" },
];

let mockIndex = 0;

function startMockEmitter() {
  // In dev / no-Kafka mode: emit a fake event every 8 seconds
  setInterval(() => {
    if (clients.size === 0) return;

    const template = MOCK_RELEASES[mockIndex % MOCK_RELEASES.length];
    mockIndex++;

    const value       = parseFloat((3 + Math.random() * 3).toFixed(2));
    const prior       = parseFloat((value + (Math.random() - 0.5) * 0.5).toFixed(2));
    const consensus   = parseFloat((value + (Math.random() - 0.5) * 0.3).toFixed(2));
    const surprisePct = parseFloat(((value - consensus) / Math.abs(consensus) * 100).toFixed(2));

    const event = {
      id:              Date.now(),
      ...template,
      period:          new Date().toISOString().slice(0, 7),
      value,
      prior_value:     prior,
      surprise_pct:    surprisePct,
      value_direction: value > prior ? "UP" : value < prior ? "DOWN" : "FLAT",
      is_anomaly:      Math.abs(surprisePct) > 10,
      anomaly_reason:  Math.abs(surprisePct) > 10 ? `Large surprise: ${surprisePct}%` : null,
      processed_ts:    new Date().toISOString(),
    };

    broadcast(JSON.stringify(event));
  }, 8000);
}

// ── Kafka consumer (uncomment when Kafka is running) ──────────────────────────
/*
async function startKafkaConsumer() {
  const kafka = new Kafka({
    clientId: "dashboard-ws-server",
    brokers:  [process.env.KAFKA_BOOTSTRAP_SERVERS ?? "localhost:9092"],
  });

  const consumer = kafka.consumer({ groupId: "dashboard-ws-relay" });
  await consumer.connect();
  await consumer.subscribe({ topic: "econ.releases.enriched", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (message.value && clients.size > 0) {
        broadcast(message.value.toString());
      }
    },
  });

  console.log("Kafka consumer connected → econ.releases.enriched");
}
*/

// ── Start server ───────────────────────────────────────────────────────────────
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // WebSocket server
  const wss = new WebSocketServer({ server, path: "/ws/releases" });

  wss.on("connection", (ws, req) => {
    clients.add(ws);
    console.log(`WS client connected (${clients.size} total) from ${req.socket.remoteAddress}`);

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`WS client disconnected (${clients.size} remaining)`);
    });

    ws.on("error", (err) => {
      console.warn("WS error:", err);
      clients.delete(ws);
    });

    // Send a welcome ping
    ws.send(JSON.stringify({ type: "connected", message: "Econ release feed active" }));
  });

  // Start Kafka or mock emitter
  const useKafka = process.env.KAFKA_BOOTSTRAP_SERVERS && process.env.USE_KAFKA === "true";
  if (useKafka) {
    // startKafkaConsumer().catch(console.error);
  } else {
    console.log("Kafka not configured — using mock event emitter (8s interval)");
    startMockEmitter();
  }

  server.listen(port, () => {
    console.log(`> Next.js + WebSocket server ready on http://localhost:${port}`);
    console.log(`> WebSocket endpoint: ws://localhost:${port}/ws/releases`);
  });
});
