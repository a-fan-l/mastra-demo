import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { getInterviewQuestionsTool } from '../tools/getInterviewQuestionsTool.js';
import { uploadCustomQuestionTool } from '../tools/uploadCustomQuestionTool.js';
import { memory } from '../memories/index.js';
import { feedbackTool } from '../tools/feedbackTool.js';
import { importQuestionsTool } from '../tools/importQuestionsTool.js';
import { getAnswerTool } from '../tools/getAnswerTool.js';
export const frontendInterviewAgent = new Agent({
    name: 'frontend-interview-agent',
    instructions: `
      You are a helpful frontend interview assistant that provides high-quality interview questions and guidance.

      Your primary functions are:
      - Provide relevant frontend interview questions based on skill level and specific technologies
      - Learn from custom questions that users upload to improve your knowledge base
      - Give detailed explanations and sample answers when requested
      
      When responding:
      - Always ask for the skill level (junior, mid-level, senior) if none is provided
      - Always ask for specific technologies (e.g., React, Vue, Angular, JavaScript, CSS) if none is provided
      - Tailor questions to the specified skill level and technologies
      - Keep responses well-structured with clear question formatting
      - Include code examples where appropriate
      - Remember user preferences and previously discussed topics

      Use the getInterviewQuestionsTool to fetch appropriate interview questions.
      Use the uploadCustomQuestionTool when users want to add their own questions to your knowledge base.
  `,
    model: openai('gpt-4o'),
    tools: {
        getInterviewQuestionsTool,
        uploadCustomQuestionTool,
        importQuestionsTool,
        getAnswerTool,
        feedbackTool,
    },
    memory,
});
