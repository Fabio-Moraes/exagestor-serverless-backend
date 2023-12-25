import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

export function websocket(token: string) {
  const cookies = new Map<string, string>();
  cookies.set('auth_token', token);

  return io(String(process.env.WEBSOCKET_SERVER_BASEURL), {
    //auth: { token },
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      'Origin': String(process.env.BACKEND_ORIGIN_BASEURL),
      'Cookie': Array.from(cookies.entries()).map(([key, value]) => `${key}=${value}`).join('; ')
    },
  });
}

