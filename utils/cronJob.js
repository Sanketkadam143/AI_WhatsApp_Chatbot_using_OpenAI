import { schedule } from "node-cron";
import User from "../models.js";
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
  });
};
