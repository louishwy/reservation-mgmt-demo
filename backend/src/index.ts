import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { extractUserFromHeader } from './middleware/auth';
import { logger } from './utils/logger';
import authRouter from './routes/auth';
import { errorHandler } from './middleware/errors';
import * as cb from './db';

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  app.use('/graphql', express.json(), (req, _res, next) => {
    (req as any).user = extractUserFromHeader(req.headers.authorization as string | undefined);
    next();
  }, expressMiddleware(server, {
    context: async ({ req }) => ({ user: (req as any).user })
  }));

  // Auth routes (REST)
  app.use('/auth', authRouter);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => res.json({ ready: cb.isConnected() }));

  try {
    await cb.connect();
    logger.info('Database connected');
  } catch (err) {
    logger.error('Failed to connect to database. This application requires the DB to run.', err as any);
    process.exit(1);
  }

  app.use(errorHandler);

  app.listen(4000, () => {
    logger.info('Server running on http://localhost:4000/graphql');
  });
}

startServer();
