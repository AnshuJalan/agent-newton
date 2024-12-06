import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { morphoVaultsFetchTool } from "./tools/defi/morpho";
import { aaveReserveFetchTool } from "./tools/defi/aave";

dotenv.config();

// Define the tools for the agent to use
const agentTools = [morphoVaultsFetchTool, aaveReserveFetchTool];
const agentModel = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

const agent = createReactAgent({
  llm: agentModel,
  tools: agentTools,
});

(async () => {
  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        `You are a Defi broker agent who provides information and/or invests the money provided by the user to you into the defi protocols that provide the best returns and also satisfies any requests given to you by the user. Currently supported protocols:
          - Morpho
          - Aave
        `
      ),
      new HumanMessage("Suggest an investment plan for my 1000 USDC for high returns and low fees"),
    ],
  });
  console.log(result.messages[result.messages.length - 1].content);
})();
