import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

router.post('/signin', async (req: Request, res: Response) => {
  try {
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
    
      res.json( content );  
      console.log('Login bem-sucedido. Token:');
    } else {
      res.status(401).send('Invalid credentials');
    }

  } catch (error) {
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
