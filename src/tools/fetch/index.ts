import { DynamicTool } from "@langchain/core/tools";

import { morphoVaultsFetchTool } from "./morpho";
import { aaveReserveFetchTool } from "./aave";
import { moonwellMarketFetchTool } from "./moonwell";

export const fetchTools: DynamicTool[] = [
  morphoVaultsFetchTool,
  aaveReserveFetchTool,
  moonwellMarketFetchTool,
];
