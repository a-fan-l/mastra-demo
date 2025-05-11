
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { cohere } from "@ai-sdk/cohere";
import { MDocument } from "@mastra/rag";
import { PineconeVector } from "@mastra/pinecone";
import { PgVector } from '@mastra/pg';

// Initialize document
const doc = MDocument.fromText(`
  Climate change poses significant challenges to global agriculture.
  Rising temperatures and changing precipitation patterns affect crop yields.
`);

// Create chunks
const chunks = await doc.chunk({
  strategy: "recursive",
  size: 256,
  overlap: 50,
});

// Generate embeddings with OpenAI
const { embeddings: openAIEmbeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: chunks.map(chunk => chunk.text),
});

// Generate embeddings with Cohere
const { embeddings: cohereEmbeddings } = await embedMany({
  model: cohere.embedding('embed-english-v3.0'),
  values: chunks.map(chunk => chunk.text),
});

// Store embeddings in your vector database
// 元数据对于向量存储至关重要——没有它，您将只能得到数值嵌入，而无法返回原始文本或过滤结果。
// 始终至少将源文本存储为元数据。
// await store.upsert({
//     indexName: "myCollection",
//     vectors: openAIEmbeddings,  
//     metadata: chunks.map(chunk => ({ text: chunk.text })),
// });
   
// 检索
// 检索的原理
// 1. 使用与文档嵌入相同的模型将用户的查询转换为嵌入
// 2. 使用向量相似度将此嵌入与存储的嵌入进行比较
// 3. 检索最相似的块并且可以选择：
// 3.1 重新排序结果
// 3.2 过滤结果
// 3.3 返回原始文本
