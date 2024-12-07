import fs from "fs";
import { Coinbase } from "@coinbase/coinbase-sdk";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { ChatOpenAI } from "@langchain/openai";

import { buildCustomCdpTools } from "./tools/cdp";
import { fetchTools } from "./tools/fetch";

const WALLET_DATA_FILE = "wallet_data.txt";

export const initializeAgentWithTools = async () => {
  try {
    let walletDataStr: string | null = null;

    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
      }
    }

    const config = {
      cdpWalletData: walletDataStr || undefined,
      networkId: Coinbase.networks.BaseMainnet,
    };

    const agentkit = await CdpAgentkit.configureWithWallet(config);

    const cdpToolkit = new CdpToolkit(agentkit);
    const cdpDefaultTools = cdpToolkit.getTools();

    const tools = [...buildCustomCdpTools(agentkit), ...cdpDefaultTools, ...fetchTools];

    const agent = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
    }).bindTools(tools, { parallel_tool_calls: false });

    const exportedWallet = await agentkit.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);

    return { agent, tools };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
};
