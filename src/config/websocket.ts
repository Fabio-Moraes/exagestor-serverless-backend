import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

export function websocket(token: string) {
  const cookies = new Map<string, string>();
  cookies.set('auth_token', token);

  const socket = io(String(process.env.WEBSOCKET_SERVER_BASEURL), {
    transports: ['websocket'],
    withCredentials: true,
    reconnection: true, // Ativar reconexão automática
    reconnectionAttempts: 5, // Número máximo de tentativas de reconexão
    reconnectionDelay: 1000, // Atraso inicial de reconexão em milissegundos
    reconnectionDelayMax: 5000, // Atraso máximo de reconexão em milissegundos
    extraHeaders: {
      'Origin': String(process.env.BACKEND_ORIGIN_BASEURL),
      'Cookie': Array.from(cookies.entries()).map(([key, value]) => `${key}=${value}`).join('; ')
    },
  });

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      reject(error);
    });
  });
}