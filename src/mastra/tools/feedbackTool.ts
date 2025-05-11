import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { db } from '../database/index.js';

export const feedbackTool = createTool({
  id: 'submit-feedback',
  description: 'Submit feedback for an interview question',
  inputSchema: z.object({
    questionId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    return await submitFeedback(context.questionId, context.rating, context.comment);
  },
});

const submitFeedback = async (questionId: string, rating: number, comment?: string) => {
  try {
    // Get the question to ensure it exists
    const question = await db.getQuestionById(questionId);
    if (!question) {
      return {
        success: false,
        message: `Question with ID ${questionId} not found`,
      };
    }

    // Submit feedback
    await db.submitFeedback({
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      questionId,
      rating,
      comment,
      createdAt: new Date(),
    });

    return {
      success: true,
      message: 'Feedback submitted successfully',
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      message: 'Failed to submit feedback',
    };
  }
};
