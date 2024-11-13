import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import type { Decoded } from '../../../../types/jwt';

import { createProtocol } from '../../../../utils/CreateProtocol';
import { getAuthenticationHash } from '../../../../functions';
import { executeTransaction } from '../../../../config/database';

import { z, ZodError } from 'zod';
import { websocket } from '../../../../config/websocket';
import { Socket } from 'socket.io-client';

import routerCatalog from './catalog';
import routerCreateService from './create-service';

function getCurrentDateTime(date?: string): string {
  const now = date ? new Date(date) : new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const router = express.Router();

const paramsSchema = z.object({
  employeeId: z.number().min(1),
  clientName: z.string().min(1).regex(/^[^0-9]*$/),
  city: z.string().min(1).regex(/^[^0-9]*$/),
  address: z.string().min(1),
  startServiceAt: z.string().refine((dateString) => {
    const currentDate = new Date();
    const inputDate = new Date(dateString);
    currentDate.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= currentDate;
  }, {
    message: 'A data de início do serviço não pode ser anterior à data atual',
  }),
  token: z.string()
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/manage/new-construction-service', async (req: Request, res: Response) => {
  const ip = req.ip;

  if (!ip) {
    console.error('IP não fornecido');
    return res.status(409).json({ error: 'IP não fornecido' });
  }

  if (executionStatus.has(ip) && executionStatus.get(ip) === true) {
    console.error('Já existe uma execução em andamento para este IP');
    return res.status(409).json({ error: 'Já existe uma execução em andamento para este IP' });
  }

  try {
    executionStatus.set(ip, true);

    const {
      employeeId,
      clientName,
      city,
      address,
      startServiceAt,
      token
    } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line 
        if (error) {
          reject(error);
          return;
        }

        try {
      const createdAt = getCurrentDateTime();
      const getStartServiceAt = getCurrentDateTime(startServiceAt);
      const protocol = createProtocol(17);
      const status = 'active';
      const updateCount = 0;

      const { user: admin } = decoded as Decoded;

      const values = [
        protocol,
        employeeId,
        admin.id,   
        clientName,
        city,
        address,
        status,
        updateCount,
        getStartServiceAt,
        null,
        null,
        null,
        createdAt,
        null,
        'TIPO_CONSTRUÇÃO',
        null,
      ];

      const queryOperations =  `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city,
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at,
          type_operation, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

      const queryOperationsHistory =  `
      INSERT INTO tbl_operations_logs (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city,
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at,
          type_operation, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

      const valuesCableSelected = [
        protocol,
        1,
        2000,   
        0,
        createdAt,
        protocol,
        2,
        1300,   
        0,
        createdAt,
        protocol,
        3,
        3167,   
        0,
        createdAt,
        protocol,
        6,
        820,   
        0,
        createdAt
      ];

      const queryCableSelected =  `
      INSERT INTO tbl_cable_selected (
          protocol, 
          cable_id, 
          cable_length_meters, 
          used_length_meters, 
          created_at
      ) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`;

      await executeTransaction([
        { query: queryOperations, values: values },
        { query: queryOperationsHistory, values: values },
        { query: queryCableSelected, values: valuesCableSelected }
      ]);
      
      const socket = await websocket(token) as Socket;
      socket.emit('RUNNING_REFRESH', JSON.stringify({ employee_id: employeeId }));
      res.json({ success: true });
      resolve(true);
        }
        catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.log('Token expirado');
      return res.status(403).json({ error: 'Token expirado' });
    }

    if (error instanceof JsonWebTokenError) {
      console.log('Token inválido');
      return res.status(403).json({ error: 'Token inválido' });
    }

    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: error.errors });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    executionStatus.set(ip, false);
  }
});

router.use(routerCatalog);
router.use(routerCreateService);

export default router;