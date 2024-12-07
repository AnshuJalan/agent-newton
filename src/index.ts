import dotenv from "dotenv";
dotenv.config();

import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { getApp } from "./workflow";
import { validateEnvironment } from "./utils/validations";

validateEnvironment();

const SYSTEM_PROMPT = `
  You are a professional Decentralised Finance hedge fund broker and your job is to invest     user's USDC into various Defi protocols on Base Network. USDC on Base network is at ERC20 address ${process.env.BASE_USDC_ADDRESS}. You must make investments that are safe and give good APY to the user. Diversify your investments and choose an optimal distribution that gives a high APY yet does not overly distribute the funds. As an expert, you may use other tried and tested reasoning patterns when choosing where to invest the user's USDC.
  The defi protocols you can use are:
  1. Morpho vaults
  2. Aave reserves
  You have been given tools that you can use to fetch APY data from these defi protocols and execute the investments
  `;

(async () => {
  const app = await getApp();

  const stream = await app.stream(
    {
      messages: [new SystemMessage(SYSTEM_PROMPT), new HumanMessage("Invest my 1 USDC")],
    },
    { configurable: { thread_id: "main" } }
  );
  for await (const chunk of stream) {
    if ("agent" in chunk) {
      console.log(chunk.agent.messages);
    } else if ("tools" in chunk) {
      console.log(chunk.tools.messages);
    }
    console.log("---------");
  }
})();
