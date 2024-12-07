import { AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, MemorySaver, messagesStateReducer, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { initializeAgentWithTools } from "./agent";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
  }),
});

let agent: any;

const callModel = async (state: typeof StateAnnotation.State) => {
  const messages = state.messages;
  const response = await agent.invoke(messages);

  return { messages: [response] };
};

const callToolOrWait = async (state: typeof StateAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if ((lastMessage as AIMessage).tool_calls?.length) {
    return "tools";
  }

  return "__end__";
};

export const getApp = async () => {
  const initAgent = await initializeAgentWithTools();

  agent = initAgent.agent;
  const toolNode = new ToolNode(initAgent.tools);

  const workflow = new StateGraph(StateAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", callToolOrWait, ["tools", "__end__"])
    .addEdge("tools", "agent");

  const checkpointer = new MemorySaver();

  return workflow.compile({ checkpointer });
};
