# Server Setup Guide

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Qdrant Vector Database Configuration
QDRANT_URL=http://localhost:6333

# Redis/Valkey Configuration (optional - defaults to localhost:6379)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the infrastructure (Redis and Qdrant):
```bash
docker-compose up -d
```

3. Start the server:
```bash
npm run dev
```

4. Start the worker (in a separate terminal):
```bash
npm run worker
```

## Troubleshooting

### Common Issues:

1. **"Module not found" errors**: Run `npm install` to install missing dependencies
2. **"OPENAI_API_KEY is required"**: Set your OpenAI API key in the `.env` file
3. **"QDRANT_URL is required"**: Make sure Qdrant is running and the URL is correct
4. **Connection refused to Qdrant**: Ensure Docker containers are running with `docker-compose ps`
5. **PDF loading errors**: Check that the uploads directory exists and has proper permissions

### Debugging the Worker:

The worker now includes detailed logging. Check the console output for:
- 🔄 Job processing start
- 📄 File processing details
- 📖 PDF loading progress
- ✂️ Document chunking
- 🔗 Qdrant connection
- 📦 Collection creation/verification
- 🧠 Embedding initialization
- 💾 Vector storage
- ✅ Success confirmations

### Testing:

1. Upload a PDF through the frontend
2. Check the server logs for upload confirmation
3. Check the worker logs for processing details
4. Verify vectors are stored by checking Qdrant collection info 