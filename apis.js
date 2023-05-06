const request = require("request");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const { Readable } = require("stream");
require("dotenv").config();
const fs = require("fs");

async function gptResponse(prompt, openai, type) {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: prompt,
    });
    return completion.data.choices[0].message.content;
  } catch (err) {
    console.error(err);
    if (type === "testing") {
      return "Invalid";
    }
    return err.response.statusText;
  }
}

function bufferToStream(binary) {
  const stream = new Readable();
  stream.push(binary);
  stream.push(null);
  return stream;
}

async function speechToText(audioData, openai, number) {
  try {
    const audioBuffer = Buffer.from(audioData.data, "base64");
    const filename = `./audio/${number}.mp3`;
    const inputStream = bufferToStream(audioBuffer);
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputStream)
        .noVideo()
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .output(filename)
        .outputFormat("mp3")
        .outputOptions("-f mp3")
        .on("error", function (err) {
          console.log("An error occurred: " + err.message);
          reject(err);
        })
        .on("end", function () {
          console.log("Audio conversion complete.");
          resolve();
        })
        .run();
    });

    const response = await openai.createTranscription(
      fs.createReadStream(filename),
      "whisper-1",
      "en" //Language
    );
    const transcription = response.data.text;

    fs.unlink(filename, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

    return transcription;
  } catch (error) {
    console.log(error.response.status);
  }
}

async function dalleResponse(prompt, openai) {
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

      const buffer = Buffer.from(base64, "base64");

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

module.exports = { imageToText, dalleResponse, gptResponse, speechToText };
