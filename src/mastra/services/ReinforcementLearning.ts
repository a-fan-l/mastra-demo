// import { type Question, type QuestionFeedback, type LearningMetrics } from '../types/frontendInterview';
// import { Database } from '../database/index.js';

// export class ReinforcementLearningService {
//   private readonly db: Database;
//   private readonly learningRate = 0.1;
//   private readonly decayFactor = 0.95;

//   constructor(db: Database) {
//     this.db = db;
//   }

//   async updateQuestionMetrics(feedback: QuestionFeedback): Promise<void> {
//     const question = await this.db.getQuestionById(feedback.questionId);
//     if (!question) return;

//     // 更新问题的成功率
//     const newSuccessRate = this.calculateNewSuccessRate(
//       question.successRate,
//       feedback.isCorrect
//     );

//     // 更新平均尝试次数
//     const newAverageAttempts = this.calculateNewAverageAttempts(
//       question.averageAttempts,
//       feedback.attemptCount,
//       question.usageCount
//     );

//     // 更新置信度分数
//     const newConfidenceScore = this.calculateNewConfidenceScore(
//       question.confidenceScore,
//       feedback.confidenceLevel,
//       feedback.isCorrect
//     );

//     // 计算自适应难度
//     const newAdaptiveDifficulty = this.calculateAdaptiveDifficulty(
//       question.adaptiveDifficulty,
//       newSuccessRate,
//       newAverageAttempts
//     );

//     // 更新问题统计信息
//     await this.db.updateQuestionStats(feedback.questionId, {
//       successRate: newSuccessRate,
//       averageAttempts: newAverageAttempts,
//       confidenceScore: newConfidenceScore,
//       adaptiveDifficulty: newAdaptiveDifficulty,
//       usageCount: question.usageCount + 1,
//     });

//     // 记录学习指标
//     await this.recordLearningMetrics(feedback.questionId, {
//       currentSuccessRate: newSuccessRate,
//       difficultyAdjustment: newAdaptiveDifficulty,
//       lastUpdateTime: new Date(),
//       performanceHistory: [{
//         timestamp: new Date(),
//         successRate: newSuccessRate,
//         averageAttempts: newAverageAttempts,
//       }],
//     });
//   }

//   private calculateNewSuccessRate(currentRate: number, isCorrect: boolean): number {
//     return currentRate * this.decayFactor + (isCorrect ? 1 : 0) * (1 - this.decayFactor);
//   }

//   private calculateNewAverageAttempts(
//     currentAverage: number,
//     newAttempts: number,
//     totalUsage: number
//   ): number {
//     return (currentAverage * totalUsage + newAttempts) / (totalUsage + 1);
//   }

//   private calculateNewConfidenceScore(
//     currentScore: number,
//     userConfidence: number,
//     isCorrect: boolean
//   ): number {
//     const confidenceError = isCorrect ? 
//       Math.abs(1 - userConfidence) : 
//       Math.abs(0 - userConfidence);
//     return currentScore * this.decayFactor + 
//       (1 - confidenceError) * (1 - this.decayFactor);
//   }

//   private calculateAdaptiveDifficulty(
//     currentDifficulty: number,
//     successRate: number,
//     averageAttempts: number
//   ): number {
//     // 目标成功率为 0.7
//     const targetSuccessRate = 0.7;
//     const successRateAdjustment = (targetSuccessRate - successRate) * this.learningRate;
    
//     // 理想尝试次数为 2
//     const attemptsPenalty = Math.max(0, (averageAttempts - 2) * 0.1);
    
//     return Math.max(0, Math.min(1,
//       currentDifficulty + successRateAdjustment + attemptsPenalty
//     ));
//   }

//   private async recordLearningMetrics(
//     questionId: string,
//     metrics: LearningMetrics
//   ): Promise<void> {
//     // 实现记录学习指标的逻辑
//     await this.db.recordLearningMetrics(questionId, metrics);
//   }

//   async getRecommendedQuestions(userId: string): Promise<Question[]> {
//     // 获取用户历史记录和偏好
//     const userHistory = await this.db.getUserHistory(userId);
//     const userPreferences = await this.db.getUserPreferences(userId);

//     // 获取所有问题
//     const allQuestions = await this.db.getQuestions();

//     // 计算每个问题的推荐分数
//     const scoredQuestions = allQuestions.map(question => ({
//       question,
//       score: this.calculateRecommendationScore(
//         question,
//         userHistory,
//         userPreferences
//       )
//     }));

//     // 按分数排序并返回前10个问题
//     return scoredQuestions
//       .sort((a, b) => b.score - a.score)
//       .slice(0, 10)
//       .map(sq => sq.question);
//   }

//   private calculateRecommendationScore(
//     question: Question,
//     userHistory: any[],
//     userPreferences: any
//   ): number {
//     // 基础分数
//     let score = question.rating;

//     // 根据难度调整分数
//     score *= (1 + question.adaptiveDifficulty);

//     // 根据用户历史调整分数
//     const hasAttempted = userHistory.some(h => h.questionId === question.id);
//     if (hasAttempted) {
//       score *= 0.5; // 降低已尝试过的问题的优先级
//     }

//     // 根据用户偏好调整分数
//     if (userPreferences.technologies?.includes(question.technologies[0])) {
//       score *= 1.2; // 提高用户感兴趣技术的问题优先级
//     }

//     return score;
//   }
// } 