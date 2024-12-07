import chalk from "chalk";

export const printChunk = (chunk: any) => {
  if (chunk.agent?.messages[0].content.length > 0) {
    console.log(chalk.green(`> [agent]: ${chunk.agent.messages[0].content}`));
  } else if (chunk.tools?.messages[0].content.length > 0) {
    const toolMessage = chunk.tools.messages[0];
    console.log(
      chalk.yellow(
        `> [tool (${toolMessage.name})]: ${
          toolMessage.name.includes("_fetch")
            ? "__Fetched data too large to be shown__"
            : toolMessage.content
        }`
      )
    );
  }
};
