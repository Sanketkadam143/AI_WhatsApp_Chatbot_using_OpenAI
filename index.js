const { Configuration, OpenAIApi } = require("openai");
const { MessageMedia } = require("./whatsapp-web.js/index.js");
require("dotenv").config();
const auth = require("./auth");
const responses = require("./replies");
const imageToText = require("./apis");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function bot() {
  try {
    const client = await auth();
    client.on("message", async (msg) => {
      const { body, _data } = msg;
      const { me } = client.info;
      const isMention = body.includes(`@${me.user}`);
      const chat = await msg.getChat();
      const isgrp = chat.isGroup;
      const hasMedia = msg.hasMedia;
      switch (true) {
        case !isgrp && hasMedia:
          try {
            chat.sendStateTyping();
            const imgdata = await msg.downloadMedia();
            const text = await imageToText(imgdata.data);
            const result = await gptResponse([{ role: "user", content: text }]);
            msg.reply(result);
            chat.clearState();
          } catch (error) {
            msg.reply("Unable to read Image");
            console.log(error);
          }
          break;

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
            const pastMessage = await chat.fetchMessages({ limit: 20 });
            let pastinfo = [];
            pastMessage.forEach((past) => {
              if (past.id.fromMe) {
                pastinfo.push({ role: "assistant", content: past.body });
              } else {
                pastinfo.push({ role: "user", content: past.body });
              }
            });
            //  console.log(pastinfo);
            chat.sendStateTyping();
            try {
              const result = await gptResponse(pastinfo);
              msg.reply(result);
              chat.clearState();
            } catch (error) {
              msg.reply("AI Unavailable");
              console.log(error);
            }
          }
          break;

        default:
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
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: prompt,
    });
    return completion.data.choices[0].message.content;
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
    console.error(error.response.statusText);
    return error.response.status;
  }
}
