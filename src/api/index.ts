import { Router } from 'express';
import { apiLimiter } from './middleware.ts';
import { authRouter } from './routes/auth.ts';
import { adminRouter } from './routes/admin.ts';
import { publicRouter } from './routes/public.ts';

export const apiRouter = Router();
apiRouter.use(apiLimiter);
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/public', publicRouter);

// Firebase stubs
const notificationsRouter = Router();
notificationsRouter.post('/subscribe', (req, res) => res.json({ success: true }));
notificationsRouter.post('/unsubscribe', (req, res) => res.json({ success: true }));
apiRouter.use('/notifications', notificationsRouter);
