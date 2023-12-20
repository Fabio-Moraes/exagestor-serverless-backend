import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import bcrypt from 'bcryptjs';
import { JWT_SECRET_KEY } from '../../constants';

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

    const contentJwt = {
      user: {
        id: rows[0]?.id,
        name: rows[0]?.name,
        role: rows[0]?.role
      }
    }

    if (rows.length === 1 && bcrypt.compareSync(password, rows[0]?.password)) {
      const token = jwt.sign(contentJwt, JWT_SECRET_KEY, { expiresIn: '7d' });

      res.cookie('auth_token', token, {
        //expires: new Date(Date.now() + 900000),
        httpOnly: true,
        maxAge: 60 * 60 * 1000 * 7, 
        secure: true,
        sameSite: 'none',
      });
      
      console.log('Login bem-sucedido. Token:', token);
      res.json('successfully');
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
