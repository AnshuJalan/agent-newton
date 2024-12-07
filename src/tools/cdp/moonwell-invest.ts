import { CdpAction } from "@coinbase/cdp-agentkit-core";
import { Wallet, Amount, TransactionStatus } from "@coinbase/coinbase-sdk";
import { z } from "zod";

import { scaleDownDec } from "../../utils/math";
import { updateMemoryKey } from "../../utils/memory";

const MOONWELL_INVEST_PROMPT =
  "This tool allows you to invest USDC into a Moonwell market. It accepts the amount of USDC to invest as input. This tool must be preceded by a call to the `approve` tool to allow the market contract to spend the required amount of USDC on your behalf.";

const MoonwellInvestInput = z
  .object({
    amount: z
      .custom<Amount>()
      .describe(
        "The amount of USDC to supply into the market. The amount is scaled to the decimals of the token. For example, if the decimals is 6, then the amount is scaled as amount * 1e6"
      ),
  })
  .strip()
  .describe("Instructions for supplying USDC into a moonwell market");

const supplyAbi = [
  {
    name: "mint",
    type: "function",
    inputs: [
      {
        name: "mintAmount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
];

async function invest(wallet: Wallet, args: z.infer<typeof MoonwellInvestInput>): Promise<string> {
  try {
    const supplyCall = await wallet.invokeContract({
      contractAddress: process.env.BASE_MOONWELL_USDC_MARKET_ADDRESS as string,
      abi: supplyAbi,
      method: "mint",
      args: {
        mintAmount: args.amount.toString(),
      },
    });

    const receipt = await supplyCall.wait();
    const status = receipt.getTransaction().getStatus();

    if (status == TransactionStatus.COMPLETE) {
      updateMemoryKey(
        "moonwellMarkets",
        "add",
        process.env.BASE_MOONWELL_USDC_MARKET_ADDRESS as string
      );

      return `Successfully deposited ${scaleDownDec(
        args.amount.toString()
      )} USDC into Moonwell market via transaction hash ${receipt.getTransactionHash()}.`;
    } else {
      return `Error: deposit failed.`;
    }
  } catch (err: any) {
    console.error(err);
    return "Error: deposit failed.";
  }
}

export class MoonwellInvestAction implements CdpAction<typeof MoonwellInvestInput> {
  public name = "moonwell_invest";
  public description = MOONWELL_INVEST_PROMPT;
  public argsSchema = MoonwellInvestInput;
  public func = invest;
}
