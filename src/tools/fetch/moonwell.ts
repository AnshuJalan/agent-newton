import { tool } from "@langchain/core/tools";
import { createMoonwellClient } from "@moonwell-fi/moonwell-sdk";

const MOONWELL_MARKETS_FETCH_PROMPT = `
  This tools fetches the details of the USDC market in Moonwell finance protocol.
  Details include:
  - Total supply of USDC
  - Total borrows of USDC
  - Base supply APY: The APY that the user gets on their investment.
  - Reserve factor: The portion of interest paid by borrowers allocated to the protocol reserve.
`;

const moonwellClient = createMoonwellClient({
  networks: {
    base: {
      rpcUrls: [process.env.BASE_RPC_URL as string],
    },
  },
});

const fetchMoonwellMarket = async () => {
  const result = await moonwellClient.getMarket({
    // @ts-ignore
    marketAddress: process.env.BASE_MOONWELL_USDC_MARKET_ADDRESS as string,
    chainId: parseInt(process.env.CHAIN_ID as string, 10),
  });

  return JSON.stringify({
    marketAddress: process.env.BASE_MOONWELL_USDC_MARKET_ADDRESS as string,
    supplyUSD: result?.totalSupplyUsd,
    borrowsUSD: result?.totalBorrowsUsd,
    apy: result?.baseSupplyApy,
    reserveFactor: result?.reserveFactor,
  });
};

export const moonwellMarketFetchTool = tool(fetchMoonwellMarket, {
  name: "moonwell_market_fetch",
  description: MOONWELL_MARKETS_FETCH_PROMPT,
});
