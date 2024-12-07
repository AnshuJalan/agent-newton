import { CdpAction } from "@coinbase/cdp-agentkit-core";
import { Wallet, TransactionStatus, readContract, Coinbase } from "@coinbase/coinbase-sdk";
import { z } from "zod";

import { updateMemoryKey } from "../../utils/memory";

const MORPHO_WITHDRAW_PROMPT =
  "This tool allows you to withdraw all your invested USDC from a Morpho vault. It accepts the Ethereum address of the vault to withdraw USDC from as input.";

const MorphoWithdrawInput = z
  .object({
    vaultAddress: z.string().describe("The Ethereum address of the vault to deposit USDC into"),
  })
  .strip()
  .describe("Instructions for withdrawing USDC from a Morpho vault");

const maxWithdrawAbi = [
  {
    name: "maxWithdraw",
    type: "function",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "assets",
        type: "uint256",
      },
    ],
    stateMutability: "view",
  },
];

const withdrawAbi = [
  {
    name: "withdraw",
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
      {
        name: "owner",
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

async function withdraw(
  wallet: Wallet,
  args: z.infer<typeof MorphoWithdrawInput>
): Promise<string> {
  try {
    const owner = await wallet.getDefaultAddress();

    const assets = await readContract({
      networkId: Coinbase.networks.BaseMainnet,
      // @ts-ignore
      contractAddress: args.vaultAddress,
      // @ts-ignore
      abi: maxWithdrawAbi,
      method: "maxWithdraw",
      args: { owner: owner.getId() },
    });

    const withdrawCall = await wallet.invokeContract({
      contractAddress: args.vaultAddress,
      abi: withdrawAbi,
      method: "withdraw",
      args: { assets: assets.toString(), owner: owner.getId(), receiver: owner.getId() },
    });

    const receipt = await withdrawCall.wait();
    const status = receipt.getTransaction().getStatus();

    if (status == TransactionStatus.COMPLETE) {
      updateMemoryKey("morphoVaults", "remove", args.vaultAddress);

      return `Successfully withdrawn USDC from morpho vault ${
        args.vaultAddress
      } for receiver via transaction hash ${receipt.getTransactionHash()}.`;
    } else {
      return `Error: withdrawal failed.`;
    }
  } catch (err: any) {
    console.error(err);
    return "Error: withdrawal failed.";
  }
}

export class MorphoWithdrawAction implements CdpAction<typeof MorphoWithdrawInput> {
  public name = "morpho_withdraw";
  public description = MORPHO_WITHDRAW_PROMPT;
  public argsSchema = MorphoWithdrawInput;
  public func = withdraw;
}
