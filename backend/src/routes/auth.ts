import express from 'express';
import * as jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const router = express.Router();

const DEMO_EMPLOYEE_USER = process.env.DEMO_EMPLOYEE_USER || 'Admin';
const DEMO_EMPLOYEE_PASS = process.env.DEMO_EMPLOYEE_PASS || '9800x3d';
const DEMO_GUEST_USER = process.env.DEMO_GUEST_USER || 'Customer';
const DEMO_GUEST_PASS = process.env.DEMO_GUEST_PASS || 'Reservation123!';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXP = process.env.JWT_EXP || '1h';

export const loginHandler = (req: express.Request, res: express.Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  // allow either employee demo credentials or guest demo credentials
  if (username === DEMO_EMPLOYEE_USER && password === DEMO_EMPLOYEE_PASS) {
    const token = jwt.sign({ sub: username, role: 'employee' }, JWT_SECRET as any, { expiresIn: TOKEN_EXP } as any);
    return res.json({ token, role: 'employee' });
  }
  if (username === DEMO_GUEST_USER && password === DEMO_GUEST_PASS) {
    const token = jwt.sign({ sub: username, role: 'guest' }, JWT_SECRET as any, { expiresIn: TOKEN_EXP } as any);
    return res.json({ token, role: 'guest' });
  }
  logger.warn('Failed login attempt', { username });
  return res.status(401).json({ error: 'invalid credentials' });
};

router.post('/login', express.json(), loginHandler);

export default router;
