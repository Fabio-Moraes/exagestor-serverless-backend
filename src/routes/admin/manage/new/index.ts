import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../../types/jwt'

import { createProtocol } from '../../../../components/CreateProtocol';
import { JWT_SECRET_KEY } from '../../../../constants';
import { executeQuery, executeTransaction } from '../../../../database';

import { executeWebsocket } from '../../../../functions/websocket/RUNNING-UPDATE';

import { z, ZodError } from 'zod';

const router = express.Router();

const paramsSchema = z.object({
  employeeId: z.number().min(1),
  clientName: z.string().min(1).regex(/^[^0-9]*$/),
  city: z.string().min(1).regex(/^[^0-9]*$/),
  classification: z.string().min(1).max(2),
  nomenclature: z.string().min(1),
  address: z.string().min(1),
  token: z.string()
});

function getCurrentDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const executionStatus: Map<string, boolean> = new Map();

router.post('/manage/new', async (req: Request, res: Response) => {
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
      classification,
      nomenclature,
      address,
      token
    } = paramsSchema.parse(req.body);

    jwt.verify(token, JWT_SECRET_KEY, async (error, decoded) => {
      if (error) {
        if (error instanceof TokenExpiredError) {
          console.log('** verify token expired **')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('** verify token inválido **')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

      const createdAt = getCurrentDateTime();
      const protocol = createProtocol(17);
      const status = 'active';
      const updateCount = 0

      const { user: admin } = decoded as Decoded;

      const values = [
        protocol,
        employeeId,
        admin.id,   
        clientName,
        city,
        classification,
        nomenclature,
        address,
        status,
        updateCount,
        null,
        null,
        null,
        createdAt,
        null,
        null,
      ];

      const queryOperations =  `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          admin_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

      const queryOperationsHistory =  `
      INSERT INTO tbl_operations_logs (
          protocol, 
          employee_id, 
          admin_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

      await executeTransaction([
        { query: queryOperations, values: values },
        { query: queryOperationsHistory, values: values }
      ]);
      
      res.json({ success: true });

      await executeWebsocket({ token, employee_id: String(employeeId) });
      executionStatus.set(ip, false);    
    });
  } catch (error) {
    executionStatus.set(ip, false);

    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: error.errors });
    } else {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

export default router;