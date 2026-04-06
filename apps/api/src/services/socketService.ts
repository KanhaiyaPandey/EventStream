import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { env } from "../config/env";
import type { EventDocument, AnalyticsSummary } from "@eventstream/config/types";

let io: SocketServer | null = null;

/**
 * Initialise Socket.io on the given HTTP server.
 * Must be called once during app startup.
 */
export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
    // Prefer WebSocket, fall back to polling
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    console.info(`[WS] Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.info(`[WS] Client disconnected: ${socket.id}`);
    });

    // Allow clients to subscribe to a specific event type filter
    socket.on("subscribe:eventType", (eventType: string) => {
      socket.join(`eventType:${eventType}`);
    });
  });

  return io;
}

/**
 * Get the Socket.io instance (throws if not initialised).
 */
export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialised. Call initSocketServer first.");
  return io;
}

/**
 * Broadcast a newly ingested event to all connected dashboard clients.
 */
export function broadcastNewEvent(event: EventDocument): void {
  if (!io) return;

  // Broadcast to all connected clients
  io.emit("new_event", event);

  // Also broadcast to room subscribers for this event type
  io.to(`eventType:${event.eventType}`).emit("filtered_event", event);
}

/**
 * Broadcast an updated analytics summary (called after each new event).
 */
export function broadcastAnalytics(summary: AnalyticsSummary): void {
  if (!io) return;
  io.emit("analytics_update", summary);
}

/**
 * Return current number of connected clients.
 */
export function getConnectedClients(): number {
  return io?.engine.clientsCount ?? 0;
}
