import express, { Request, Response } from 'express';
import { z, ZodError } from 'zod';

import { getRedis, setRedis } from '../../config/redis';

const router = express.Router();

const paramsSchema = z.object({
  bussines: z.string().min(1).optional()
});

router.post('/theme', async (req: Request, res: Response) => {
  try {
    const { bussines } = paramsSchema.parse(req.body);

    if (bussines) {
      await setRedis('company', bussines);       
    }

    const company = await getRedis('company');
    res.json(company);

  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: 'Requisição inválida', details: error.errors });
    } else {
      console.error('Erro interno no servidor:', error);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }
});

export default router;