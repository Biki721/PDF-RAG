import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const queue = new Queue("file-upload-queue", {
  connection: { host: "localhost", port: 6379 },
});

const PORT = process.env.PORT || 8000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const app = express();
app.use(cors());

app.get("/", (req, res) =>
  res.status(200).json({
    status: "All good",
  })
);

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      path: req.file.path,
      destination: req.file.destination,
    })
  );
  res.json({ message: "uploaded" });
});

app.get("/chat", async (req, res) => {
  const userQuery = req.query.message;

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "pdf-chunks",
    }
  );

  const retriever = vectorStore.asRetriever({ k: 2 });

  const result = await retriever.invoke(userQuery);
  const SYSTEM_PROMPT = `
  You are a helpful AI Assistant who answers the user query based on the available context from PDF File.
  Context:
  ${JSON.stringify(result)}
  `;

  const chatResult = await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userQuery },
    ],
  });
  res.json({
    message: chatResult.choices[0].message.content,
    docs: result,
  });
});

app.listen(PORT, () => console.log("Server is running on PORT", PORT));
