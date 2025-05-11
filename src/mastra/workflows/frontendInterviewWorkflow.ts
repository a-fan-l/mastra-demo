import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

import { db } from '../database/index.js';
import { getInterviewQuestionsTool } from '../tools/getInterviewQuestionsTool.js';
import { getAnswerTool } from '../tools/getAnswerTool.js';
import { feedbackTool } from '../tools/feedbackTool.js';

const llm = openai('gpt-4o');

// 获取面试问题的步骤
const getQuestions = new Step({
  id: 'get-questions',
  description: 'Get interview questions based on skill level and technologies',
  inputSchema: z.object({
    skillLevel: z.enum(['junior', 'mid-level', 'senior']),
    technologies: z.array(z.string()),
    count: z.number().default(5),
  }),
  outputSchema: z.object({
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      difficulty: z.enum(['junior', 'mid-level', 'senior']),
      technologies: z.array(z.string()),
      hasDetailedAnswer: z.boolean(),
    })),
  }),
  execute: async ({ context }): Promise<{ questions: Array<{
    id: string;
    question: string;
    difficulty: 'junior' | 'mid-level' | 'senior';
    technologies: string[];
    hasDetailedAnswer: boolean;
  }> }> => {
    const { skillLevel, technologies, count } = context.inputData;
    return await getInterviewQuestionsTool.execute({
      context: {
        skillLevel,
        technologies,
        count,
      },
      runtimeContext: {
        db,
        llm,
      } as any,
    });
  },
});

// 获取问题答案的步骤
const getAnswer = new Step({
  id: 'get-answer',
  description: 'Get detailed answer for a specific question',
  inputSchema: z.object({
    questionId: z.string(),
  }),
  outputSchema: z.object({
    question: z.string(),
    answer: z.string(),
    technologies: z.array(z.string()),
    difficulty: z.enum(['junior', 'mid-level', 'senior']),
    relatedQuestions: z.array(z.object({
      id: z.string(),
      question: z.string(),
    })),
  }),
  execute: async ({ context }): Promise<{
    question: string;
    answer: string;
    technologies: string[];
    difficulty: 'junior' | 'mid-level' | 'senior';
    relatedQuestions: Array<{ id: string; question: string; }>;
  }> => {
    const { questionId } = context.inputData;
    const result = await getAnswerTool.execute({
      context: {
        questionId,
      },
      runtimeContext: {
        db,
        llm,
      } as any,
    });

    return {
      ...result,
      relatedQuestions: result.relatedQuestions?.map(q => ({
        id: q.id,
        question: q.question
      })) || []
    };
  },
});

// 提交反馈的步骤
const submitFeedback = new Step({
  id: 'submit-feedback',
  description: 'Submit feedback for a question',
  inputSchema: z.object({
    questionId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }): Promise<{ success: boolean; message: string; }> => {
    const { questionId, rating, comment } = context.inputData;
    return await feedbackTool.execute({
      context: {
        questionId,
        rating,
        comment,
      },
      runtimeContext: {
        db,
        llm,
      } as any,
    });
  },
});

// 创建工作流
const frontendInterviewWorkflow = new Workflow({
  name: 'frontend-interview-workflow',
  triggerSchema: z.object({
    action: z.enum(['get-questions', 'get-answer', 'submit-feedback']),
    skillLevel: z.enum(['junior', 'mid-level', 'senior']).optional(),
    technologies: z.array(z.string()).optional(),
    count: z.number().optional(),
    questionId: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
  }),
})
  .step(getQuestions)
  .step(getAnswer)
  .step(submitFeedback);

// 提交工作流
const committedWorkflow = frontendInterviewWorkflow.commit();

export { committedWorkflow as frontendInterviewWorkflow }; 