import dotenv from "dotenv";
dotenv.config();

import chalk from "chalk";
import * as readline from "readline";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { getApp } from "./workflow";
import { printChunk } from "./utils/printChunk";
import { validateEnvironment } from "./utils/validations";
import { ensureMemoryFileExists, readMemoryFile } from "./utils/memory";

validateEnvironment();
ensureMemoryFileExists();

const SYSTEM_PROMPT = `
 You are a professional Decentralised Finance hedge fund broker, tasked with investing the user's USDC into various DeFi protocols on the Base Network. The USDC token on the Base network is located at ERC20 address ${process.env.BASE_USDC_ADDRESS} and has 6 decimals. Your primary objectives are:

1. **Safety**: Ensure investments are made in reliable and well-researched DeFi protocols.
2. **High APY**: Maximize returns by selecting pools or protocols with competitive yields.
3. **Diversification**: Strategically distribute funds across protocols and pools to balance risk and return.
4. **Precision**: Execute the plan exactly as designed, without deviations.

You may use the following protocols: **Aave**, **Morpho**, and **Moonwell**.

### Instructions:
1. **Initial Steps**:
   - Check the user's USDC balance.
   - If the balance is non-zero, fetch data from the available DeFi protocols to gather APY, risk, and liquidity metrics.

2. **Investment Plan**:
   - Use the fetched data to create a well-reasoned investment plan.
   - This plan must specify the **exact percentage or amount of USDC** allocated to each protocol or pool.
   - The plan must reflect a balance between diversification, APY optimization, and safety.

3. **Execution**:
   - Execute the investment plan exactly as designed, ensuring the **allocations in your tool calls match the specified percentages or amounts in the plan**.
   - Use the nearest whole number balance amount to invest, ensuring precision in the allocation.
   - Do not deviate from the plan, even slightly, during execution.

4. **Loop**:
   - Repeat this process (plan creation and execution) in a continuous loop while the user's balance is non-zero.

5. **Withdrawals**:
   - If the user requests a withdrawal, prioritize the withdrawal action.
   - Do not create or execute a new investment plan when processing withdrawals. Simply use the tools to send the requested withdrawal transactions.

  ### Important:
  - Once the investment plan is created, it is **immutable** for that cycle of execution. 
  - The **distribution of USDC** among the protocols or pools during tool calls must be **identical** to the investment plan—no changes or recalculations are allowed.
`;

enum Mode {
  WITHDRAWALS = "1",
  AUTONOMOUS = "2",
}

const run = async (mode: Mode) => {
  const app = await getApp();

  while (true) {
    const withdrawalsRequired = JSON.stringify(readMemoryFile());

    const stream = await app.stream(
      {
        messages: [
          new SystemMessage(SYSTEM_PROMPT),
          new HumanMessage(
            mode == Mode.WITHDRAWALS
              ? `Please execute the following withdrawals: ${withdrawalsRequired}`
              : "Please prepare and execute your investment plan."
          ),
        ],
      },
      { configurable: { thread_id: "main" } }
    );
    for await (const chunk of stream) {
      printChunk(chunk);
    }

    if (mode === Mode.WITHDRAWALS) break;

    await new Promise((resolve) => setTimeout(resolve, 20000));
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const promptUserChoice = async () => {
  console.log(chalk.blueBright("[You are on Base Mainnet 🟢]"));
  console.log(
    chalk.red("[Hey! I'm Agent Newton, your autonomous Defi fund manager. Let's start!]")
  );
  rl.question(
    "Choose an option:\n1. Ask your agent to withdraw your investments\n2. Run agent in autonomous fund manager mode\nEnter 1 or 2: ",
    async (mode: string) => {
      if (Object.values(Mode).includes(mode as Mode)) {
        await run(mode as Mode);
      } else {
        console.log("Invalid choice. Please enter 1 or 2.");
        await promptUserChoice();
      }
      rl.close();
    }
  );
};

promptUserChoice();
