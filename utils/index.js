import User from "../models/models.js";

export async function addUser(client) {
  const operations = [];
  const chats = await client.getChats();
  console.log(chats.length);
  for (const chat of chats) {
    if (!chat.isGroup) {
      const lastMsg = chat?.lastMessage;
      const unreadCount = chat.unreadCount;
      const quotedMessageId = lastMsg?._data.id?._serialized;
      const notifyName = lastMsg?._data?.notifyName;
      const content = `Hello ${notifyName} .We were facing technical issue due to huge demand, We are doing everthing possible to make ai available for you. visit https://whatsgpt.tech/`;
      // if(quotedMessageId){
      //   const chatId = chat.id._serialized
      //   client.sendMessage(chatId, content,options={quotedMessageId})
      //   chat.delete();
      // }
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

export async function customMessage(client) {
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

export async function renewalMsg(usersToUpdate, client) {
  const chatIds = usersToUpdate.map((user) => user.mobile);
  const content = process.env.RENEWAL_MSG;

  await Promise.all(
    chatIds.map((chatId) => client.sendMessage(chatId, content))
  );
}

// export function isValidUrl(urlString) {
//   const urlPattern = new RegExp(
//     "^(https?:\\/\\/)?" + // validate protocol
//       "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
//       "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
//       "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
//       "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
//       "(\\#[-a-z\\d_]*)?$",
//     "i"
//   ); // validate fragment locator
//   console.log(urlPattern.test(urlString))
//   return urlPattern.test(urlString);
// }

export function isValidUrl(str) {
  const pattern = /^(?:\w+:)?\/\/([^\s.]+\.\S{2}|localhost[\:?\d]*)\S*$/;
  return pattern.test(str);
}
