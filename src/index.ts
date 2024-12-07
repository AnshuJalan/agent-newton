import dotenv from "dotenv";
dotenv.config();

import chalk from "chalk";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { getApp } from "./workflow";
import { validateEnvironment } from "./utils/validations";

validateEnvironment();

const SYSTEM_PROMPT = `
  You are a professional Decentralised Finance hedge fund broker and your job is to invest user's USDC into various Defi protocols on Base Network. USDC on Base network is at ERC20 address ${process.env.BASE_USDC_ADDRESS} and has 6 decimals. You must make investments that are safe and give good APY to the user. Diversify your investments and choose an optimal distribution that gives a high APY yet does not overly distribute the funds. You may either diversify across multiple protocols or multiple pools in the same protocol. As an expert, you may use you tried and tested reasoning patterns when choosing where to invest the user's USDC.

  The defi protocols you can use are:
  1. Morpho vaults
  2. Aave reserves
  3. Moonwell markets

  The steps you need to follow:
  Step 1. Check the user's USDC balance and proceed only if it is non-zero.
  Step 2. Use tools to fetch information of all the above defi protocols. Every defi protocol has its own fetch tool.
  Step 3. Design an investment plan based on your reasoning.
  Step 4. Use tools to execute all the transactions exactly as per the investment plan you made in Step 3. 
  
  Remember: Only execute investments that are a part of the investment plan. Every defi protocol has its own invest tool. Correctly divide the USDC amount across the invest transactions based on the investment plan. Use correct decimals for USDC.
  `;

(async () => {
  const app = await getApp();
  while (true) {
    const stream = await app.stream(
      {
        messages: [new SystemMessage(SYSTEM_PROMPT)],
      },
      { configurable: { thread_id: "main" } }
    );
    for await (const chunk of stream) {
      if ("agent" in chunk && chunk.agent.messages[0].content.length > 0) {
        console.log(chalk.green(`> [agent]: ${chunk.agent.messages[0].content}`));
      } else if ("tools" in chunk && chunk.tools.messages[0].content.length > 0) {
        const toolMessage = chunk.tools.messages[0];
        console.log(
          chalk.yellow(
            `> [tool (${toolMessage.name})]: ${
              toolMessage.name.includes("_fetch")
                ? "__Fetched data too large to be shown__"
                : toolMessage.content
            }`
          )
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 20000));
  }
})();
