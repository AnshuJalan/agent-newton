import { CdpAction } from "@coinbase/cdp-agentkit-core";
import { Wallet, TransactionStatus, readContract, Coinbase } from "@coinbase/coinbase-sdk";
import { z } from "zod";

import { updateMemoryKey } from "../../utils/memory";

const MOONWELL_WITHDRAW_PROMPT =
  "This tool allows you to withdraw all your invested USDC from a Moonwell market.";

const MoonwellWithdrawInput = z.object({});

const balanceOfAbi = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
  },
];

const withdrawAbi = [
  {
    name: "redeem",
    type: "function",
    inputs: [
      {
        name: "redeemTokens",
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

async function withdraw(
  wallet: Wallet,
  args: z.infer<typeof MoonwellWithdrawInput>
): Promise<string> {
  try {
    const owner = await wallet.getDefaultAddress();

    const redeemTokens = await readContract({
      networkId: Coinbase.networks.BaseMainnet,
      // @ts-ignore
      contractAddress: process.env.BASE_MOONWELL_USDC_MARKET_ADDRESS as string,
      // @ts-ignore
      abi: balanceOfAbi,
      method: "balanceOf",
      args: {
        owner: owner.getId(),
      },
    });

    const withdrawCall = await wallet.invokeContract({
      contractAddress: process.env.BASE_MOONWELL_USDC_MARKET_ADDRESS as string,
      abi: withdrawAbi,
      method: "redeem",
      args: {
        redeemTokens: redeemTokens.toString(),
      },
    });

    const receipt = await withdrawCall.wait();
    const status = receipt.getTransaction().getStatus();

    if (status == TransactionStatus.COMPLETE) {
      updateMemoryKey(
        "moonwellMarkets",
        "remove",
        process.env.BASE_MOONWELL_USDC_MARKET_ADDRESS as string
      );

      return `Successfully withdrawn USDC from Moonwell market ${
        process.env.BASE_MOONWELL_USDC_MARKET_ADDRESS
      } via transaction hash ${receipt.getTransactionHash()}.`;
    } else {
      return `Error: withdraw failed.`;
    }
  } catch (err: any) {
    console.error(err);
    return "Error: withdraw failed.";
  }
}

export class MoonwellWithdrawAction implements CdpAction<typeof MoonwellWithdrawInput> {
  public name = "moonwell_withdraw";
  public description = MOONWELL_WITHDRAW_PROMPT;
  public argsSchema = MoonwellWithdrawInput;
  public func = withdraw;
}
