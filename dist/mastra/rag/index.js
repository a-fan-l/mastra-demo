// import { MDocument } from "@mastra/rag";
// import { openai } from "@ai-sdk/openai";
// import { cohere } from '@ai-sdk/cohere';
// import { embedMany } from "ai";
// import { google } from '@ai-sdk/google';
// // 1. 初始化文档
// const docFromText = MDocument.fromText("Your plain text content...");
// const docFromHTML = MDocument.fromHTML("<html>Your HTML content...</html>");
// const docFromMarkdown = MDocument.fromMarkdown("# Your Markdown content...");
// const docFromJSON = MDocument.fromJSON(`{ "key": "value" }`);
// // 2. 文档拆分（Mastra 支持多种针对不同文档类型优化的分块策略）
// // recursive：基于内容结构的智能拆分
// // character：简单的基于字符的拆分
// // token：令牌感知拆分
// // markdown：Markdown 感知拆分
// // html：HTML 结构感知拆分
// // json：JSON 结构感知拆分
// // latex：LaTeX 结构感知拆分
// const chunks = await docFromText.chunk({
//     strategy: "recursive",
//     size: 512,
//     overlap: 50,
//     separator: "\n"
// });
// // 3. 嵌入生成（Mastra 支持许多嵌入提供程序，包括 OpenAI 和 Cohere）
// const { embeddings: embeddings_1 } = await embedMany({
//   model: openai.embedding('text-embedding-3-small'),
//   values: chunks.map(chunk => chunk.text),
// });
// const { embeddings: embeddings_2 } = await embedMany({
//   model: cohere.embedding('embed-english-v3.0'),
//   values: chunks.map(chunk => chunk.text),
// });
// // 嵌入函数返回向量，即表示文本语义的数字数组，可用于在向量数据库中进行相似性搜索。
// // 3.1 配置嵌入维度
// // 嵌入模型通常输出具有固定维数的向量（例如，OpenAI 的向量为 1536 text-embedding-3-small）。
// // OpenAI（文本嵌入-3 模型）：
// const { embeddings: embeddings_1_1} = await embedMany({
//     model: openai.embedding('text-embedding-3-small', {
//         dimensions: 256  // Only supported in text-embedding-3 and later
//     }),
//     values: chunks.map(chunk => chunk.text),
// });
// // 谷歌（文本嵌入-004）：
// const { embeddings: embeddings_2_1 } = await embedMany({
//     model: google.textEmbeddingModel('text-embedding-004', {
//       outputDimensionality: 256  // Truncates excessive values from the end
//     }),
//     values: chunks.map(chunk => chunk.text),
// });
// 4. 将嵌入存储在矢量数据库中
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { cohere } from "@ai-sdk/cohere";
import { MDocument } from "@mastra/rag";
// const store = new PgVector(process.env.POSTGRES_CONNECTION_STRING)
// // 创建索引
// await store.createIndex({
//   indexName: "myCollection",
//   dimension: 1536,
// });
// 初始化 Pinecone 向量存储
// const vectorStore = new PineconeStore({
//   apiKey: process.env.PINECONE_API_KEY,
//   environment: process.env.PINECONE_ENVIRONMENT || "gcp-starter",
//   indexName: process.env.PINECONE_INDEX_NAME || "mastra-index",
// });
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
// OR
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
