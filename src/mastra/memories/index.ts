import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';

// 定义消息类型
interface Message {
  role: 'user' | 'assistant';
  content: string;
  userId: string;
  metadata?: {
    sensitive?: boolean;
    usedQuestionIds?: string[];
  };
}

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
function extractTechnologies(content: string): string[] {
  const techKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Svelte',
    'CSS', 'SCSS', 'LESS', 'Tailwind', 'Bootstrap', 'HTML', 'DOM',
    'Node.js', 'Webpack', 'Vite', 'Rollup', 'Parcel', 'Redux', 'Mobx',
    'GraphQL', 'REST', 'API', 'Testing', 'Jest', 'Cypress', 'Performance',
    'Accessibility', 'SEO', 'PWA'
  ];

  return techKeywords.filter(tech =>
    new RegExp(`\\b${tech}\\b`, 'i').test(content)
  );
}

// 提取难度级别
function extractDifficulty(content: string): 'junior' | 'mid-level' | 'senior' | null {
  const difficultyPatterns = [
    { pattern: /\bjunior\b|\bentry[\s-]?level\b|\bbeginner\b/i, level: 'junior' as const },
    { pattern: /\bmid[\s-]?level\b|\bintermediate\b/i, level: 'mid-level' as const },
    { pattern: /\bsenior\b|\badvanced\b|\bexpert\b/i, level: 'senior' as const },
  ];

  for (const { pattern, level } of difficultyPatterns) {
    if (pattern.test(content)) {
      return level;
    }
  }

  return null;
}