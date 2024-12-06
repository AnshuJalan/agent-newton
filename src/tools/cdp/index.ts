import { CdpTool } from "@coinbase/cdp-langchain";
import { CdpAction, CdpActionSchemaAny, CdpAgentkit } from "@coinbase/cdp-agentkit-core";

import { ApprovalAction } from "./approvals";
import { MorphoInvestAction } from "./morpho-invest";

const CDP_ACTIONS: CdpAction<CdpActionSchemaAny>[] = [
  new ApprovalAction(),
  new MorphoInvestAction(),
];

export const buildCustomCdpTools = (agentKit: CdpAgentkit) => {
  return CDP_ACTIONS.map((action) => new CdpTool(action, agentKit));
};
