import { tool } from "@langchain/core/tools";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client/core";

import { mulDiv } from "../../utils/math";

const AAVE_RESERVE_FETCH_PROMPT = `
  This tool fetches the details for USDC reserve in Aave protocol. Users invest their funds in these vaults.
  Details include:
  - Liquidity Rate: The interest rate paid to liquidity providers, based on the reserve's utilization rate and supply-demand dynamics. It grows as more liquidity is borrowed. Provided as a percentage value.
  - Available Liquidity: The amount of liquidity still available for borrowing in a reserve, calculated as total liquidity minus the total borrowed funds.
  - Total Liquidity: The total amount of assets supplied to a reserve, available for lending and determined by the deposits minus borrowed amounts.
  - Utilization Rate: The ratio of borrowed funds to total liquidity in a reserve, influencing both liquidity and borrowing rates. Provided as a percentage value.
  - Reserve Factor: The portion of interest paid by borrowers allocated to the protocol's treasury, helping sustain the Aave ecosystem.
`;

const client = new ApolloClient({
  uri: `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF`,
  cache: new InMemoryCache(),
});

const GET_RESERVE_QUERY = gql`
  {
    reserves(where: { symbol: "USDC" }) {
      symbol
      liquidityRate
      availableLiquidity
      totalLiquidity
      utilizationRate
      reserveFactor
    }
  }
`;

const fetchAaveReserve = async () => {
  const result = await client.query({ query: GET_RESERVE_QUERY });
  return JSON.stringify({
    liquidityRat: mulDiv(result.data.reserves[0].liquidityRate, 10 ** 27, 100),
    availableLiquidity: mulDiv(result.data.reserves[0].availableLiquidity, 1, 1e6),
    totalLiquidity: mulDiv(result.data.reserves[0].totalLiquidity, 1, 1e6),
    utilizationRate: (parseFloat(result.data.reserves[0].utilizationRate) * 100).toString(),
    reserveFactor: result.data.reserves[0].reserveFactor,
  });
};

export const aaveReserveFetchTool = tool(fetchAaveReserve, {
  name: "aave_reserve_fetch",
  description: AAVE_RESERVE_FETCH_PROMPT,
});
