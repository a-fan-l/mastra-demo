import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { db } from '../database/index.js';

export const getAnswerTool = createTool({
  id: 'get-answer',
  description: 'Get the answer for a specific interview question',
  inputSchema: z.object({
    questionId: z.string(),
  }),
  outputSchema: z.object({
    question: z.string(),
    answer: z.string(),
    difficulty: z.enum(['junior', 'mid-level', 'senior']),
    technologies: z.array(z.string()),
    relatedQuestions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      difficulty: z.enum(['junior', 'mid-level', 'senior']),
      technologies: z.array(z.string()),
    })).optional(),
  }),
  execute: async ({ context }) => {
    return await getQuestionAnswer(context.questionId);
  },
});

const getQuestionAnswer = async (questionId: string) => {
  try {
    // Get the question and its answer
    const question = await db.getQuestionById(questionId);
    if (!question) {
      throw new Error(`Question with ID ${questionId} not found`);
    }

    // Get related questions based on technologies and difficulty
    const relatedQuestions = await db.getQuestions(
      question.difficulty,
      question.technologies,
      3 // Limit to 3 related questions
    );

    // Filter out the current question from related questions
    const filteredRelatedQuestions = relatedQuestions
      .filter(q => q.id !== questionId)
      .map(q => ({
        id: q.id,
        question: q.question,
        difficulty: q.difficulty,
        technologies: q.technologies,
      }));

    return {
      question: question.question,
      answer: question.answer,
      difficulty: question.difficulty,
      technologies: question.technologies,
      relatedQuestions: filteredRelatedQuestions.length > 0 ? filteredRelatedQuestions : undefined,
    };
  } catch (error) {
    console.error('Error fetching question answer:', error);
    throw error;
  }
};
