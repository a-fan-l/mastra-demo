import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { LibSQLStore } from '@mastra/libsql';

import { frontendInterviewAgent } from './agents/frontendInterviewAgent.js';
import { frontendInterviewWorkflow } from './workflows/frontendInterviewWorkflow.js';
import { codeReviewAgent } from './agents/codeReviewAgent.js';
import { weatherAgent } from './agents/weatherAgent.js';
import { cryptoAgent } from './agents/cryptoAgent.js';

export const mastra = new Mastra({
  workflows: { frontendInterviewWorkflow },
  agents: { frontendInterviewAgent, codeReviewAgent, weatherAgent, cryptoAgent},
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
