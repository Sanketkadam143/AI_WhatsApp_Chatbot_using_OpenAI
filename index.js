//const { MessageMedia } = require("./whatsapp-web.js/index.js");
const { MessageMedia } = require("whatsapp-web.js");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();
const auth = require("./auth");
const responses = require("./replies");
const { imageToText, dalleResponse, gptResponse } = require("./apis");
const User = require("./models.js");

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
      const number = isgrp ? _data.author : _data.from;
      let apiKey = process.env.OPENAI_API_KEY;

      if (
        body.startsWith("#") ||
        isMention ||
        !isgrp ||
        (body.startsWith("*") && !body.substring(1).includes("*"))
      ) {
        const prefix = "#CONFIGURE_API=";
        if (body.startsWith(prefix)) {
          chat.sendStateTyping();
          const key = body.substring(prefix.length);
          const configuration = new Configuration({
            apiKey: key,
          });
          const openai = new OpenAIApi(configuration);
          const prompt = [{ role: "user", content: "testing api" }];
          const res = await gptResponse(prompt, openai);
          if (res === "AI is unavailable") {
            msg.reply("Invalid key");
            return;
          } else {
            const user = await User.findOneAndUpdate(
              { mobile: number },
              { $set: { name: _data.notifyName, apiKey: key } },
              { upsert: true, new: true }
            ).exec();
            if (user.apiKey) {
              msg.reply(
                "API key added Successfully, Now enjoy unlimited chat with WhatsGPT"
              );
            }            
          }
          return;
        }
        const isKeyPresent = await User.findOne(
          { mobile: number },
          { apiKey: 1, _id: 0 }
        );
        apiKey = isKeyPresent?.apiKey
          ? isKeyPresent.apiKey
          : process.env.OPENAI_API_KEY;
        if (!isKeyPresent?.apiKey) {
          const user = await User.findOneAndUpdate(
            { mobile: number },
            { $inc: { msgCount: 1 }, $set: { name: _data.notifyName } },
            { upsert: true, new: true }
          ).exec();

          if (user.msgCount > 5) {
            msg.reply(process.env.DAILY_CREDIT_MSG);
            return;
          }
        }
      } else {
        return;
      }

      const configuration = new Configuration({
        apiKey: apiKey,
      });
      const openai = new OpenAIApi(configuration);
      
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
              const imgurl = await dalleResponse(prompt, openai);
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
            const pastMessage = await chat.fetchMessages({ limit: 10 });
            let pastinfo = [];
            pastMessage.forEach((past) => {
              if (past.id.fromMe) {
                pastinfo.push({ role: "assistant", content: past.body });
              } else {
                pastinfo.push({ role: "user", content: past.body });
              }
            });
            chat.sendStateTyping();
            try {
              const prompt = pastinfo;
              const result = await gptResponse(prompt, openai);
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
