import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { MongoDBAtlasVectorSearch } from "../langchain/vectorstores/mongodb_atlas.cjs";
import { mongoose } from "mongoose";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
config();

const database = mongoose.connection;

const __dirname = path
  .dirname(new URL(import.meta.url).pathname)
  .replace(/^\/(\w:)/, "$1");

async function writeDocToFile(filePath, document_buffer) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, document_buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function createEmbeddings(msg, number, apiKey) {
  const document = await msg.downloadMedia();
  const fileName = msg._data.filename;
  const fileSize = document?.filesize;
  const body = msg._data.body;
  const mimetype = msg._data.mimetype;
  const filePath = `./media/${fileName}`;

  if (fileSize > 15000000) {
    msg.reply("upload file less than 15mb to create embeddings");
    return false;
  }
  const document_buffer = Buffer.from(document.data, "base64");
  await writeDocToFile(filePath, document_buffer);
  const finalPath = path.join(__dirname, "..", "media", fileName);

  var loader;
  if (mimetype === "application/pdf") {
    loader = new PDFLoader(finalPath, {
      splitPages: false,
    });
  } else if (mimetype === "text/csv") {
    loader = new CSVLoader(finalPath, {
      splitPages: false,
    });
  } else if (
    mimetype === "application/msword" ||
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    loader = new DocxLoader(finalPath, {
      splitPages: false,
    });
  } else if (mimetype === "text/plain") {
    loader = new TextLoader(finalPath, {
      splitPages: false,
    });
  } else {
    msg.reply("File Type not supported");
    fs.unlink(finalPath, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return false;
  }

  const data = await loader.load();
  const text = data[0]?.pageContent;
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([text]);

  const dbConfig = {
    collection: database.collection("sanket_vectordb"),
    indexName: "vector_index",
    textKey: "text_key",
    embeddingKey: "embedding",
    userPhone: number,
  };

  await MongoDBAtlasVectorSearch.fromDocuments(
    docs,
    new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      temperature: 0.9,
    }),
    dbConfig
  );

  fs.unlink(finalPath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  return true;
}


export async function webEmbeddings(msg, number, apiKey){
  const body = msg._data.body;
  const  loader = new PuppeteerWebBaseLoader(body, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    // async evaluate(page, browser) {
    //   await page.waitForResponse(
    //     "https://www.punekarnews.in/pune-students-create-ai-powered-whatsapp-chatbot-whatsgpt-to-offer-instant-information-and-assistance-for-everyday-tasks/",
    //     { options: { timeout: 10000 } }
    //   );

    //   const result = await page.evaluate(() => document.body.innerHTML);
    //   return result;
    // },
  });

  const data = await loader.load();
  const text = data[0]?.pageContent;
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([text]);

  const dbConfig = {
    collection: database.collection("sanket_vectordb"),
    indexName: "vector_index",
    textKey: "text_key",
    embeddingKey: "embedding",
    userPhone: number,
  };

  await MongoDBAtlasVectorSearch.fromDocuments(
    docs,
    new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      temperature: 0.9,
    }),
    dbConfig
  );
  return true;
}


