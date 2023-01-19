const { Configuration, OpenAIApi } = require("openai");
const { MessageMedia } = require("whatsapp-web.js");
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
        switch (true) {
          case body === `@${me.user}`:
            msg.reply(`How can I help you ${_data.notifyName} ?`);
            break;
          case body.startsWith("#") || isMention:
            const index = responses.findIndex((response) =>
              body.toLowerCase().includes(response.que.toLowerCase())
            );
            if (index >= 0) {
              msg.reply(responses[index].ans);
            } else {
              const prompt = isMention
                ? body.substring(me.user.length + 1)
                : body.substring(1);
              const chat = await msg.getChat();
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
          case body.startsWith("*"):
            const prompt = body.substring(1);
            const chat = await msg.getChat();
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
