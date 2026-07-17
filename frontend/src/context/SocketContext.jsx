import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token, apiFetch } = useAuth();  // Get token and apiFetch for cross-domain auth
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
        // Use in-memory token for cross-domain (production)
        if (token) {
          cb({ token });
        } else {
          // Docker/same-domain: try to fetch socket token with cookies
          try {
            const data = await apiFetch(`${socketUrl}/api/auth/socket-token`);
            cb({ token: data.socketToken });
          } catch (err) {
            console.warn('Could not fetch socket token:', err);
            // Last resort: rely on cookies (Docker only)
            cb({ token: null });
          }
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
  }, [user, token]);  // Add token dependency for cross-domain auth

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
