import { mastra } from './mastra/index.js';

export async function testWorkflow() {
  const workflow = mastra.getWorkflows().frontendInterviewWorkflow;
  const run = workflow.createRun();

  console.log('Testing get-questions step...');
  const questionsResult = await run.start({
    triggerData: {
      action: 'get-questions',
      skillLevel: 'mid-level',
      technologies: ['react', 'typescript'],
      count: 2
    }
  });
  console.log('Questions:', questionsResult.result.questions);

  if (questionsResult.result.questions.length === 0) {
    console.log('No questions returned');
    return;
  }

  console.log('\nTesting get-answer step...');
  const answerResult = await run.start({
    triggerData: {
      action: 'get-answer',
      questionId: questionsResult.result.questions[0].id
    }
  });
  console.log('Answer:', answerResult.result);

  console.log('\nTesting submit-feedback step...');
  const feedbackResult = await run.start({
    triggerData: {
      action: 'submit-feedback',
      questionId: questionsResult.result.questions[0].id,
      feedbackType: 'like',
      comment: 'Great question!'
    }
  });
  console.log('Feedback submitted:', feedbackResult.result);
}

testWorkflow().catch(console.error); 