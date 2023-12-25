import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';

const router = express.Router();

router.get('/account', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      console.error('Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET_KEY, async (error: any) => {
      if (error) {
        if (error instanceof TokenExpiredError) {
          console.log('** verify token expired **')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('** verify token inválido **')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

      const decodedToken = jwt.decode(token) as { myValue: string }; 

      res.json(decodedToken);
    });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
