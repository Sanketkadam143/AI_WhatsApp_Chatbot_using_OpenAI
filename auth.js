const { Client, RemoteAuth } = require("./whatsapp-web.js/index.js");
const qrcode = require("qrcode-terminal");

// Require database
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");
let client;

// Load the session data
function auth() {
  return new Promise((resolve, reject) => {
    try {
      mongoose.set("strictQuery", false);
      mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => {
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
        })
        .catch((err) => {
          reject(err);
        });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = auth;
