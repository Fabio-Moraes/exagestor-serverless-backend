import { io } from 'socket.io-client';

export default () =>
  io(String(process.env.WEBSOCKET_SERVER_BASEURL), {
    transports: ['websocket']
  });

//'wss://exa-telecom-websocket.onrender.com'