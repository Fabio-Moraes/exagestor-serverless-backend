'use client';
import { io } from 'socket.io-client';

export const socket = io('wss://exa-telecom-websocket.onrender.com/', {
  transports: ['websocket']
});
