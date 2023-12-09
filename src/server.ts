import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
//import { Server } from "socket.io";
import WebSocket from 'ws';

import http from 'http';
/* 
import tec from './routes/tec';
import admin from './routes/admin';
import auth from './routes/auth'; */

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true
  })
);

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

const PORT = Number(process.env.PORT);

wss.on('connection', (ws: WebSocket) => {
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
});

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

setInterval(() => {
  http.get('http://192.168.0.13:3333/');
}, 60000); 
// sudo killall -9 node
//process.env.FRONTEND_ORIGIN