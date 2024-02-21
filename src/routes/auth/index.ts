import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

router.post('/signin', async (req: Request, res: Response) => {
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

    const paramsSchema = z.object({
      identification: z.string().refine(value => {
        const isCnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value);
        const isCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value);
        return isCnpj || isCpf;
    }),
      password: z.string().min(1)
    });

    const { password, identification } = paramsSchema.parse(req.body);
    const sql = `SELECT * FROM exa_users WHERE identification = ?`;
    const rows = await executeQuery(sql, [identification]);
 
    if (rows.length === 0) {
     return res.status(401).send('Credenciais inválidas');
    }

    const content = {
      user: {
        id: rows[0]?.id,
        name: rows[0]?.name,
        role: rows[0]?.role
      }
    }

    if (rows.length === 1 && bcrypt.compareSync(password, rows[0]?.password)) {

      executionStatus.set(ip, false);

      res.json( content );  
      console.log('Login bem-sucedido. Token:');
    } else {
      res.status(401).send('Invalid credentials');
    }

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
