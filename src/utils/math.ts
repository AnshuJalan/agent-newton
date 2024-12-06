import BigNumber from "bignumber.js";

export const mulDiv = (num: string, x: number, y: number) => {
  return new BigNumber(num).multipliedBy(x).dividedBy(y).toString();
};
