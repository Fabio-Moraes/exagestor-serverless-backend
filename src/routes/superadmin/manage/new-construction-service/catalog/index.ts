import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { getAuthenticationHash } from '../../../../../functions';

import { z, ZodError } from 'zod';
import { executeQuery } from '../../../../../config/database';

const router = express.Router();

const paramsSchema = z.object({
  token: z.string()
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/manage/new-construction-service/cable-catalog', async (req: Request, res: Response) => {
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
          const cableCatalogSql = 'SELECT * FROM tbl_cable_catalog';
          const cableCatalog = await executeQuery(cableCatalogSql);

          const dgoandboxCatalogSql = 'SELECT * FROM tbl_dgoandbox_catalog';
          const dgoandboxCatalog = await executeQuery(dgoandboxCatalogSql);

          res.json({cableCatalog: cableCatalog, dgoandboxCatalog: dgoandboxCatalog});
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

export default router;