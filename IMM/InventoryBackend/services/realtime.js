let io = null;
let SocketServer = null;

const getSocketServer = () => {
  if (SocketServer) return SocketServer;

  try {
    ({ Server: SocketServer } = require("socket.io"));
  } catch (error) {
    throw new Error("Missing backend dependency 'socket.io'. Run npm install in IMM/InventoryBackend.");
  }

  return SocketServer;
};

const getAllowedOrigins = () => {
  const rawOrigins = process.env.ALLOWED_ORIGINS;
  if (!rawOrigins) return "*";

  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : "*";
};

const initializeWebSocket = (httpServer) => {
  if (io) return io;

  const Server = getSocketServer();

  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const emitSocketEvent = (channel, event, data = {}) => {
  if (!io) return;

  io.emit(`${channel}:${event}`, {
    ...data,
    event,
    timestamp: new Date().toISOString(),
  });
};

const emitInventoryUpdate = (event, data = {}) => {
  emitSocketEvent("inventory", event, data);
};

const emitNotificationUpdate = (event, data = {}) => {
  emitSocketEvent("notification", event, data);
};

module.exports = {
  initializeWebSocket,
  emitInventoryUpdate,
  emitNotificationUpdate,
};
