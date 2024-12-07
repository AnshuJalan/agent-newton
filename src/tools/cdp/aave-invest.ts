import { CdpAction } from "@coinbase/cdp-agentkit-core";
import { Wallet, Amount, TransactionStatus } from "@coinbase/coinbase-sdk";
import { z } from "zod";

import { scaleDownDec } from "../../utils/math";

const AAVE_INVEST_PROMPT =
  "This tool allows you to invest USDC into an Aave reserve. It accepts the amount of USDC to invest as input. This tool must be preceded by a call to the `approve` tool to allow the pool reserve contract to spend the required amount of USDC on your behalf.";

const AaveInvestInput = z
  .object({
    amount: z
      .custom<Amount>()
      .describe(
        "The amount of USDC to supply into the pool reserve. The amount is scaled to the decimals of the token. For example, if the decimals is 6, then the amount is scaled as amount * 1e6"
      ),
  })
  .strip()
  .describe("Instructions for supplying USDC into an aave pool reserve");

const supplyAbi = [
  {
    name: "supply",
    type: "function",
    inputs: [
      {
        name: "asset",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
      {
        name: "onBehalfOf",
        type: "address",
      },
      {
        name: "referralCode",
        type: "uint16",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

async function invest(wallet: Wallet, args: z.infer<typeof AaveInvestInput>): Promise<string> {
  const supplyCall = await wallet.invokeContract({
    contractAddress: process.env.BASE_AAVE_USDC_POOL_ADDRESS as string,
    abi: supplyAbi,
    method: "supply",
    args: {
      asset: process.env.BASE_USDC_ADDRESS as string,
      amount: args.amount.toString(),
      onBehalfOf: wallet.getDefaultAddress(),
      referralCode: "0",
    },
  });

  const receipt = await supplyCall.wait();
  const status = receipt.getTransaction().getStatus();

  if (status == TransactionStatus.COMPLETE) {
    return `Successfully deposited ${scaleDownDec(
      args.amount.toString()
    )} USDC into Aave pool reserve via transaction hash ${receipt.getTransactionHash()}.`;
  } else {
    return `Error: supply failed.`;
  }
}

export class AaveInvestAction implements CdpAction<typeof AaveInvestInput> {
  public name = "aave_invest";
  public description = AAVE_INVEST_PROMPT;
  public argsSchema = AaveInvestInput;
  public func = invest;
}
