import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as path from 'path';
import pkg from 'papaparse';
const { parse } = pkg;
import sanitizeHtml from 'sanitize-html';
import { db } from '../database/index.js';
const FileSchema = z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string(),
});
export const importQuestionsTool = createTool({
    id: 'import-questions',
    description: 'Import custom frontend interview questions from JSON or CSV files',
    inputSchema: z.object({
        file: FileSchema.describe('The file containing questions to import'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        questionsImported: z.number(),
        failedQuestions: z.number(),
        message: z.string(),
    }),
    execute: async ({ context }) => {
        return await processImportFile(context.file);
    },
});
// Process the imported file and extract questions
const processImportFile = async (file) => {
    try {
        const fileExtension = path.extname(file.filename).toLowerCase();
        let questions = [];
        let failedCount = 0;
        // Process based on file type
        if (fileExtension === '.json') {
            questions = await processJsonFile(file.content);
        }
        else if (fileExtension === '.csv') {
            const result = await processCsvFile(file.content);
            questions = result.questions;
            failedCount = result.failedCount;
        }
        else {
            return {
                success: false,
                questionsImported: 0,
                failedQuestions: 0,
                message: `Unsupported file format: ${fileExtension}. Please upload JSON or CSV files.`,
            };
        }
        // Import questions to the database
        if (questions.length > 0) {
            const now = new Date();
            const preparedQuestions = questions.map(q => ({
                id: crypto.randomUUID(),
                question: q.question,
                answer: q.answer,
                category: q.category || 'frontend',
                difficulty: q.difficulty,
                technologies: q.technologies,
                rating: q.rating || 4.0,
                ratingCount: 0,
                usageCount: 0,
                timesUsed: 0,
                createdAt: now,
                updatedAt: now,
                dateAdded: now,
                source: 'import'
            }));
            await saveQuestions(preparedQuestions);
            return {
                success: true,
                questionsImported: questions.length,
                failedQuestions: failedCount,
                message: `Successfully imported ${questions.length} questions.${failedCount > 0 ? ` ${failedCount} questions were skipped due to validation errors.` : ''}`,
            };
        }
        else {
            return {
                success: false,
                questionsImported: 0,
                failedQuestions: failedCount,
                message: 'No valid questions found in the uploaded file.',
            };
        }
    }
    catch (error) {
        console.error('Error processing import file:', error);
        return {
            success: false,
            questionsImported: 0,
            failedQuestions: 0,
            message: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};
// Process JSON formatted question file
const processJsonFile = async (content) => {
    try {
        const data = JSON.parse(content);
        // Handle array of questions
        if (Array.isArray(data)) {
            return validateQuestions(data);
        }
        // Handle object with questions property
        else if (data.questions && Array.isArray(data.questions)) {
            return validateQuestions(data.questions);
        }
        else {
            throw new Error('Invalid JSON format. Expected an array of questions or an object with a questions array.');
        }
    }
    catch (error) {
        console.error('Error processing JSON file:', error);
        throw error;
    }
};
// Process CSV formatted question file
const processCsvFile = async (content) => {
    try {
        const result = parse(content, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
        });
        const validQuestions = [];
        let failedCount = 0;
        for (const row of result.data) {
            try {
                // Check required fields
                if (!row.question || !row.difficulty) {
                    failedCount++;
                    continue;
                }
                // Format technologies (can be comma-separated string or array)
                let technologies = [];
                if (typeof row.technologies === 'string') {
                    technologies = row.technologies.split(',').map(tech => tech.trim());
                }
                else if (Array.isArray(row.technologies)) {
                    technologies = row.technologies;
                }
                // Validate difficulty
                const difficulty = String(row.difficulty).toLowerCase();
                if (!['junior', 'mid-level', 'senior'].includes(difficulty)) {
                    failedCount++;
                    continue;
                }
                validQuestions.push({
                    question: sanitizeHtml(String(row.question)),
                    answer: row.answer ? sanitizeHtml(String(row.answer)) : '',
                    difficulty: difficulty,
                    technologies: technologies.filter(Boolean),
                    rating: typeof row.rating === 'number' ? row.rating : 4.0,
                    category: row.category || 'frontend',
                });
            }
            catch (error) {
                failedCount++;
            }
        }
        return {
            questions: validQuestions,
            failedCount,
        };
    }
    catch (error) {
        console.error('Error processing CSV file:', error);
        throw error;
    }
};
// Validate question data
const validateQuestions = (questions) => {
    const validQuestions = [];
    for (const q of questions) {
        try {
            const question = q;
            // Check required fields
            if (!question.question || !question.difficulty) {
                continue;
            }
            // Validate difficulty
            const difficulty = String(question.difficulty).toLowerCase();
            if (!['junior', 'mid-level', 'senior'].includes(difficulty)) {
                continue;
            }
            // Ensure technologies is an array
            let technologies = [];
            if (typeof question.technologies === 'string') {
                technologies = question.technologies.split(',').map((tech) => tech.trim());
            }
            else if (Array.isArray(question.technologies)) {
                technologies = question.technologies;
            }
            validQuestions.push({
                question: sanitizeHtml(String(question.question)),
                answer: question.answer ? sanitizeHtml(String(question.answer)) : '',
                difficulty: difficulty,
                technologies: technologies.filter(Boolean),
                rating: typeof question.rating === 'number' ? question.rating : 4.0,
                category: question.category || 'frontend',
            });
        }
        catch (error) {
            // Skip invalid questions
            console.error('Error validating question:', error);
        }
    }
    return validQuestions;
};
async function saveQuestions(questions) {
    try {
        const preparedQuestions = questions.map(q => ({
            ...q,
            technologies: JSON.stringify(q.technologies),
            dateAdded: new Date().toISOString(),
            timesUsed: 0
        }));
        for (const q of preparedQuestions) {
            await db.client.execute({
                sql: `INSERT INTO questions (
          question,
          answer,
          difficulty,
          technologies,
          category,
          timesUsed,
          dateAdded
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    q.question,
                    q.answer,
                    q.difficulty,
                    q.technologies,
                    q.category || 'frontend',
                    q.timesUsed,
                    q.dateAdded
                ]
            });
        }
        return true;
    }
    catch (error) {
        console.error('Error saving questions:', error);
        return false;
    }
}
