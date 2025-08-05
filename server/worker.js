import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log(`Job:`, job.data);
    const data = JSON.parse(job.data);

    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";

    // Load the PDF file
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    // Split the documents into chunks
    const splitter = new CharacterTextSplitter({
      chunkSize: 300,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitDocuments(docs);
    console.log(`📝 Created ${chunks.length} chunks`);

    // Initialize Qdrant client
    const client = new QdrantClient({ url: qdrantUrl });

    // Initialize embeddings
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-small",
    });

    // Create a vector store and add documents
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        client,
        collectionName: "pdf-chunks",
      }
    );

    await vectorStore.addDocuments(chunks);
    console.log(`All docs are added to vector store`);
  },
  {
    concurrency: 100,
    connection: { host: "localhost", port: 6379 },
  }
);

// Handle worker events
worker.on("completed", (job) => {
  console.log("✅ Job completed successfully:", job.id);
});

worker.on("failed", (job, err) => {
  console.error("❌ Job failed:", job.id, err.message);
});

console.log("🚀 Worker started and listening for jobs...");
