import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";

async function debugVectorStorage() {
  try {
    console.log("🔍 Starting debug process...");
    
    // Check environment variables
    console.log("📋 Environment variables:");
    console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing");
    console.log("QDRANT_URL:", process.env.QDRANT_URL || "❌ Missing");
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is required");
      return;
    }
    
    if (!process.env.QDRANT_URL) {
      console.log("⚠️ QDRANT_URL not set, using default: http://localhost:6333");
      process.env.QDRANT_URL = "http://localhost:6333";
    }
    
    // Test Qdrant connection
    console.log("🔗 Testing Qdrant connection...");
    const client = new QdrantClient({ url: process.env.QDRANT_URL });
    
    try {
      const collections = await client.getCollections();
      console.log("✅ Qdrant connection successful");
      console.log("📦 Existing collections:", collections.collections.map(c => c.name));
    } catch (error) {
      console.error("❌ Qdrant connection failed:", error.message);
      return;
    }
    
    // Check if we have any PDF files to test with
    console.log("📄 Looking for PDF files in uploads directory...");
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      console.error("❌ Uploads directory not found");
      return;
    }
    
    const files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.pdf'));
    console.log(`📁 Found ${files.length} PDF files:`, files);
    
    if (files.length === 0) {
      console.log("⚠️ No PDF files found to test with");
      return;
    }
    
    // Test with the first PDF file
    const testFile = path.join(uploadsDir, files[0]);
    console.log(`🧪 Testing with file: ${testFile}`);
    
    // Load PDF
    console.log("📖 Loading PDF...");
    const loader = new PDFLoader(testFile);
    const docs = await loader.load();
    console.log(`✅ Loaded ${docs.length} pages`);
    
    // Split documents
    console.log("✂️ Splitting documents...");
    const splitter = new CharacterTextSplitter({
      chunkSize: 300,
      chunkOverlap: 100,
    });
    
    const chunks = await splitter.splitDocuments(docs);
    console.log(`✅ Created ${chunks.length} chunks`);
    
    // Test embeddings
    console.log("🧠 Testing embeddings...");
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-small",
    });
    
    // Test embedding generation
    const testEmbedding = await embeddings.embedQuery("test");
    console.log(`✅ Embedding test successful, vector size: ${testEmbedding.length}`);
    
    // Create collection if it doesn't exist
    const collectionName = "pdf-chunks";
    try {
      await client.getCollection(collectionName);
      console.log("✅ Collection 'pdf-chunks' exists");
    } catch (error) {
      console.log("📦 Creating collection 'pdf-chunks'...");
      await client.createCollection(collectionName, {
        vectors: {
          size: testEmbedding.length, // Use actual embedding size
          distance: "Cosine"
        }
      });
      console.log("✅ Collection created");
    }
    
    // Test vector storage with a small sample
    console.log("💾 Testing vector storage with sample chunks...");
    const sampleChunks = chunks.slice(0, 2); // Test with first 2 chunks
    
    const vectorStore = await QdrantVectorStore.fromDocuments(
      sampleChunks,
      embeddings,
      {
        client,
        collectionName: collectionName,
      }
    );
    
    console.log("✅ Vector store created successfully");
    
    // Verify storage
    const collectionInfo = await client.getCollection(collectionName);
    console.log("📈 Collection info:", {
      name: collectionInfo.name,
      vectors_count: collectionInfo.vectors_count,
      points_count: collectionInfo.points_count
    });
    
    console.log("🎉 Debug completed successfully!");
    
  } catch (error) {
    console.error("❌ Debug failed:", error);
    console.error("Stack trace:", error.stack);
  }
}

debugVectorStorage(); 