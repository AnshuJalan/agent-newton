import { tool } from "@langchain/core/tools";
import { typePolicies } from "@morpho-org/blue-api-sdk";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client/core";

const MORPHO_VAULTS_FETCH_PROMPT =
  "This tool fetches a list of USDC vaults in morpho defi protocol. Users invest their funds in these vaults. Details include general vault details, aggregated daily and weekly APYs, current APY, total assets in the vault and fees. APYs are returned as a factor between 0 and 1 that need to be mutlipied by 100 to get percentage.";

const client = new ApolloClient({
  uri: process.env.MORPHO_GRAPHQL_API_URL,
  cache: new InMemoryCache({ typePolicies }),
});

const GET_VAULTS = gql`
  query GetVaults($chainId: Int!, $assetAddress: String!) {
    vaults(where: { whitelisted: true, chainId_in: [$chainId], assetAddress_in: [$assetAddress] }) {
      items {
        address
        symbol
        name
        weeklyApys {
          apy
        }
        dailyApys {
          apy
        }
        state {
          id
          apy
          totalAssets
          totalAssetsUsd
          fee
        }
      }
    }
  }
`;

const fetchMorphoVaults = async () => {
  try {
    const result = await client.query({
      query: GET_VAULTS,
      variables: {
        chainId: parseInt(process.env.CHAIN_ID as string, 10),
        assetAddress: process.env.BASE_USDC_ADDRESS,
      },
    });
    return JSON.stringify(
      result.data.vaults.items.map((vault: any) => {
        return {
          ...vault,
          state: { ...vault.state, totalAssets: vault.state.totalAssets.toString() },
        };
      })
    );
  } catch (err: any) {
    console.error(err);
    return "Error: fetch failed.";
  }
};

export const morphoVaultsFetchTool = tool(fetchMorphoVaults, {
  name: "morpho_vaults_fetch",
  description: MORPHO_VAULTS_FETCH_PROMPT,
});
