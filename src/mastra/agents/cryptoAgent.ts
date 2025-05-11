import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { cryptoTool } from '../tools/cryptoTool';
import { memory } from '../memories';

export const cryptoAgent = new Agent({
  name: 'crypto-agent',
  instructions: `
    You are a cryptocurrency assistant specializing in Bitcoin price information.

    Your primary function is to provide accurate and up-to-date Bitcoin prices. When responding:
    - Always provide the price in USD unless another currency is specified
    - Include the timestamp of when the price was last updated
    - If the currency is not supported, inform the user and default to USD
    - Keep responses concise but include price, currency, and last updated time
    - Use the cryptoTool to fetch current Bitcoin price data
  `,
  model: openai('gpt-4o'),
  tools: { cryptoTool },
  memory,
});
