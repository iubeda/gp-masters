// =============================================================================
// socket.service.js — Servicio de WebSockets
// Maneja las conexiones en tiempo real de los clientes.
// =============================================================================

let io;

/**
 * Inicializa Socket.IO con el servidor HTTP
 * @param {import('http').Server} server 
 */
const initSocket = (server) => {
  const { Server } = require('socket.io');
  
  io = new Server(server, {
    cors: {
      origin: '*', // En producción esto debería restringirse a la URL del frontend
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Nuevo cliente conectado: ${socket.id}`);

    // Permitir a un cliente unirse a una sala específica de un Gran Premio
    socket.on('join-gp-room', ({ championshipId, circuitId }) => {
      const roomName = `gp:${championshipId}:${circuitId}`;
      socket.join(roomName);
      console.log(`[Socket] Cliente ${socket.id} se unió a ${roomName}`);
    });

    socket.on('leave-gp-room', ({ championshipId, circuitId }) => {
      const roomName = `gp:${championshipId}:${circuitId}`;
      socket.leave(roomName);
      console.log(`[Socket] Cliente ${socket.id} abandonó ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });
  });
};

/**
 * Emite un evento a una sala específica de un Gran Premio
 * @param {string|number} championshipId 
 * @param {string|number} circuitId 
 * @param {string} event 
 * @param {any} data 
 */
const emitToGP = (championshipId, circuitId, event, data) => {
  if (!io) return;
  const roomName = `gp:${championshipId}:${circuitId}`;
  io.to(roomName).emit(event, data);
};

module.exports = {
  initSocket,
  emitToGP,
  getIO: () => io
};
