import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      auth: async (cb) => {
        // Obtener token fresco en cada conexión/reconexión
        try {
          const response = await fetch(`${socketUrl}/api/auth/socket-token`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const { socketToken } = await response.json();
            cb({ token: socketToken });
          } else {
            // Si falla, intentar sin token (funcionará si cookies están disponibles)
            cb({ token: null });
          }
        } catch (err) {
          console.warn('Could not fetch socket token, falling back to cookies:', err);
          cb({ token: null });
        }
      }
    });

    newSocket.on('connect', () => {
      console.log('🔌 Conectado al servidor de WebSockets');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
