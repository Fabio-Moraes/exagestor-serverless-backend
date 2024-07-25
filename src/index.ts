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
  res.status(500).send('Ocorreu um erro interno.');
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

