import { Socket } from "socket.io";

export function EventWebSocket(socket: Socket) {
  console.log(`Socket ${socket.id} connected.`);
}