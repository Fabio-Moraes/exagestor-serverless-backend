import cors from 'cors';
import dotenv from 'dotenv';
import express, {  Request, Response } from 'express';
import http from 'http';

import employee from './routes/employee';
import admin from './routes/admin';
import auth from './routes/auth';

dotenv.config();

const app = express();
const serverHttp = http.createServer(app);

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN, 
    methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true
  })
);

app.use(express.json());
app.use('/api/employee', employee);
app.use('/api/admin', admin);
app.use('/api/auth', auth);

app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).send('Ocorreu um erro interno.');
});

const PORT = Number(process.env.PORT);

serverHttp.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

// sudo killall -9 node