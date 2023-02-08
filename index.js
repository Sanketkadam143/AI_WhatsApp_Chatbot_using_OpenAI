const { Configuration, OpenAIApi } = require("openai");
const { MessageMedia } = require("./whatsapp-web.js");
require("dotenv").config();
const auth = require("./auth");
const responses = require("./replies");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

auth()
  .then(async (client) => {
    try {
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
          case body.startsWith("#") || isMention || !isgrp:
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
                console.log(error);
              }
            }
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
                const img = await MessageMedia.fromUrl(imgurl);
                msg.reply(img);
                chat.clearState();
              } catch (error) {
                msg.reply("Image Unavailable");
                console.log(error);
              }
            }
            break;
        }
      });
    } catch (error) {
      console.log(error);
    }
  })
  .catch((error) => console.log(error));

async function gptResponse(prompt) {
  try {
    const res = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 200,
    });
    return res.data.choices[0].text;
  } catch (err) {
    console.error(err);
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
    console.log(error);
    return "Unable to reach DALL-E";
  }
}
