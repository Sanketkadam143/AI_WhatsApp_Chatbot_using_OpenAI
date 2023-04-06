const request = require("request");
require("dotenv").config();




async function gptResponse(prompt,openai) {
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

async function dalleResponse(prompt,openai) {
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


function imageToText(base64) {
  return new Promise((resolve, reject) => {
    try {
      const url = "https://api.api-ninjas.com/v1/imagetotext";
      const apiKey = process.env.IMAGE_TO_TEXT_API;

      const buffer = Buffer.from(base64, 'base64');

      const formData = {
        image: {
          value: buffer,
          options: {
            filename: "image.png",
            contentType: "image/png",
          },
        },
      };

      const options = {
        url: url,
        headers: {
          "X-Api-Key": apiKey,
        },
        formData: formData,
      };

      request.post(options, function (error, response, body) {
        if (error) {
          console.error("Error:", error);
          reject(error);
        } else if (response.statusCode != 200) {
          console.error("Error:", response.statusCode, body);
          reject(error);
        } else {
          const res = JSON.parse(body);
          let text = "";
          res.forEach((element) => {
            text += element.text + " ";
          });

          resolve(text);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {imageToText,dalleResponse,gptResponse};
