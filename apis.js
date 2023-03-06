const request = require("request");
require("dotenv").config();

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

module.exports = imageToText;
