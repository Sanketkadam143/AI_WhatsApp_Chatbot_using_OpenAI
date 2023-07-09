import pkg from "./whatsapp-web.js/index.js";
const { MessageMedia } = pkg;
import { Configuration, OpenAIApi } from "openai";
import { config } from "dotenv";
import auth from "./auth.js";
import responses from "./replies.js";
import {
  imageToText,
  dalleResponse,
  gptResponse,
  speechToText,
} from "./apis.js";
import User from "./models.js";
import { addUser, customMessage, isValidUrl } from "./utils/index.js";
import resetCredit from "./utils/cronJob.js";
import { createEmbeddings, webEmbeddings } from "./custom_gpt/embeddings.js";
import search from "./custom_gpt/docsearch.js";
config();

const apiKeyCount = 2;
const apiKeys = [];
for (let i = 1; i <= apiKeyCount; i++) {
  const apiKey = process.env[`OPENAI_API_KEY_${i}`];
  if (apiKey) {
    apiKeys.push(apiKey);
  }
}
async function bot() {
  try {
    const client = await auth();
    resetCredit(client);
    // await addUser(client);
    // await customMessage(client);
    client.on("message", async (msg) => {
      console.log(msg);
      const { body, _data } = msg;
      const { me } = client.info;
      const isMention = body.includes(`@${me.user}`);
      const chat = await msg.getChat();
      const isgrp = chat.isGroup;
      const hasMedia = msg.hasMedia;
      const number = isgrp ? _data.author : _data.from;
      const apiKeyIndex = Math.floor(Math.random() * apiKeys.length);
      let apiKey = apiKeys[apiKeyIndex];
      const type = msg.type;

      if (body.startsWith("#") || isMention || !isgrp && type=="chat") {
        const index = responses.findIndex((response) =>
          body.startsWith("#")
            ? body.substring(1).toLowerCase() == response.que.toLowerCase()
            : body.toLowerCase() == response.que.toLowerCase()
        );
        if (index >= 0) {
          msg.reply(responses[index].ans);
          return
        } else if (body.length < 10) {
          if (_data.notifyName) {
            msg.reply(
              `Hey ${_data.notifyName} please be more brief to generate accurate response.`
            );
          }
          return
        }
      }

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
          const res = await gptResponse(prompt, openai, "testing");
          if (res === "Invalid") {
            msg.reply(
              "Invalid key or It might have expired..check usage section in openai"
            );
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

        apiKey = isKeyPresent?.apiKey ? isKeyPresent.apiKey : apiKey;
        if (!isKeyPresent?.apiKey) {
          // msg.reply(process.env.ADD_KEY_MSG);
          // return;
          const user = await User.findOneAndUpdate(
            { mobile: number },
            { $inc: { msgCount: 1 }, $set: { name: _data.notifyName } },
            { upsert: true, new: true }
          ).exec();

          if (user.msgCount > process.env.MSG_LIMIT) {
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
        case !isgrp && isValidUrl(body):
          try {
            chat.sendStateTyping();
            msg.reply("You will be notified once the embeddings are created");
            const embed = await webEmbeddings(msg, number, apiKey);
            if (embed) {
              msg.reply("Embedding for the document created successfully");
            } else {
              return;
            }
          } catch (error) {
            msg.reply("Unable to create embedding");
            console.log(error);
          }
          break;
        case !isgrp && hasMedia && type === "document":
          try {
            chat.sendStateTyping();
            msg.reply("You will be notified once the embeddings are created");
            const embed = await createEmbeddings(msg, number, apiKey);
            if (embed) {
              msg.reply("Embedding for the document created successfully");
            } else {
              return;
            }
          } catch (error) {
            msg.reply("Unable to create embedding");
            console.log(error);
          }
          break;
        case !isgrp && hasMedia && (type === "audio" || type === "ptt"):
          try {
            chat.sendStateTyping();
            const audioData = await msg.downloadMedia();
            const text = await speechToText(audioData, openai, number);
            const prompt = [{ role: "user", content: text }];
            const result = await gptResponse(prompt, openai);
            msg.reply(result);
            chat.clearState();
          } catch (error) {
            console.log(error);
          }
          break;

        case !isgrp && hasMedia:
          try {
            chat.sendStateTyping();
            const imgdata = await msg.downloadMedia();
            const text = await imageToText(imgdata.data);
            const prompt = [{ role: "user", content: text }];
            const result = await gptResponse(prompt, openai);
            msg.reply(result);
            chat.clearState();
          } catch (error) {
            msg.reply("Unable to read file");
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
         if (body.startsWith("/")) {
            chat.sendStateTyping();
            const trained_res = await search(number, body, apiKey);
            msg.reply(trained_res);
            return;
          } else {
            const prompt = isMention
              ? body.substring(me.user.length + 1)
              : body.startsWith("#")
              ? body.substring(1)
              : body;
            const pastMessages = await chat.fetchMessages({ limit: 5 });
            const filteredMessages = pastMessages.filter(
              (msg) => !msg.hasMedia
            );
            let pastinfo = [];
            filteredMessages.forEach((past) => {
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
