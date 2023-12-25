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

const frontendOriginBaseURL = process.env.FRONTEND_ORIGIN_BASEURL;

// Middleware
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

// Routes
app.use('/api/tec', tec);
app.use('/api/admin', admin);
app.use('/api/auth', auth);

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).send('Ocorreu um erro interno.');
});

const PORT = Number(process.env.PORT);

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
