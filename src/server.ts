// src/server.ts

import * as dotenv from 'dotenv';

// Chargement des variables d’environnement AVANT tout le reste
dotenv.config();

import app from './app';

/**
 * Point d’entrée du microservice Identity Service.
 * - Charge l'environnement
 * - Démarre Fastify
 */

const startServer = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    console.log(`Identity Service running on ${host}:${port}`);
  } catch (error) {
    console.error('Failed to start Identity Service');
    console.error(error);
    process.exit(1);
  }
};

startServer();
