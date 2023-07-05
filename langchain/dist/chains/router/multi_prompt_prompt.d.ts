export declare const MULTI_PROMPT_ROUTER_TEMPLATE = "Given a raw text input to a language model, select the model prompt best suited for the input. You will be given the names of the available prompts and a description of what the prompt is best suited for. You may also revise the original input if you think that revising it will ultimately lead to a better response from the language model.\n\n<< FORMATTING >>\nReturn a markdown code snippet with a JSON object formatted to look like:\n```json\n{{{{\n    \"destination\": string \\ name of the prompt to use or \"DEFAULT\"\n    \"next_inputs\": string \\ a potentially modified version of the original input\n}}}}\n```\n\nREMEMBER: \"destination\" MUST be one of the candidate prompt names specified below OR it can be \"DEFAULT\" if the input is not well suited for any of the candidate prompts.\nREMEMBER: \"next_inputs\" can just be the original input if you don't think any modifications are needed.\n\n<< CANDIDATE PROMPTS >>\n{destinations}\n\n<< INPUT >>\n{{input}}\n\n<< OUTPUT >>\n";
export declare const STRUCTURED_MULTI_PROMPT_ROUTER_TEMPLATE: (formatting: string) => string;
