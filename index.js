const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();
const auth = require("./auth");
const responses = require("./replies");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

try {
  auth().then((client) =>
    client.on("message", async (msg) => {
      isMention = msg.body.includes(`@${client.info.me.user}`);
      if (msg.body == `@${client.info.me.user}`) {
        msg.reply(`How can I help you ${msg._data.notifyName} ?`);
      } else {
        if (msg.body.startsWith("#") || isMention) {
          let index = responses.findIndex((response) =>
            msg.body.toLowerCase().includes(response.que.toLowerCase())
          );
          if (index >= 0) {
            msg.reply(responses[index]?.ans);
          } else {
            const chat = await msg.getChat();
            const prompt = isMention
              ? msg.body.substring(13)
              : msg.body.substring(1);
            chat.sendStateTyping();
            gptResponse(prompt).then((result) => {
              msg.reply(result);
              chat.clearState();
            });
          }
        }
      }
    })
  );
} catch (error) {
  console.log(error);
}

async function gptResponse(message) {
  try {
    const res = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: message,
      max_tokens: 200,
    });
    return res.data.choices[0].text;
  } catch (err) {
    console.error(err);
    return "Error: Unable to reach OpenAI API.";
  }
}
