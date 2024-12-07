import { CdpAction } from "@coinbase/cdp-agentkit-core";
import { Wallet, Amount, TransactionStatus } from "@coinbase/coinbase-sdk";
import { z } from "zod";

import { scaleDownDec } from "../../utils/math";

const MORPHO_INVEST_PROMPT =
  "This tool allows you to invest USDC into a Morpho vault. It accepts the vault's Ethereum address, the amount of USDC to deposit, and the receiver's Ethereum address. This tool must be preceded by a call to the `approve` tool to allow the vault contract to spend the required amount of USDC on your behalf.";

const MorphoInvestInput = z
  .object({
    vaultAddress: z.string().describe("The Ethereum address of the vault to deposit USDC into"),
    assets: z
      .custom<Amount>()
      .describe(
        "The amount of USDC to deposit into the vault. The amount is scaled to the decimals of the token asset. For example, if the decimals is 6, then the amount is scaled as amount * 1e6"
      ),
    receiver: z.string().describe("The Ethereum address of the receiver for the deposit"),
  })
  .strip()
  .describe("Instructions for depositing USDC into a Morpho vault");

const depositAbi = [
  {
    name: "deposit",
    type: "function",
    inputs: [
      {
        name: "assets",
        type: "uint256",
      },
      {
        name: "receiver",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "shares",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
];

async function invest(wallet: Wallet, args: z.infer<typeof MorphoInvestInput>): Promise<string> {
  const depositCall = await wallet.invokeContract({
    contractAddress: args.vaultAddress,
    abi: depositAbi,
    method: "deposit",
    args: { assets: args.assets.toString(), receiver: args.receiver },
  });

  const receipt = await depositCall.wait();
  const status = receipt.getTransaction().getStatus();

  if (status == TransactionStatus.COMPLETE) {
    return `Successfully deposited ${scaleDownDec(args.assets.toString())} USDC into morpho vault ${
      args.vaultAddress
    } for receiver ${args.receiver} via transaction hash ${receipt.getTransactionHash()}.`;
  } else {
    return `Error: deposit failed.`;
  }
}

export class MorphoInvestAction implements CdpAction<typeof MorphoInvestInput> {
  public name = "morpho_invest";
  public description = MORPHO_INVEST_PROMPT;
  public argsSchema = MorphoInvestInput;
  public func = invest;
}
