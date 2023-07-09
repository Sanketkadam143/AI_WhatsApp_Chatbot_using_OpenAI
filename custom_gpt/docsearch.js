import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MongoDBAtlasVectorSearch } from "../langchain/vectorstores/mongodb_atlas.cjs";
import { mongoose } from "mongoose";
import { config } from "dotenv";
config();

const  database = mongoose.connection;

async function search(number, query, apiKey) {

  const model = new OpenAI({
    openAIApiKey: apiKey,
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
      openAIApiKey: apiKey,
      temperature: 0.9,
    }),
    dbConfig
  );

  const extractedNumber = number.replace(/\D/g, '');
  const filter = {
    term: {
      query:extractedNumber,
      path:"userPhone"
    },
  };
  const k = 5;

  const chain = RetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(k,filter)
  );

  const res = await chain.call({
    query: query,
  });

  return res.text;
}

export default search;
