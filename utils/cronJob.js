import { schedule } from "node-cron";
import User from "../models/models.js";
import { Configuration, OpenAIApi } from "openai";
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
        const configuration = new Configuration({
          apiKey: key,
        });
        const openai = new OpenAIApi(configuration);
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
};
