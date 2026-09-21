import { buildApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

const app = buildApp();

async function start() {
  try {
    await app.listen({ port, host });
    console.log(`Homie API Server running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
