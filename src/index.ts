import dotenv from "dotenv";
dotenv.config();

import * as readline from "readline";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { getApp } from "./workflow";
import { printChunk } from "./utils/printChunk";
import { ensureMemoryFileExists, readMemoryFile } from "./utils/memory";
import { validateEnvironment } from "./utils/validations";

validateEnvironment();
ensureMemoryFileExists();

const SYSTEM_PROMPT = `
  You are a professional Decentralised Finance hedge fund broker and your job is to invest user's USDC into various Defi protocols on Base Network. USDC on Base network is at ERC20 address ${process.env.BASE_USDC_ADDRESS} and has 6 decimals. You must make investments that are safe and give good APY to the user. Diversify your investments and choose an optimal distribution that gives a high APY yet does not overly distribute the funds. You may either diversify across multiple protocols or multiple pools in the same protocol. As an expert, you may use you tried and tested reasoning patterns when choosing where to invest the user's USDC.

  You can use Aave, Morpho and Moonwell defi protocols.

  Check the user's USDC balance. If it is non-zero, fetch the data of the defi protocols. Use the fetched data to design an investment plan. Then, use this exact same investment plan to invest into the defi protocols.
  
  The distribution of USDC among the defi protocols is as follows during your invest tool calls must be exactly the same as in your investment plan.

  The user may also ask you to wihdraw USDC from any of the defi protocols that you have invested in. When the user requests withdrawals, you do not make any investments and use the tools to send the withdrawal transaction for requested wihdrawals.
  `;

const run = async (mode: string) => {
  const app = await getApp();

  while (true) {
    const withdrawalsRequired = JSON.stringify(readMemoryFile());

    const stream = await app.stream(
      {
        messages: [
          new SystemMessage(SYSTEM_PROMPT),
          new HumanMessage(
            mode == "1" ? `Please execute the following withdrawals: ${withdrawalsRequired}` : ""
          ),
        ],
      },
      { configurable: { thread_id: "main" } }
    );
    for await (const chunk of stream) {
      printChunk(chunk);
    }

    if (mode === "1") break;

    await new Promise((resolve) => setTimeout(resolve, 20000));
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const promptUserChoice = async () => {
  rl.question(
    "Choose an option:\n1. Ask your agent to withdraw your investments\n2. Run agent in autonomous fund manager mode\nEnter 1 or 2: ",
    async (mode: string) => {
      if (mode === "1" || mode === "2") {
        await run(mode);
      } else {
        console.log("Invalid choice. Please enter 1 or 2.");
        await promptUserChoice();
      }
      rl.close();
    }
  );
};

promptUserChoice();
