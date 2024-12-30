import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import type { Decoded } from '../../../../../../types/jwt';

import { getAuthenticationHash } from '../../../../../../functions';
import { executeTransaction /* executeQuery */ } from '../../../../../../config/database';


import routesCheckDgoenboxExistence from './check-dgoenbox-existence';

import { z, ZodError } from 'zod';
//import { websocket } from '../../../../../../config/websocket';
//import { Socket } from 'socket.io-client';

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
  token: z.string(),
  protocol: z.string().max(17),
  latitude: z.string(),
  longitude: z.string(),
  address: z.string().min(1),
  dgoandbox_name: z.string(),
  dgoandbox_id: z.number(),
  node_name: z.string().min(1),
  observation: z.string().min(1)
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/running/construction/class-f/finished-dgoandbox', async (req: Request, res: Response) => {
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
      token,
      protocol,
      latitude,
      longitude,
      address,
      dgoandbox_name,
      dgoandbox_id,
      node_name,
      observation
    } = paramsSchema.parse(req.body);

    console.log('WWWWWWWWW', dgoandbox_name, dgoandbox_id, protocol);

    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

        try {
          const createdAt = getCurrentDateTime();
/* 
          const selectSql = 'SELECT * FROM tbl_dgoandbox_operations WHERE dgoandbox_name = ? AND protocol = ?';
          const [existing] = await executeQuery(selectSql, [dgoandbox_name, protocol]);

          if (!existing) { 
            resolve(true);
            return res.status(400).json({ error: 'Requisição inválido' }); 
          }
 */
          const { user: employee } = decoded as Decoded;

          const valuesDgoandboxOperations = [
            latitude,
            longitude,
            node_name,
            address,
            observation,
            createdAt,
            dgoandbox_name,
            dgoandbox_id,
            protocol
          ];

          const valuesDgoandboxOperationsLogs = [
            protocol,
            employee.id,      
            dgoandbox_id,
            dgoandbox_name,
            latitude,
            longitude,
            node_name,
            address,
            observation,
            createdAt
          ];

          const queryDgoandboxOperations = `
      UPDATE tbl_dgoandbox_operations 
      SET 
        latitude = ?, 
        longitude = ?, 
        node_name = ?, 
        address = ?, 
        observation = ?, 
        created_at = ?
      WHERE 
        dgoandbox_name = ?
        AND dgoandbox_id = ?
        AND protocol = ?;
    `;

          const queryDgoandboxOperationsLogs = `
      INSERT INTO tbl_dgoandbox_operations_logs (
          protocol, 
          employee_id,
          dgoandbox_id,
          dgoandbox_name,
          latitude,
          longitude,
          node_name,
          address,
          observation, 
          created_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

      await executeTransaction([
            { query: queryDgoandboxOperations, values: valuesDgoandboxOperations },
            { query: queryDgoandboxOperationsLogs, values: valuesDgoandboxOperationsLogs }
          ]);

          //const socket = await websocket(token) as Socket;
          //socket.emit('RUNNING_REFRESH', JSON.stringify({ employee_id: String(employee.id) }));
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

router.use(routesCheckDgoenboxExistence);

export default router;
