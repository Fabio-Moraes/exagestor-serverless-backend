import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import type { Decoded } from '../../../../../types/jwt';

import { getAuthenticationHash } from '../../../../../functions';
import { executeQuery } from '../../../../../config/database';

import { z, ZodError } from 'zod';

import routesAddressApi from './address-api';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

router.post('/running/construction/class-f', async (req: Request, res: Response) => {
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
    const paramsSchema = z.object({ token: z.string(), protocol: z.string().max(17)});
    const { token, protocol } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

    try {
      const { user } = decoded as Decoded;

      /* const sqlOperationsCable = `
      SELECT u1.*,
      tec_user.name AS name_tec, 
      cable_catalog.description
      FROM tbl_cable_operations u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id
      JOIN tbl_cable_catalog cable_catalog ON u1.cable_id = cable_catalog.id
      WHERE u1.protocol = ?
      ORDER BY u1.created_at DESC`; */

      const sqlSelectedDgoandbox = `
      SELECT * FROM tbl_operations WHERE protocol = ?`;

      const sqlCatalogDgoandbox = `
      SELECT * FROM tbl_dgoandbox_catalog`;

      const sqlSharedPassword = `
      SELECT u1.* FROM tbl_shared_service_operations u1
      WHERE EXISTS (
      SELECT 1
          FROM tbl_operations p
          WHERE p.protocol = u1.protocol AND p.employee_id = ?
      ) AND protocol = ?`;

      const currentSelectedDgoandbox = await executeQuery(sqlSelectedDgoandbox, [protocol]);
      const currentCatalogDgoandbox = await executeQuery(sqlCatalogDgoandbox);
      const currentSharedPassword = await executeQuery(sqlSharedPassword, [user.id, protocol]);

      const data = {
        selectedDgoandbox: currentSelectedDgoandbox, 
        catalogDgoandbox: currentCatalogDgoandbox,
        sharedPassword: currentSharedPassword
      };

      res.json(data);
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

router.use(routesAddressApi);

export default router;