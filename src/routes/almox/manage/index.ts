import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken'

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../config/database';

import routerHistoric from './historic';
import routesPickMaterial from './pick-material';

import { z, ZodError } from 'zod';

const router = express.Router();
const executionStatus: Map<string, boolean> = new Map();

router.post('/manage', async (req: Request, res: Response) => {
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

    jwt.verify(token, JWT_SECRET_KEY, async (error) => {
        if (error) {
            if (error instanceof TokenExpiredError) {
                console.log('** verify token expired **')
                return res.status(403).json({ error: 'Token expirado' });
            } else {
                console.log('** verify token inválido **')
                return res.status(403).json({ error: 'Token inválido' });
            }
        }

        const sql = `
        SELECT 
          id, 
          role, 
          name,
          status, 
          identification, 
          created_at
        FROM tbl_user_accounts 
        WHERE role <> ? AND role <> ? AND role <> ? ORDER BY created_at DESC`;
        
        const rows = await executeQuery(sql, ['admin', 'almox', 'cop']);        
        res.json(rows);
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: error.errors });
    } else {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  } finally {
    executionStatus.set(ip, false);
  }
});

router.use(routerHistoric);
router.use(routesPickMaterial);

export default router;