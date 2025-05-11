// import { createTool } from '@mastra/core/tools';
// import { z } from 'zod';
// export const codeReviewTool = createTool({
//     id: 'review-code',
//     description: 'Perform automated code review on provided code',
//     inputSchema: z.object({
//       code: z.string().describe('Source code to review'),
//       language: z.string().describe('Programming language of the code'),
//     }),
//     outputSchema: z.object({
//       issues: z.array(
//         z.object({
//           line: z.number(),
//           message: z.string(),
//           severity: z.enum(['error', 'warning', 'info']),
//         })
//       ),
//       summary: z.string(),
//     }),
//     execute: async ({ context }) => {
//       return await reviewCode(context.code, context.language);
//     },
// });
// const reviewCode = async (code: string, language: string): Promise<CodeReviewResponse> => {
//     // This is a simplified code review implementation
//     // In a real scenario, you'd integrate with a linter or static analysis tool
//     const issues: CodeReviewResponse['issues'] = [];
//     const lines = code.split('\n');
//     // Basic checks based on language
//     if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
//       lines.forEach((line, index) => {
//         // Check for missing semicolons
//         if (line.trim().endsWith('}') || line.trim().endsWith(']')) {
//           if (!line.trim().endsWith(';')) {
//             issues.push({
//               line: index + 1,
//               message: 'Missing semicolon at end of statement',
//               severity: 'warning',
//             });
//           }
//         }
//         // Check for console.log statements
//         if (line.includes('console.log')) {
//           issues.push({
//             line: index + 1,
//             message: 'Console.log statements should be removed in production code',
//             severity: 'info',
//           });
//         }
//       });
//     }
//     // Check for code length
//     if (lines.length > 100) {
//       issues.push({
//         line: 0,
//         message: 'Code file exceeds 100 lines, consider breaking into smaller modules',
//         severity: 'info',
//       });
//     }
//     const summary = issues.length
//       ? `Found ${issues.length} issues in the ${language} code.`
//       : `No significant issues found in the ${language} code.`;
//     return {
//       issues,
//       summary,
//     };
// };
// // Code Review Agent and Tool
// interface CodeReviewResponse {
//   issues: {
//     line: number;
//     message: string;
//     severity: 'error' | 'warning' | 'info';
//   }[];
//   summary: string;
// }
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
export const codeReviewTool = createTool({
    id: 'review-code',
    description: 'Perform automated code review on provided code',
    inputSchema: z.object({
        code: z.string().describe('Source code to review'),
        language: z.string().describe('Programming language of the code'),
    }),
    outputSchema: z.object({
        issues: z.array(z.object({
            line: z.number(),
            message: z.string(),
            severity: z.enum(['error', 'warning', 'info']),
        })),
        summary: z.string(),
    }),
    execute: async ({ context }) => {
        return await reviewCode(context.code, context.language);
    },
});
const reviewCode = async (code, language) => {
    const issues = [];
    const lines = code.split('\n');
    // 支持的语言列表
    const supportedLanguages = ['javascript', 'typescript'];
    if (!supportedLanguages.includes(language.toLowerCase())) {
        return {
            issues: [],
            summary: `Sorry, I cannot review this language. Please specify a supported language (e.g., JavaScript or TypeScript).`,
        };
    }
    if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
        lines.forEach((line, index) => {
            // Check for missing semicolons
            if (line.trim().endsWith('}') || line.trim().endsWith(']')) {
                if (!line.trim().endsWith(';')) {
                    issues.push({
                        line: index + 1,
                        message: 'Missing semicolon at end of statement',
                        severity: 'warning',
                    });
                }
            }
            // Check for console.log statements
            if (line.includes('console.log')) {
                issues.push({
                    line: index + 1,
                    message: 'Console.log statements should be removed in production code',
                    severity: 'info',
                });
            }
        });
    }
    // Check for code length
    if (lines.length > 100) {
        issues.push({
            line: 0,
            message: 'Code file exceeds 100 lines, consider breaking into smaller modules',
            severity: 'info',
        });
    }
    const summary = issues.length
        ? `Found ${issues.length} issues in the ${language} code.`
        : `No significant issues found in the ${language} code.`;
    return {
        issues,
        summary,
    };
};
