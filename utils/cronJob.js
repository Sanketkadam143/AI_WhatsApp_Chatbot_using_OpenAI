const cron = require("node-cron");
const User = require("../models.js");
const { renewalMsg } = require("./index.js");
const fs = require("fs");

module.exports = (client) => {
  cron.schedule("30 18 * * *", async () => {
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

        // Delete all files in ./audio folder
        const directory = './audio';
        fs.readdir(directory, (err, files) => {
          if (err) throw err;
  
          for (const file of files) {
            fs.unlink(`${directory}/${file}`, (err) => {
              if (err) throw err;
            });
          }
        });

    } catch (error) {
      console.error("Error resetting msgCount:", error);
    }
  });
};
