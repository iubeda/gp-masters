import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();  // Get token for cross-domain auth
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
        // Use in-memory token for cross-domain, or fetch fresh socket token as fallback
        if (token) {
          // Use existing auth token for WebSocket connection
          cb({ token });
        } else {
          // Fallback: fetch temporary socket token (for cookie-based auth in Docker)
          try {
            const response = await fetch(`${socketUrl}/api/auth/socket-token`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const { socketToken } = await response.json();
              cb({ token: socketToken });
            } else {
              // If fails, try with null (will use cookies if available)
              cb({ token: null });
            }
          } catch (err) {
            console.warn('Could not fetch socket token, falling back to cookies:', err);
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
