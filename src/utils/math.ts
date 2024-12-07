import BigNumber from "bignumber.js";

export const UINT256_MAX =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const mulDiv = (num: string, x: number, y: number) => {
  return new BigNumber(num).multipliedBy(x).dividedBy(y).toString();
};

export const scaleDownDec = (num: string) => {
  return new BigNumber(num).dividedBy(10 ** 6).toNumber();
};
