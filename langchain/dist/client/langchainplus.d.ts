import { LangChainPlusClient } from "langchainplus-sdk";
import { ChainValues, LLMResult } from "../schema/index.js";
import { BaseLanguageModel } from "../base_language/index.js";
import { BaseChain } from "../chains/base.js";
import { BaseLLM } from "../llms/base.js";
import { BaseChatModel } from "../chat_models/base.js";
export type DatasetRunResults = Record<string, (string | LLMResult | ChainValues)[]>;
export declare function isLLM(llm: BaseLanguageModel | (() => Promise<BaseChain>)): llm is BaseLLM;
export declare function isChatModel(llm: BaseLanguageModel | (() => Promise<BaseChain>)): llm is BaseChatModel;
export declare function isChain(llm: BaseLanguageModel | (() => Promise<BaseChain>)): Promise<boolean>;
export declare const runOnDataset: (datasetName: string, llmOrChainFactory: BaseLanguageModel | (() => Promise<BaseChain>), { numRepetitions, sessionName, client, }?: {
    numRepetitions?: number | undefined;
    sessionName?: string | undefined;
    client?: LangChainPlusClient | undefined;
}) => Promise<DatasetRunResults>;
