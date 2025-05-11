
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fetch from 'node-fetch';

interface CryptoPriceResponse {
  bitcoin: {
    usd: number;
    last_updated_at: number;
  };
}

export const cryptoTool = createTool({
  id: 'get-bitcoin-price',
  description: 'Get current Bitcoin price in USD',
  inputSchema: z.object({
    currency: z.string().optional().default('usd').describe('Currency for price (default: USD)'),
  }),
  outputSchema: z.object({
    price: z.number(),
    currency: z.string(),
    lastUpdated: z.string(),
  }),
  execute: async ({ context }) => {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        const result = await getBitcoinPrice(context.currency);
        console.log(`[cryptoTool] Successfully fetched Bitcoin price: ${JSON.stringify(result)}`);
        return result;
      } catch (error) {
        attempt++;
        lastError = error as Error;
        console.error(`[cryptoTool] Attempt ${attempt} failed: ${error as Error}`, { stack: (error as Error).stack });
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          console.log(`[cryptoTool] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[cryptoTool] Failed to fetch Bitcoin price after ${maxRetries} attempts: ${lastError?.message}`);
    throw new Error(`Failed to fetch Bitcoin price: ${lastError?.message}`);
  },
});

const getBitcoinPrice = async (currency: string = 'usd') => {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}&include_last_updated_at=true`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }

    const data = (await response.json()) as CryptoPriceResponse;

    if (!data.bitcoin) {
      throw new Error('No Bitcoin data returned from API');
    }

    return {
      price: data.bitcoin.usd,
      currency: currency.toUpperCase(),
      lastUpdated: new Date(data.bitcoin.last_updated_at * 1000).toISOString(),
    };
  } catch (error) {
    throw new Error(`Fetch failed: ${(error as Error).message}`);
  }
};