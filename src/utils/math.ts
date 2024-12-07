import BigNumber from "bignumber.js";

export const mulDiv = (num: string, x: number, y: number) => {
  return new BigNumber(num).multipliedBy(x).dividedBy(y).toString();
};

export const scaleDownDec = (num: string) => {
  return new BigNumber(num).dividedBy(10 ** 6).toNumber();
};
