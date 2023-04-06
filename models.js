const mongoose=require("mongoose");
const cron=require("node-cron");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, default: "" },
  msgCount: { type: Number, default: 0 },
  apiKey: { type: String, default: "" },
});

const WhatsGPTUser = mongoose.model("WhatsGPTUser", userSchema);

// Schedule a job to reset the msgCount field every midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const result = await WhatsGPTUser.updateMany({}, { $set: { msgCount: 0 } });
    console.log(`All users message count reset to zero`);
  } catch (error) {
    console.error("Error resetting msgCount:", error);
  }
});

module.exports=WhatsGPTUser;
