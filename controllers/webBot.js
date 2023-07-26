import path from "path";
import fs from "fs";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MongoDBAtlasVectorSearch } from "../langchain/vectorstores/mongodb_atlas.cjs";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain } from "langchain/chains";
import mongoose from "mongoose";
import { config } from "dotenv";

config();

const database = mongoose.connection;

const __dirname = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")
);

export const createEmbeddings = async (req, res) => {
  if (!req.body.number) {
    return res.status(400).send({ message: "number field is required" });
  }
  if (!req.file) {
    return res.status(400).send({ message: "please provide a pdf file" });
  }
  const number = JSON.parse(req.body.number);
  try {
    let filename = req.file.originalname.replace(/\s/g, "");
    filename = filename.toLowerCase();
    filename = filename.replace(/[^a-z0-9.]/g, "-");
    filename = filename.replace(/-+/g, "-").replace(/^-|-$/g, "");
    const uniqueSuffix = Date.now();
    filename = uniqueSuffix + "-" + filename;

    const filePath = path.resolve(__dirname, "..", "media", filename);

    fs.writeFile(filePath, req.file.buffer, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error in uploading pdf" });
      }
    });

    const loader = new PDFLoader(filePath, {
      splitPages: false,
    });

    const data = await loader.load();

    const text = data[0]?.pageContent;
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
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
        openAIApiKey: process.env.OPENAI_API_KEY_1,
        temperature: 0.9,
      }),
      dbConfig
    );

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

    return res.status(200).json({ message: "Embeddings created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error while creating embeddings" });
  }
};

export const queryEmbeddings = async (req, res) => {
  const { query, number } = req.body;
  if (!query) {
    return res.status(400).send({ message: "query field is required" });
  }
  if (!number) {
    return res.status(400).send({ message: "number field is required" });
  }

  try {
    const isEmbeddings = await database
      .collection("sanket_vectordb")
      .findOne({ userPhone: number }, { projection: { _id: 1 } });

    if (!isEmbeddings) {
      return res
        .status(400)
        .send({ message: "Embeddings not present for this number" });
    }

    const model = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY_1,
      temperature: 0.9,
    });

    const dbConfig = {
      collection: database.collection("sanket_vectordb"),
      indexName: "index_vector",
      textKey: "text_key",
      embeddingKey: "embedding",
      userPhone: number,
    };

    const vectorStore = new MongoDBAtlasVectorSearch(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY_1,
        temperature: 0.9,
      }),
      dbConfig
    );

    const extractedNumber = number.replace(/\D/g, "");
    const filter = {
      term: {
        query: extractedNumber,
        path: "userPhone",
      },
    };
    const k = 5;

    const chain = RetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(k, filter)
    );

    const answer = await chain.call({
      query: query,
    });

    return res.status(200).json({ response: answer.text });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error while querying embeddings" });
  }
};
