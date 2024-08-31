import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import type { Decoded } from '../../../types/jwt';

import { getAuthenticationHash } from '../../../functions';
import { executeQuery } from '../../../config/database';

import routesCancel from './cancel';
import routesPause from './pause';
import routesStart from './start';
import routesFinish from './finish';
import routerConstruction from './construction';
import routerConnectShared from './connect-shared';

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

router.post('/running', async (req: Request, res: Response) => {
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
    const paramsSchema = z.object({ token: z.string() });
    const { token } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

    try {
      const { user } = decoded as Decoded;

      const sqlRunningService = `
      SELECT u1.*, tec_user.name AS name_tec, creator_leader_user.name AS name_creator_leader
      FROM tbl_operations u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      WHERE u1.employee_id = ?
      ORDER BY u1.created_at DESC`;

      const sqlRunningServicesShared = `
      SELECT u1.*, tec_user.name AS name_tec, creator_leader_user.name AS name_creator_leader
      FROM tbl_operations u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      WHERE EXISTS (
      SELECT 1
          FROM tbl_shared_service_authorized p
          WHERE p.protocol = u1.protocol AND p.employee_id = ?
      )
      ORDER BY u1.created_at DESC`;

      const rowsRunningService = await executeQuery(sqlRunningService, [user.id]);
      const rowsRunningServiceShared = await executeQuery(sqlRunningServicesShared, [user.id]);

      res.json({runningService: rowsRunningService, runningServiceShared: rowsRunningServiceShared});
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

router.use(routesFinish);
router.use(routesCancel);
router.use(routesPause);
router.use(routesStart);
router.use(routerConstruction);
router.use(routerConnectShared);

export default router;