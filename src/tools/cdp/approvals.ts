import { CdpAction } from "@coinbase/cdp-agentkit-core";
import { Wallet, Amount, TransactionStatus } from "@coinbase/coinbase-sdk";
import { z } from "zod";

const APPROVAL_PROMPT =
  "This tools will approve an Ethereum address to transfer arbitrary ERC20 tokens owned by you, on your behalf. It accepts the Ethereum address of the ERC20 token contract, the Ethereum address of the spender who is being allowed to transfer your tokens, and the maximum amount of tokens that the spender can transfer.";

const ApprovalInput = z
  .object({
    tokenAddress: z.string().describe("The Ethereum address of the ERC20 token contract"),
    amount: z
      .custom<Amount>()
      .describe(
        "The maximum amount of tokens that the spender can transfer. The amount is scaled to the decimals of the token. For example, if the decimals is 6, then the amount is scaled as amount * 1e6"
      ),
    spender: z
      .string()
      .describe("The Ethereum address of the spender who is being allowed to transfer your tokens"),
  })
  .strip()
  .describe(
    "Instructions for approving an Ethereum address to transfer ERC20 tokens owned by you, on your behalf"
  );

const approvalAbi = [
  {
    name: "approve",
    type: "function",
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
];

export async function approve(
  wallet: Wallet,
  args: z.infer<typeof ApprovalInput>
): Promise<string> {
  try {
    const approvalCall = await wallet.invokeContract({
      contractAddress: args.tokenAddress,
      abi: approvalAbi,
      method: "approve",
      args: { spender: args.spender, amount: args.amount.toString() },
    });

    const receipt = await approvalCall.wait();
    const status = receipt.getTransaction().getStatus();

    if (status == TransactionStatus.COMPLETE) {
      return `Approved ${args.spender} to transfer ${args.amount} of the token ${
        args.tokenAddress
      } to via transaction hash ${receipt.getTransactionHash()}.`;
    } else {
      return `Approval failed.`;
    }
  } catch (err: any) {
    return "Error: approval failed.";
  }
}

export class ApprovalAction implements CdpAction<typeof ApprovalInput> {
  public name = "approval";
  public description = APPROVAL_PROMPT;
  public argsSchema = ApprovalInput;
  public func = approve;
}
