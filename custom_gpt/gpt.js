import { loadModel, createCompletion, createEmbedding } from "gpt4all";
import path from "path";

const __dirname = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")
);

const modelPath = path.resolve(__dirname, "../..");

class GPTModel {
  constructor() {
    this.modelPath = modelPath;
    this.model = null;
  }

  async load() {
    if (!this.model) {
      const options = {
        verbose: true,
        allowDownload: false,
        modelPath: this.modelPath,
        modelConfigFile: `${this.modelPath}/gpt4all-model-config.json`,
        type: 'inference',
      };
      console.log('Loading model...')
      this.model = await loadModel('llama-2-7b-chat.ggmlv3.q4_0.bin', options);
    }
  }

  /**
   * 
   * @param {array} prompt
   * @returns {Promise<string>}
   * @memberof GPTModel
   * @description This function generates response for the given prompt
   * @example
   * const prompt = [
   *  { role: "system", content: "" },
   * { role: "user", content: "explain in detail,who has built you" + "\n" },
   * 
   */

  async generateResponse(prompt) {
    await this.load(); 
    const response = await createCompletion(this.model, prompt);

    return response;
  }
}

export default GPTModel;


// const options = {
//   verbose: true,
//   allowDownload: false,
//   modelPath: modelPath,
//   modelConfigFile: modelPath + "/gpt4all-model-config.json",
//   type: "inference",
// };

// const model = await loadModel("llama-2-7b-chat.ggmlv3.q4_0.bin", options);

// const response = await createCompletion(model, [
//   { role: "system", content: "" },
//   { role: "user", content: "explain in detail,who has built you" + "\n" },
// ]);


// console.log(response.choices[0].message, "this is response");


// const embedOptions = {
//   verbose: true,
//   allowDownload: false,
//   modelPath: modelPath,
//   modelConfigFile: modelPath + "/gpt4all-model-config.json",
//   type: "embedding",
// };

// const embedModel = await loadModel('llama-2-7b-chat.ggmlv3.q4_0.bin', embedOptions);
// const embedResponse = await createEmbedding(embedModel,"this is sanket text ad a d d a a" )
// console.log(embedResponse,"this is embed response")
