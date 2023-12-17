import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../constants';

import { z, ZodError } from 'zod';

const router = express.Router();

router.post('/ping', async (req: Request, res: Response) => {
  try {
    console.log('ping-ping');

    /*     const paramsSchema = z.object({
          token: z.string()
        });
    
        const {
          token
        } = paramsSchema.parse(req.body);
    
        if (!token) {
          console.error('Token não fornecido');
          return res.status(401).json({ error: 'Token não fornecido' });
        }
    
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
    
          res.json({ status: 'success' });
          console.log('Ping com sucesso!');
        }); */
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
