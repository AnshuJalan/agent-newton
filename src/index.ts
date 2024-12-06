import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { fetchTools } from "./tools/fetch";
import { buildCustomCdpTools } from "./tools/cdp";
import { validateEnvironment } from "./utils/validations";

validateEnvironment();

const WALLET_DATA_FILE = "wallet_data.txt";

const initializeAgent = async () => {
  try {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

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
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const agentkit = await CdpAgentkit.configureWithWallet(config);

    const cdpToolkit = new CdpToolkit(agentkit);
    const cdpDefaultTools = cdpToolkit.getTools();

    const tools = [...buildCustomCdpTools(agentkit), ...cdpDefaultTools, ...fetchTools];

    const agent = createReactAgent({
      llm,
      tools,
      messageModifier: `You are a Defi broker agent who provides information and/or invests the money provided by the user to you into the defi protocols that provide the best returns and also satisfies any requests given to you by the user. Currently supported protocols:
          - Morpho
          - Aave`,
    });

    // Save wallet data
    const exportedWallet = await agentkit.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, exportedWallet);

    return agent;
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
};

(async () => {
  const agent = await initializeAgent();
  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        "Fund my wallet and then approve 0x4ba6cc4e80806FE8FBCFA1D768B1B5b1a3a20832 to spend 1000 of my tokens at ERC20 address 0x13e5fb0b6534bb22cbc59fae339dbbe0dc906871"
      ),
    ],
  });
  console.log(result.messages[result.messages.length - 1].content);
})();
