import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeQuery } from '../../../../../config/database';
import { z, ZodError } from 'zod';

const router = express.Router();

const paramsSchema = z.object({
  token: z.string().min(1),
  employeeId: z.string().min(1),
  protocol: z.string().max(17)
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/running/finish/select-service', async (req: Request, res: Response) => {
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
    const { token, employeeId, protocol } = paramsSchema.parse(req.body);

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

      const status = 'finished';
      const sql1 = 'SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status <> ?'; 
      const sql2 = 'SELECT * FROM tbl_service_catalog'; 

      const currentOperation = await executeQuery(sql1, [employeeId, protocol, status]);
      const serviceList = await executeQuery(sql2);

      res.json({currentOperation, serviceList});
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

export default router;