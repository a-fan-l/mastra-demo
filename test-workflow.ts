import { mastra } from './src/mastra';

async function testWorkflow() {
  try {
    const workflow = mastra.getWorkflows().frontendInterviewWorkflow;

    // 测试获取问题
    console.log('Testing get-questions...');
    const { runId: questionsRunId, start: startQuestions } = workflow.createRun();
    const questionsResult = await startQuestions({
      triggerData: {
        action: 'get-questions',
        skillLevel: 'mid-level',
        technologies: ['react', 'typescript'],
        count: 2
      }
    });
    const questions = questionsResult.result.questions;
    console.log('Questions result:', JSON.stringify(questions, null, 2));

    // 获取第一个问题的ID
    const questionId = questions[0]?.id;
    if (!questionId) {
      throw new Error('No questions returned');
    }

    // 测试获取答案
    console.log('\nTesting get-answer...');
    const { runId: answerRunId, start: startAnswer } = workflow.createRun();
    const answerResult = await startAnswer({
      triggerData: {
        action: 'get-answer',
        questionId
      }
    });
    const answer = answerResult.result;
    console.log('Answer result:', JSON.stringify(answer, null, 2));

    // 测试提交反馈
    console.log('\nTesting submit-feedback...');
    const { runId: feedbackRunId, start: startFeedback } = workflow.createRun();
    const feedbackResult = await startFeedback({
      triggerData: {
        action: 'submit-feedback',
        questionId,
        rating: 5,
        comment: 'Great question!'
      }
    });
    const feedback = feedbackResult.result;
    console.log('Feedback result:', JSON.stringify(feedback, null, 2));

  } catch (error) {
    console.error('Error testing workflow:', error);
  }
}

testWorkflow(); 