// =============================================================================
// socket.service.js — Servicio de WebSockets
// Maneja las conexiones en tiempo real de los clientes.
// =============================================================================

const jwt = require('jsonwebtoken');
const db = require('../config/database');
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

  // Middleware de Autenticación
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Nuevo cliente conectado: ${socket.id} (Usuario: ${socket.user?.email})`);

    // Permitir a un cliente unirse a una sala específica de un Gran Premio
    socket.on('join-gp-room', async ({ championshipId, circuitId }) => {
      try {
        let isAllowed = false;

        // Si es admin, permitir siempre
        if (socket.user.role === 'admin') {
          isAllowed = true;
        } else {
          // Verificar si el usuario pertenece al campeonato
          const checkQuery = `
            SELECT 1 FROM teams 
            WHERE championship_id = $1 AND user_email = $2 AND is_kicked = false
          `;
          const result = await db.query(checkQuery, [championshipId, socket.user.email]);
          if (result.rows.length > 0) {
            isAllowed = true;
          }
        }

        if (!isAllowed) {
          console.warn(`[Socket] Usuario ${socket.user.email} intentó unirse al GP ${championshipId} sin permiso.`);
          socket.emit('error', { message: 'No tienes permiso para ver este Gran Premio.' });
          return;
        }

        const roomName = `gp:${championshipId}:${circuitId}`;
        socket.join(roomName);
        console.log(`[Socket] Cliente ${socket.id} (${socket.user.email}) se unió a ${roomName}`);
      } catch (err) {
        console.error('[Socket] Error al verificar permisos:', err);
      }
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
