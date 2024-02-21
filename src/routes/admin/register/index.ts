import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

const noNumbers = /^[^0-9]*$/;
const isCnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const isCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

const paramsSchema = z.object({
  name: z.string().min(1).regex(noNumbers),
  identification: z.string().refine(value => isCnpj.test(value) || isCpf.test(value)),
  password: z.string().min(1).trim(),
  accountType: z.enum(['TEC', 'DIR', 'ALMOX', 'COP']),
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

router.post('/register', async (req: Request, res: Response) => {
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
      name,
      identification,
      password,
      accountType,
      token
    } = paramsSchema.parse(req.body);

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

      const createdAt = getCurrentDateTime();
      const hash = bcrypt.hashSync(password, 10)

      const values = [
        name,
        accountType.toLowerCase(),
        '1234',
        identification,
        hash,
        createdAt,
      ];

      const sqlSelect = 'SELECT * FROM exa_users WHERE identification = ?';

      const rows = await executeQuery(sqlSelect, [ identification]);

      if (rows.length > 0) {
        res.json({ status: 'already registered' });
        console.log('Funcionário(a) não registrado!');
        return;
      }

      const sqlInsert = `INSERT INTO exa_users ( name, role, team, identification, password, created_at) VALUES ( ?, ?, ?, ?, ?, ?)`;

      await executeQuery(sqlInsert, values);

      executionStatus.set(ip, false);

      res.json({ status: 'success' });
      console.log('Funcionário(a) registrado com sucesso!');
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