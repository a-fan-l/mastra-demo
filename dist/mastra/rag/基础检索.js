"use strict";
// // 基础检索
// import { openai } from "@ai-sdk/openai";
// import { embed } from "ai";
// import { PgVector } from "@mastra/pg";
// // Convert query to embedding
// const { embedding } = await embed({
//   value: "What are the main points in the article?",
//   model: openai.embedding('text-embedding-3-small'),
// });
// // Query vector store
// const store = new PgVector(process.env.POSTGRES_CONNECTION_STRING);
// const results = await store.query({
//   indexName: "embeddings",
//   queryVector: embedding,
//   topK: 10,
// });
// // Display results
// console.log(results);
// // 结果包括文本内容和相似度得分：
// // [
// //     {
// //       text: "Climate change poses significant challenges...",
// //       score: 0.89,
// //       metadata: { source: "article1.txt" }
// //     },
// //     {
// //       text: "Rising temperatures affect crop yields...",
// //       score: 0.82,
// //       metadata: { source: "article1.txt" }
// //     }
// //     // ... more results
// // ]
// // 高级检索选项
// // 1. 元数据过滤
// // 主要是通过：根据元数据字段筛选结果，缩小搜索范围。
