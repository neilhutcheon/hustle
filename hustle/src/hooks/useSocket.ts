import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room } from '../types/game';

export const useSocket = (url: string, onPlayerJoined?: (room: Room) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onPlayerJoinedRef = useRef(onPlayerJoined);

  // Update the ref when onPlayerJoined changes
  useEffect(() => {
    onPlayerJoinedRef.current = onPlayerJoined;
  }, [onPlayerJoined]);

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      console.log('Creating new socket connection to:', url);
      socketRef.current = io(url, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socketRef.current.on('playerJoined', (data: { room: Room }) => {
        console.log('Received playerJoined event:', data);
        onPlayerJoinedRef.current?.(data.room);
      });
    }

    return () => {
      // Only disconnect if the component is unmounting
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.off('playerJoined');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [url]); // Only depend on url

  return { socket: socketRef.current, isConnected };
}; 