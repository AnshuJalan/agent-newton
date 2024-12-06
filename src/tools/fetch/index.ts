import { DynamicTool } from "@langchain/core/tools";

import { morphoVaultsFetchTool } from "./morpho";
import { aaveReserveFetchTool } from "./aave";

export const fetchTools: DynamicTool[] = [morphoVaultsFetchTool, aaveReserveFetchTool];
