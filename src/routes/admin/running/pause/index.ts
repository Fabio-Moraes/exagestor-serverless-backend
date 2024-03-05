import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { update_state_modification } from '../../../../models/operations'
import { insert_state_modification } from '../../../../models/operation_logs'
import { executeWebsocket } from '../../../../controllers/websocket/running_update';
import { executeQuery, executeTransaction } from '../../../../config/database';
import { JWT_SECRET_KEY } from '../../../../constants';
import { z, ZodError } from 'zod';

interface ServiceData {
  id: number;
  client_name: string;
  employee_id: string;
  admin_id: string;
  city: string;
  address: string;
  nomenclature: string;
  classification: string;
  status: string;
  update_count: number;
  created_at: string;
  modification_at: string;
  finished_at: string;
  list_material: string;
  list_service: string;
  observation: string;
  protocol: string;
}

const paramsSchema = z.object({
  token: z.string(),
  employeeId: z.string().min(1),
  protocol: z.string().max(17)
});

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();
router.post('/running/pause', async (req: Request, res: Response) => {
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

    jwt.verify(token, JWT_SECRET_KEY, async (error) => {
      if (error) {
        executionStatus.set(ip, false);
        if (error instanceof TokenExpiredError) {
          console.log('Token expirado')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('Token inválido')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

      const selectSql = 'SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?';
      const [row]: ServiceData[] = await executeQuery(selectSql, [employeeId, protocol, 'active']);

      if (!row) {
        return res.status(400).json({ error: 'Requisição inválido' });
      }

      const newStatus = 'paused';
      const updateStateModificationService = await update_state_modification({ row, newStatus })
      const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus })

      await executeTransaction([
        { ...updateStateModificationService },
        { ...createStateModificationHistoryRecord }
      ]);

      await executeWebsocket({ token, employee_id: row.employee_id });
      res.json({ success: true })
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