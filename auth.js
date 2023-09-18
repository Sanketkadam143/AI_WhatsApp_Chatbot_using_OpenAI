import pkg from "whatsapp-web.js/index.js";
import qrcode from "qrcode-terminal";
// Require database
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";
const { Client, RemoteAuth } = pkg;
let client;

// Load the session data
export default function auth() {
  return new Promise((resolve, reject) => {
    try {
      const store = new MongoStore({ mongoose: mongoose });
      store.sessionExists({ session: "RemoteAuth" }).then((exists) => {
        if (exists) {
          store
            .extract({
              session: "RemoteAuth",
              path: process.env.SESSION_FILE_PATH,
            })
            .then(() => {
              client = new Client({
                authStrategy: new RemoteAuth({
                  store: store,
                  backupSyncIntervalMs: 3600000,
                }),
                puppeteer: {
                  args: ["--no-sandbox", "--disable-setuid-sandbox"],
                },
              });
              client.initialize();
              client.on("ready", () => {
                console.log("Client is ready!");
                resolve(client);
              });
            });
        } else {
          client = new Client({
            authStrategy: new RemoteAuth({
              store: store,
              backupSyncIntervalMs: 3600000,
            }),
            puppeteer: {
              args: ["--no-sandbox", "--disable-setuid-sandbox"],
            },
          });
          client.initialize();
          client.on("qr", (qr) => {
            qrcode.generate(qr, { small: true });
          });
          client.on("ready", () => {
            console.log("Client is ready!");
            resolve(client);
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
