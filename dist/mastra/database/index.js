import { createClient } from '@libsql/client';
// Database connection
const client = createClient({
    url: process.env.DATABASE_URL || 'file:local.db'
});
// Helper function to convert Value to string
function valueToString(value) {
    return value === null ? '' : String(value);
}
// Helper function to convert Value to Date
function valueToDate(value) {
    return value === null ? new Date() : new Date(String(value));
}
// Helper function to parse JSON safely
function safeJSONParse(value, defaultValue) {
    if (value === null)
        return defaultValue;
    try {
        return JSON.parse(String(value));
    }
    catch {
        return defaultValue;
    }
}
export class Database {
    client;
    isConnected = false;
    constructor() {
        this.client = createClient({
            url: process.env.DATABASE_URL || 'file:local.db'
        });
        this.initializeTables();
    }
    async initializeTables() {
        try {
            // Create tables if they don't exist
            await this.client.execute({
                sql: `
          CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            difficulty TEXT CHECK(difficulty IN ('junior', 'mid-level', 'senior')),
            technologies TEXT NOT NULL,
            rating REAL DEFAULT 0,
            timesUsed INTEGER DEFAULT 0,
            source TEXT,
            dateAdded TEXT,
            category TEXT,
            createdAt TEXT,
            updatedAt TEXT,
            usageCount INTEGER DEFAULT 0,
            ratingCount INTEGER DEFAULT 0,
            lastRated TEXT
          )
        `,
                args: []
            });
            await this.client.execute({
                sql: `
          CREATE TABLE IF NOT EXISTS training_data (
            questionId TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            difficulty TEXT CHECK(difficulty IN ('junior', 'mid-level', 'senior')),
            technologies TEXT NOT NULL,
            dateAdded TEXT,
            metadata TEXT
          )
        `,
                args: []
            });
            await this.client.execute({
                sql: `
          CREATE TABLE IF NOT EXISTS user_preferences (
            userId TEXT PRIMARY KEY,
            preferredDifficulty TEXT,
            recentTechnologies TEXT NOT NULL,
            lastActive TEXT
          )
        `,
                args: []
            });
            await this.client.execute({
                sql: `
          CREATE TABLE IF NOT EXISTS interaction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            questionId TEXT NOT NULL,
            interaction TEXT CHECK(interaction IN ('viewed', 'answered', 'skipped', 'liked', 'disliked')),
            timestamp TEXT
          )
        `,
                args: []
            });
            await this.client.execute({
                sql: `
          CREATE TABLE IF NOT EXISTS feedback (
            id TEXT PRIMARY KEY,
            questionId TEXT NOT NULL,
            rating INTEGER CHECK(rating BETWEEN 1 AND 5),
            comment TEXT,
            createdAt TEXT
          )
        `,
                args: []
            });
            this.isConnected = true;
            console.log('Database tables initialized');
        }
        catch (error) {
            console.error('Failed to initialize database tables:', error);
            throw error;
        }
    }
    // Method to import bulk questions (e.g., from a JSON file)
    async importQuestions(questions) {
        try {
            const now = new Date().toISOString();
            for (const q of questions) {
                await this.client.execute({
                    sql: `
            INSERT INTO questions (
              id, question, answer, difficulty, technologies, rating, timesUsed,
              source, dateAdded, category, createdAt, updatedAt, usageCount, ratingCount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                    args: [
                        `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        q.question,
                        q.answer,
                        q.difficulty,
                        JSON.stringify(q.technologies),
                        0,
                        0,
                        'import',
                        now,
                        q.category,
                        now,
                        now,
                        0,
                        0
                    ]
                });
            }
            return { success: true, count: questions.length };
        }
        catch (error) {
            console.error('Error importing questions:', error);
            return { success: false, count: 0, error };
        }
    }
    // Method to get user preferences for personalization
    async getUserPreferences(userId) {
        try {
            const { rows } = await this.client.execute({
                sql: 'SELECT * FROM user_preferences WHERE userId = ?',
                args: [userId]
            });
            if (rows.length === 0)
                return null;
            const row = rows[0];
            return {
                userId: valueToString(row.userId),
                preferredDifficulty: valueToString(row.preferredDifficulty),
                recentTechnologies: safeJSONParse(row.recentTechnologies, []),
                lastActive: valueToDate(row.lastActive)
            };
        }
        catch (error) {
            console.error('Error fetching user preferences:', error);
            return null;
        }
    }
    // Record user interaction with questions
    async recordInteraction(userId, questionId, interaction) {
        try {
            await this.client.execute({
                sql: 'INSERT INTO interaction_history (userId, questionId, interaction, timestamp) VALUES (?, ?, ?, ?)',
                args: [userId, questionId, interaction, new Date().toISOString()]
            });
            // Update question rating if liked or disliked
            if (interaction === 'liked' || interaction === 'disliked') {
                const delta = interaction === 'liked' ? 0.1 : -0.1;
                await this.client.execute({
                    sql: 'UPDATE questions SET rating = rating + ? WHERE id = ?',
                    args: [delta, questionId]
                });
            }
        }
        catch (error) {
            console.error('Error recording interaction:', error);
        }
    }
    // Get training data for model fine-tuning
    async getTrainingData(limit = 100) {
        try {
            const { rows } = await this.client.execute({
                sql: 'SELECT * FROM training_data LIMIT ?',
                args: [limit]
            });
            return rows.map(row => ({
                questionId: valueToString(row.questionId),
                question: valueToString(row.question),
                answer: valueToString(row.answer),
                difficulty: valueToString(row.difficulty),
                technologies: safeJSONParse(row.technologies, []),
                dateAdded: valueToDate(row.dateAdded),
                metadata: safeJSONParse(row.metadata, undefined)
            }));
        }
        catch (error) {
            console.error('Error fetching training data:', error);
            return [];
        }
    }
    // Method to get questions
    async getQuestions(difficulty, technologies, limit) {
        try {
            const techPattern = technologies && technologies.length > 0
                ? `%${technologies[0]}%`
                : '%';
            const { rows } = await this.client.execute({
                sql: `
          SELECT * FROM questions 
          WHERE difficulty = ? 
          AND technologies LIKE ? 
          ORDER BY rating DESC, timesUsed DESC 
          LIMIT ?
        `,
                args: [difficulty, techPattern, limit]
            });
            return rows.map(row => ({
                id: valueToString(row.id),
                question: valueToString(row.question),
                answer: valueToString(row.answer),
                difficulty: valueToString(row.difficulty),
                technologies: safeJSONParse(row.technologies, []),
                rating: Number(row.rating) || 0,
                timesUsed: Number(row.timesUsed) || 0,
                source: valueToString(row.source),
                dateAdded: valueToDate(row.dateAdded),
                category: valueToString(row.category),
                createdAt: valueToDate(row.createdAt),
                updatedAt: valueToDate(row.updatedAt),
                usageCount: Number(row.usageCount) || 0,
                ratingCount: Number(row.ratingCount) || 0,
                lastRated: row.lastRated ? valueToDate(row.lastRated) : undefined
            }));
        }
        catch (error) {
            console.error('Error fetching questions:', error);
            return [];
        }
    }
    // Method to get a question by ID
    async getQuestionById(id) {
        try {
            const { rows } = await this.client.execute({
                sql: 'SELECT * FROM questions WHERE id = ?',
                args: [id]
            });
            if (rows.length === 0)
                return null;
            const row = rows[0];
            return {
                id: valueToString(row.id),
                question: valueToString(row.question),
                answer: valueToString(row.answer),
                difficulty: valueToString(row.difficulty),
                technologies: safeJSONParse(row.technologies, []),
                rating: Number(row.rating) || 0,
                timesUsed: Number(row.timesUsed) || 0,
                source: valueToString(row.source),
                dateAdded: valueToDate(row.dateAdded),
                category: valueToString(row.category),
                createdAt: valueToDate(row.createdAt),
                updatedAt: valueToDate(row.updatedAt),
                usageCount: Number(row.usageCount) || 0,
                ratingCount: Number(row.ratingCount) || 0,
                lastRated: row.lastRated ? valueToDate(row.lastRated) : undefined
            };
        }
        catch (error) {
            console.error('Error fetching question by ID:', error);
            return null;
        }
    }
    // Method to submit feedback for a question
    async submitFeedback(feedback) {
        try {
            // Start a transaction
            await this.client.execute({ sql: 'BEGIN TRANSACTION', args: [] });
            try {
                // Insert the feedback
                await this.client.execute({
                    sql: `
            INSERT INTO feedback (id, questionId, rating, comment, createdAt)
            VALUES (?, ?, ?, ?, ?)
          `,
                    args: [
                        feedback.id,
                        feedback.questionId,
                        feedback.rating,
                        feedback.comment || null,
                        feedback.createdAt.toISOString()
                    ]
                });
                // Get the current question
                const question = await this.getQuestionById(feedback.questionId);
                if (!question) {
                    throw new Error(`Question with ID ${feedback.questionId} not found`);
                }
                // Update the question's rating
                const newRating = (question.rating * question.ratingCount + feedback.rating) / (question.ratingCount + 1);
                await this.client.execute({
                    sql: `
            UPDATE questions 
            SET rating = ?, 
                ratingCount = ratingCount + 1,
                lastRated = ?
            WHERE id = ?
          `,
                    args: [newRating, feedback.createdAt.toISOString(), feedback.questionId]
                });
                // Commit the transaction
                await this.client.execute({ sql: 'COMMIT', args: [] });
            }
            catch (error) {
                // Rollback on error
                await this.client.execute({ sql: 'ROLLBACK', args: [] });
                throw error;
            }
        }
        catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
    }
    // Method to update question usage count
    async updateQuestionStats(questionIds) {
        try {
            const placeholders = questionIds.map(() => '?').join(',');
            await this.client.execute({
                sql: `
          UPDATE questions 
          SET timesUsed = timesUsed + 1 
          WHERE id IN (${placeholders})
        `,
                args: questionIds
            });
        }
        catch (error) {
            console.error('Error updating question stats:', error);
        }
    }
}
// Export a singleton instance
export const db = new Database();
