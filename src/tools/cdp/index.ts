import { CdpTool } from "@coinbase/cdp-langchain";
import { CdpAction, CdpActionSchemaAny, CdpAgentkit } from "@coinbase/cdp-agentkit-core";

import { ApprovalAction } from "./approvals";
import { MorphoInvestAction } from "./morpho-invest";
import { AaveInvestAction } from "./aave-invest";
import { MoonwellInvestAction } from "./moonwell-invest";

const CDP_ACTIONS: CdpAction<CdpActionSchemaAny>[] = [
  new ApprovalAction(),
  new MorphoInvestAction(),
  new AaveInvestAction(),
  new MoonwellInvestAction(),
];

export const buildCustomCdpTools = (agentKit: CdpAgentkit) => {
  return CDP_ACTIONS.map((action) => new CdpTool(action, agentKit));
};
