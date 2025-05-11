// import { Memory } from '@mastra/memory';
// import { LibSQLStore } from '@mastra/libsql';
// export const memory = new Memory({
//   storage: new LibSQLStore({
//     url: 'file:../mastra.db',
//   }),
//   options: {
//     lastMessages: 10,
//     semanticRecall: false,
//     threads: {
//       generateTitle: false,
//     },
//   },
// });
// ------
// import { Memory } from "@mastra/memory";
// import { LibSQLStore } from '@mastra/libsql';
// export const memory = new Memory({
//   storage: new LibSQLStore({
//     url: ':memory:',  // 使用内存数据库
//   }),
//   options: {
//     lastMessages: 50,
//     semanticRecall: false,
//     threads: {
//       generateTitle: false,
//     },
//   },
// });
// // 可选：添加自定义方法来格式化存储的记忆
// export function formatMemory(agentName: string, history: any[]): string {
//   return history
//     .map((msg) => `${msg.role === 'user' ? 'User' : agentName}: ${msg.content}`)
//     .join('\n');
// }
// ------
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
export const memory = new Memory({
    storage: new LibSQLStore({
        url: 'file:../mastra.db',
    }),
    options: {
        lastMessages: 20,
        semanticRecall: false,
        threads: {
            generateTitle: false,
        },
    },
});
// 提取技术关键词
function extractTechnologies(content) {
    const techKeywords = [
        'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Svelte',
        'CSS', 'SCSS', 'LESS', 'Tailwind', 'Bootstrap', 'HTML', 'DOM',
        'Node.js', 'Webpack', 'Vite', 'Rollup', 'Parcel', 'Redux', 'Mobx',
        'GraphQL', 'REST', 'API', 'Testing', 'Jest', 'Cypress', 'Performance',
        'Accessibility', 'SEO', 'PWA'
    ];
    return techKeywords.filter(tech => new RegExp(`\\b${tech}\\b`, 'i').test(content));
}
// 提取难度级别
function extractDifficulty(content) {
    const difficultyPatterns = [
        { pattern: /\bjunior\b|\bentry[\s-]?level\b|\bbeginner\b/i, level: 'junior' },
        { pattern: /\bmid[\s-]?level\b|\bintermediate\b/i, level: 'mid-level' },
        { pattern: /\bsenior\b|\badvanced\b|\bexpert\b/i, level: 'senior' },
    ];
    for (const { pattern, level } of difficultyPatterns) {
        if (pattern.test(content)) {
            return level;
        }
    }
    return null;
}
