import { CdpAction } from "@coinbase/cdp-agentkit-core";
import { Wallet, TransactionStatus } from "@coinbase/coinbase-sdk";
import { z } from "zod";

import { updateMemoryKey } from "../../utils/memory";
import { UINT256_MAX } from "../../utils/math";

const AAVE_WITHDRAW_PROMPT = "This tool allows you to withdraw USDC from an Aave reserve.";

const AaveWithdrawInput = z.object({});

const withdrawAbi = [
  {
    name: "withdraw",
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
        name: "to",
        type: "address",
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

async function withdraw(wallet: Wallet, args: z.infer<typeof AaveWithdrawInput>): Promise<string> {
  try {
    const self = await wallet.getDefaultAddress();

    const withdrawCall = await wallet.invokeContract({
      contractAddress: process.env.BASE_AAVE_POOL_ADDRESS as string,
      abi: withdrawAbi,
      method: "withdraw",
      args: {
        asset: process.env.BASE_USDC_ADDRESS as string,
        amount: UINT256_MAX,
        to: self.getId(),
      },
    });

    const receipt = await withdrawCall.wait();
    const status = receipt.getTransaction().getStatus();

    if (status == TransactionStatus.COMPLETE) {
      updateMemoryKey("aaveReserves", "remove", process.env.BASE_AAVE_POOL_ADDRESS as string);

      return `Successfully withdrawn USDC from Aave pool reserve via transaction hash ${receipt.getTransactionHash()}.`;
    } else {
      return `Error: withdraw failed.`;
    }
  } catch (err: any) {
    console.error(err);
    return "Error: withdraw failed.";
  }
}

export class AaveWithdrawAction implements CdpAction<typeof AaveWithdrawInput> {
  public name = "aave_withdraw";
  public description = AAVE_WITHDRAW_PROMPT;
  public argsSchema = AaveWithdrawInput;
  public func = withdraw;
}
