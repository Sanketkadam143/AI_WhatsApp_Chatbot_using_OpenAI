import { schedule } from "node-cron";
import User from "../models/models.js";
import { OpenAI } from "openai";
import { gptResponse } from "../apis.js";
import { renewalMsg } from "./index.js";
import fs from "fs";

export default (client) => {
  schedule("30 18 * * *", async () => {
    try {
      const limit = parseInt(process.env.MSG_LIMIT);
      const usersToUpdate = await User.find({ msgCount: { $gt: limit } });

      const result = await User.updateMany({}, { $set: { msgCount: 0 } });
      // if (result.modifiedCount > 0) {
      //   await renewalMsg(usersToUpdate, client);
      //   console.log(`Updated ${result.modifiedCount} users: ${result}`);
      // } else {
      //   console.log(`No users to update`);
      // }
    } catch (error) {
      console.error("Error resetting msgCount:", error);
    }

    try {
      const users = await User.find({ apiKey: { $ne: "" } });
      for (const user of users) {
        const key = user.apiKey;
        console.log(key)
        const openai = new OpenAI({
          apiKey: key,
        });
        const prompt = [{ role: "user", content: "testing api" }];
        const res = await gptResponse(prompt, openai, "testing");
        if (res === "Invalid") {
          user.apiKey = ""; 
          await user.save(); 
        }
      }
    } catch (error) {
      console.log("error in validating cron", error);
    }
  });

  
  //custom script for greeting message
  var chatIds = process.env.CUSTOM_GREETINGS_NUMBERS;

  async function sendMessageWithDelay(chatIds, res) {
    for (const chatId of chatIds) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 2000); // 2-second delay
      });
  
      await client.sendMessage(chatId, res);
    }
  }

  schedule("30 1 * * *", async () => {
    const key = process.env.OPENAI_API_KEY_1;
    const openai = new OpenAI({
      apiKey: key,
    });
    const prompt = [{ role: "user", content: process.env.GOOD_MORNING_PROMPT}];
    const res = await gptResponse(prompt, openai);
    await sendMessageWithDelay(chatIds, res);
  });


  schedule("30 13 * * *", async () => {
    const key = process.env.OPENAI_API_KEY_1;
    const openai = new OpenAI({
      apiKey: key,
    });
    const prompt = [{ role: "user", content:process.env.ASK_DAY_PROMPT}];
    const res = await gptResponse(prompt, openai);
    await sendMessageWithDelay(chatIds, res);
    
  });


  schedule("30 16 * * *", async () => {
    const key = process.env.OPENAI_API_KEY_1;
    const openai = new OpenAI({
      apiKey: key,
    });
    const prompt = [{ role: "user", content:process.env.GOOD_NIGHT_PROMPT}];
    const res = await gptResponse(prompt, openai);
    await sendMessageWithDelay(chatIds, res);  
  });
 
};
