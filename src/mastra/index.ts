import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { LibSQLStore } from '@mastra/libsql';

import { frontendInterviewAgent } from './agents/frontendInterviewAgent.js';
import { frontendInterviewWorkflow } from './workflows/frontendInterviewWorkflow.js';

export const mastra = new Mastra({
  workflows: { frontendInterviewWorkflow },
  agents: { frontendInterviewAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
