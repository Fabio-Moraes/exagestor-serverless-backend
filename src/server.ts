import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';

import routesAuthenticate from './routes/authenticate';
import routesHistoricService from './routes/historic';
import routesDetailsService from './routes/historic/details';
import routesNewService from './routes/new';
import routesRunningService from './routes/running';
import routesCancelService from './routes/running/cancel';
import routesConcludedService from './routes/running/finish/concluded';
import routesSelectMaterial from './routes/running/finish/select-material';
import routesSelectService from './routes/running/finish/select-service';
import routesPauseService from './routes/running/pause';
import routesStartService from './routes/running/start';

dotenv.config();

const app = express();
const serverHttp = http.createServer(app);

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN, 
    methods: 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true
  })
);

app.use(express.json());

// Rotas
app.use('/api/auth', routesAuthenticate);
app.use('/api/services', routesHistoricService);
app.use('/api/services', routesDetailsService);
app.use('/api/services', routesNewService);
app.use('/api/services', routesRunningService);
app.use('/api/services', routesSelectService);
app.use('/api/services', routesSelectMaterial);
app.use('/api/services', routesConcludedService);
app.use('/api/services', routesPauseService);
app.use('/api/services', routesStartService);
app.use('/api/services', routesCancelService);

// Middleware de tratamento de erros global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Ocorreu um erro interno.');
});

// Definição das variáveis de porta e host
const PORT = Number(process.env.PORT);

// Inicialização do servidor HTTP e configuração das respostas
serverHttp.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

// sudo killall -9 node