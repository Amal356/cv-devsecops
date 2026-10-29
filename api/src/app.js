import express from 'express';
import healthRouter from './routes/health.js';
import profileRouter from './routes/profile.js';
import projectsRouter from './routes/projects.js';
import skillsRouter from './routes/skills.js';
import contactRouter from './routes/contact.js';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.disable('x-powered-by');
app.set('json spaces', 2);

app.use('/api/health', healthRouter);
app.use('/api/profile', profileRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/contact', contactRouter);

app.use((req, res) => {
  res.status(404).json({ erreur: 'Route introuvable', route: req.originalUrl });
});
app.use(errorHandler);

export default app;
