import { loadConfig } from './config.js';
import { createApp } from './app.js';
import { startCleanupTimer } from './cleanup/expiredJobs.js';

const config = loadConfig();
const { app, repository } = await createApp(config);
startCleanupTimer(repository);

await app.listen({ host: config.HOST, port: config.PORT });
console.log(`Local OMR API listening at http://${config.HOST}:${config.PORT}`);
