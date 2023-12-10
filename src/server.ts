import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { Server } from "socket.io";
//import WebSocket from 'ws';

import http from 'http';
/* 
import tec from './routes/tec';
import admin from './routes/admin';
import auth from './routes/auth'; */

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT);

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

const io = new Server(server, {
  transports: ['websocket'],
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

//const wss = new WebSocket.Server({ server })

/* app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  })
); */

/* const io = new Server(serverHttp, {
cors: {
  origin: process.env.FRONTEND_ORIGIN,
  methods: ["GET", "POST"],
  credentials: true
},
}); */

/* app.use(express.json());
app.use('/api/tec', tec);
app.use('/api/admin', admin);
app.use('/api/auth', auth);

app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).send('Ocorreu um erro interno.');
});
*/

io.on("connection", (socket) => {
  console.log("A user connected");
  io.emit("ON_USERS", JSON.stringify({ users: 123 }));
  // Listen for incoming messages

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

setInterval(() => {
  http.get('wss://exatelecom-server.vercel.app');
}, 60000);

/* wss.on('connection', (ws: WebSocket) => {
  console.log('Um cliente se conectou.');
  
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        event: 'ON_USERS',
        data: { user: 'Novo usuário entrou.' }
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('Um cliente se desconectou.');
  });
}); */

// sudo killall -9 node
//process.env.FRONTEND_ORIGIN