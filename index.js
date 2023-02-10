const { Configuration, OpenAIApi } = require("openai");
const { MessageMedia } = require("./whatsapp-web.js/index.js");
require("dotenv").config();
const auth = require("./auth");
const responses = require("./replies");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// auth()
//   .then(async (client) => {})
//   .catch((error) => console.log(error));

async function bot() {
  try {
    const client = await auth();
    client.on("message", async (msg) => {
      const { body, _data } = msg;
      const { me } = client.info;
      const isMention = body.includes(`@${me.user}`);
      const chat = await msg.getChat();
      const isgrp = chat.isGroup;
      switch (true) {
        case body === `@${me.user}` || body === "*" || body === "#":
          msg.reply(`How can I help you ${_data.notifyName} ?`);
          break;
        case body.startsWith("*") && !body.substring(1).includes("*"):
          if (body.length < 15) {
            msg.reply(
              `Hey ${_data.notifyName} please give more info of image you want to generate.`
            );
          } else {
            const prompt = body.substring(1);
            chat.sendStateTyping();
            try {
              const imgurl = await dalleResponse(prompt);
              if (imgurl == 400 || imgurl == 429) {
                msg.reply(
                  "Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system."
                );
                return;
              }
              const img = await MessageMedia.fromUrl(imgurl);
              msg.reply(img);
              chat.clearState();
            } catch (error) {
              msg.reply("Image is Unavailable");
              console.log(error);
            }
          }
          break;
        case body.startsWith("#") || isMention || !isgrp:
          console.log(body);
          const index = responses.findIndex((response) =>
            body.startsWith("#")
              ? body.substring(1).toLowerCase() == response.que.toLowerCase()
              : body.toLowerCase() == response.que.toLowerCase()
          );
          if (index >= 0) {
            msg.reply(responses[index].ans);
          } else if (body.length < 10) {
            msg.reply(
              `Hey ${_data.notifyName} please be more brief to generate accurate response.`
            );
          } else {
            const prompt = isMention
              ? body.substring(me.user.length + 1)
              : body.startsWith("#")
              ? body.substring(1)
              : body;
            chat.sendStateTyping();
            try {
              const result = await gptResponse(prompt);
              msg.reply(result);
              chat.clearState();
            } catch (error) {
              msg.reply("AI Unavailable");
              console.log(error);
            }
          }
          break;
      }
    });

    client.on("disconnected", async (reason) => {
      bot();
      console.log(reason);
    });
  } catch (error) {
    console.log(error);
  }
}
bot();

async function gptResponse(prompt) {
  try {
    const res = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 200,
    });
    return res.data.choices[0].text;
  } catch (err) {
    console.error(err.response.text);
    return "AI is unavailable";
  }
}

async function dalleResponse(prompt) {
  try {
    const response = await openai.createImage({
      prompt: prompt,
      n: 1,
      size: "256x256",
    });
    return (image_url = response.data.data[0].url);
  } catch (error) {
    console.error(error.response.statusText);
    return error.response.status;
  }
}
