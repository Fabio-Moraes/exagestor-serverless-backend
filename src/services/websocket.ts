import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

export function websocket(token: string) {
  return io(String(process.env.WEBSOCKET_SERVER_BASEURL), {
    auth: { token },
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      'Origin': String(process.env.BACKEND_ORIGIN_BASEURL),
    },
  });
}

