const mongoose=require("mongoose");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, default: "" },
  msgCount: { type: Number, default: 0 },
  apiKey: { type: String, default: "" },
});

const WhatsGPTUser = mongoose.model("WhatsGPTUser", userSchema);

module.exports=WhatsGPTUser;
