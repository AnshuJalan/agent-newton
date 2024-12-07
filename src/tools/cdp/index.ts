import { CdpTool } from "@coinbase/cdp-langchain";
import { CdpAction, CdpActionSchemaAny, CdpAgentkit } from "@coinbase/cdp-agentkit-core";

import { ApprovalAction } from "./approvals";
import { MorphoInvestAction } from "./morpho-invest";
import { AaveInvestAction } from "./aave-invest";
import { MoonwellInvestAction } from "./moonwell-invest";
import { MorphoWithdrawAction } from "./morpho-withdraw";
import { MoonwellWithdrawAction } from "./moonwell-withdraw";
import { AaveWithdrawAction } from "./aave-withdraw";

const CDP_ACTIONS: CdpAction<CdpActionSchemaAny>[] = [
  new ApprovalAction(),
  new MorphoInvestAction(),
  new AaveInvestAction(),
  new MoonwellInvestAction(),
  new MorphoWithdrawAction(),
  new MoonwellWithdrawAction(),
  new AaveWithdrawAction(),
];

export const buildCustomCdpTools = (agentKit: CdpAgentkit) => {
  return CDP_ACTIONS.map((action) => new CdpTool(action, agentKit));
};
