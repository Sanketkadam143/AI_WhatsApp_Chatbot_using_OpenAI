import { Schema, model } from "mongoose";

const userSchema = Schema({
  name: { type: String, required: true },
  mobile: { type: String, default: "" },
  msgCount: { type: Number, default: 0 },
  apiKey: { type: String, default: "" },
});

const WhatsGPTUser = model("WhatsGPTUser", userSchema);

export default WhatsGPTUser;
