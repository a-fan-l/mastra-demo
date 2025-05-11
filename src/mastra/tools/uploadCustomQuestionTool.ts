import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../database/index.js';

export const uploadCustomQuestionTool = createTool({
  id: 'upload-custom-question',
  description: 'Upload custom frontend interview questions to improve the knowledge base',
  inputSchema: z.object({
    question: z.string().describe('The interview question text'),
    answer: z.string().optional().describe('The answer to the question (optional)'),
    difficulty: z.enum(['junior', 'mid-level', 'senior']).describe('Difficulty level of the question'),
    technologies: z.array(z.string()).describe('Technologies related to this question (e.g., React, Vue, JavaScript)'),
    category: z.string().default('frontend').describe('Category of the question'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    questionId: z.string(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    return await saveCustomQuestion(
      context.question,
      context.answer || '',
      context.difficulty,
      context.technologies,
      context.category
    );
  },
});

// Function to store custom questions in the database
const saveCustomQuestion = async (
  question: string,
  answer: string,
  difficulty: 'junior' | 'mid-level' | 'senior',
  technologies: string[],
  category: string
) => {
  try {
    // Check for similar questions
    const result = await db.client.execute({
      sql: "SELECT * FROM questions WHERE question = ?",
      args: [question]
    });
    
    const similarQuestion = result.rows[0];

    if (similarQuestion) {
      // Update existing question
      await db.client.execute({
        sql: `UPDATE questions 
              SET answer = ?, 
                  difficulty = ?, 
                  technologies = ?, 
                  category = ?, 
                  updatedAt = CURRENT_TIMESTAMP 
              WHERE question = ?`,
        args: [
          answer,
          difficulty,
          JSON.stringify(technologies),
          category || 'frontend',
          question
        ]
      });

      return {
        success: true,
        questionId: similarQuestion.id as string,
        message: 'Question updated successfully'
      };
    }

    // Insert new question
    const insertResult = await db.client.execute({
      sql: `INSERT INTO questions (
              question, 
              answer, 
              difficulty, 
              technologies, 
              category, 
              timesUsed, 
              dateAdded
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        question,
        answer,
        difficulty,
        JSON.stringify(technologies),
        category || 'frontend',
        0
      ]
    });

    // Add to training data
    await db.client.execute({
      sql: `INSERT INTO training_data (
              question,
              originalAnswer,
              userAnswer,
              userComment,
              metadata,
              timestamp
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        question,
        answer,
        null,
        null,
        JSON.stringify({ source: null })
      ]
    });

    return {
      success: true,
      questionId: insertResult.lastInsertRowid?.toString() || '',
      message: 'Question added successfully'
    };
  } catch (error) {
    console.error('Error saving custom question:', error);
    return {
      success: false,
      questionId: '',
      message: 'Failed to save question'
    };
  }
};