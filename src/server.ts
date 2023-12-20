import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';

import http from 'http';
 
import tec from './routes/tec';
import admin from './routes/admin';
import auth from './routes/auth';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN_BASEURL,
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());
app.use('/api/tec', tec);
app.use('/api/admin', admin);
app.use('/api/auth', auth);

app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).send('Ocorreu um erro interno.');
});

const PORT = Number(process.env.PORT);

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

// sudo killall -9 node