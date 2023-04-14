const User = require("../models.js");

async function addUser(client) {
  const operations = [];
  const chats = await client.getChats();
  for (const chat of chats) {
    if (!chat.isGroup) {
      const user = await User.findOne({ mobile: chat.id._serialized });
      if (!user) {
        operations.push({
          updateOne: {
            filter: { mobile: chat.id._serialized },
            update: { $setOnInsert: { name: chat.name } },
            upsert: true,
          },
        });
      }
    }
  }

  await User.bulkWrite(operations);
}

async function customMessage(client) {
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const users = await User.find({}).skip(offset).limit(batchSize);

    if (users.length === 0) {
      break;
    }

    const chatIds = users.map((user) => user.mobile);
    const content = process.env.CUSTOM_MSG;

    await Promise.all(
      chatIds.map((chatId) => client.sendMessage(chatId, content))
    );

    offset += batchSize;
  }
}

async function renewalMsg(usersToUpdate, client) {
  const chatIds = usersToUpdate.map((user) => user.mobile);
  const content = process.env.RENEWAL_MSG;

  await Promise.all(
    chatIds.map((chatId) => client.sendMessage(chatId, content))
  );
}

module.exports = { addUser, customMessage, renewalMsg };
