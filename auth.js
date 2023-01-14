const { Client, RemoteAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Require database
const { MongoStore } = require("wwebjs-mongo");
const mongoose = require("mongoose");
let client;

// Load the session data
function auth() {
  return new Promise((resolve, reject) => {
    mongoose.set("strictQuery", false);
    mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => {
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
                      backupSyncIntervalMs: 300000,
                    }),
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
                  backupSyncIntervalMs: 300000,
                }),
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
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = auth;
