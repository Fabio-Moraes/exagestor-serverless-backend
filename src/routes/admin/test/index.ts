import express, { Request, Response } from 'express';

const router = express.Router();

let count = 0;

const executionStatus: Map<string, boolean> = new Map();

router.post('/test', async (req: Request, res: Response) => {
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
        count += 1;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        executionStatus.set(ip, false);
        res.json(count);
    } catch (error) {
      executionStatus.set(ip, false);
        console.log(error);
    }
});

export default router;
