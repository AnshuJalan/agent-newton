import fs from "fs";
import path from "path";

const jsonFilePath = path.resolve(__dirname, "../../memory.json");

const defaultContent = {
  morphoVaults: [],
  aaveReserves: [],
  moonwellMarkets: [],
};

export const ensureMemoryFileExists = (): void => {
  if (!fs.existsSync(jsonFilePath)) {
    fs.writeFileSync(jsonFilePath, JSON.stringify(defaultContent, null, 2), "utf-8");
  }
};

export const readMemoryFile = (): Record<string, any> => {
  const rawData = fs.readFileSync(jsonFilePath, "utf-8");
  return JSON.parse(rawData);
};

export const writeMemoryFile = (data: Record<string, any>): void => {
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), "utf-8");
};

export const updateMemoryKey = (key: string, operation: "add" | "remove", item: string): void => {
  const data = readMemoryFile();

  if (!data[key]) {
    console.error(`Key "${key}" not found in the JSON file.`);
    return;
  }

  if (operation === "add") {
    if (!data[key].includes(item)) {
      data[key].push(item);
    }
  } else if (operation === "remove") {
    const index = data[key].indexOf(item);
    if (index !== -1) {
      data[key].splice(index, 1);
    }
  }

  writeMemoryFile(data);
};
