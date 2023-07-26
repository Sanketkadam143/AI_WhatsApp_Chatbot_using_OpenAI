import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { bot } from "./botFlow.js";
import bodyParser from "body-parser";
import webBotRoutes from "./routes/webBot.js";
import * as dotenv from "dotenv";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;
const CONNECTION_URL = process.env.MONGODB_URI;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

//apis for web-bot
app.use("/api", webBotRoutes);


mongoose.set("strictQuery", false);
mongoose
  .connect(CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    compressors: ["snappy"],
  })
  .then(() => {
    // bot();
    app.listen(PORT, () =>
      console.log(`Server Running on Port: http://localhost:${PORT}`)
    );
   
  })
  .catch((error) => {
    console.log(`${error} did not connect`);
  });
