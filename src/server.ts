import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';

import tec from './routes/tec';
import admin from './routes/admin';
import superadmin from './routes/superadmin';
import config from './routes/config';
import cop from './routes/cop';
import auth from './routes/auth';
import almox from './routes/almox';

import { websocket } from './config/websocket';
import { Socket } from 'socket.io-client';

dotenv.config();

const app = express();
const server = http.createServer(app);
const frontendOriginBaseURL = process.env.FRONTEND_ORIGIN_BASEURL;

app.use(cookieParser());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', frontendOriginBaseURL);
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use(cors({
  origin: frontendOriginBaseURL,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

app.use('/api/tec', tec);
app.use('/api/admin', admin);
app.use('/api/superadmin', superadmin);
app.use('/api/config', config);
app.use('/api/cop', cop);
app.use('/api/auth', auth);
app.use('/api/almox', almox);

app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).send('An internal error has occurred.');
});

const PORT = Number(process.env.PORT);
const ASCIIART = `%c 
       ######   ########   ########   ######
     ######       ########  #####       ######
  ######           ########  ##            ######
######               ########                ######
######                ########               ######
  ######            ##  ########           ######
     ######       #####  ########       ######
       ######   ########   ########   ######`;

server.listen(PORT, () => {
  console.log(ASCIIART, 'color: #bada55');
  console.log(`Server running at port: ${PORT} | pid: ${process.pid} \n`);
});

const onShutdown = async () => {
  console.log('The server is shutting down...');
  try {
    const socket = await websocket('') as Socket;

    await new Promise<void>((resolve, reject) => {
      socket.emit('SERVER_SHUTDOWN', {}, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    console.log('Event emitted successfully.');
  } catch (error) {
    console.error('Error during shutdown:', error);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', async () => {
  onShutdown();
});

process.on('SIGTERM', async () => {
  onShutdown();
});

