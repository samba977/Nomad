// SocketContext.js - Fully Fixed
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userId = user?._id || user?.id || (
      localStorage.getItem('travelmateUser') &&
      JSON.parse(localStorage.getItem('travelmateUser')).id
    );

    if (userId) {
      const newSocket = io('http://localhost:5000', {
        query: { userId },
        transports: ['websocket'],
        withCredentials: true
      });

      setSocket(newSocket);
      console.log('✅ Socket connected with userId:', userId);

      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
      });

      return () => {
        newSocket.disconnect();
        console.log('🛑 Socket disconnected');
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
