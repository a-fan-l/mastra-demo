import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { db } from '../database/index.js';

// Define types for database records
interface QuestionRecord {
  id: string;
  question: string;
  answer: string;
  difficulty: 'junior' | 'mid-level' | 'senior';
  technologies: string[];
  rating: number;
  timesUsed: number;
}

export const getInterviewQuestionsTool = createTool({
  id: 'get-interview-questions',
  description: 'Get frontend interview questions based on skill level and technologies',
  inputSchema: z.object({
    skillLevel: z.enum(['junior', 'mid-level', 'senior']),
    technologies: z.array(z.string()).describe('List of technologies (e.g., React, Vue, JavaScript)'),
    count: z.number().default(5).describe('Number of questions to return'),
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
  execute: async ({ context }) => {
    return await getQuestions(context.skillLevel, context.technologies, context.count);
  },
});

const getQuestions = async (
  skillLevel: 'junior' | 'mid-level' | 'senior',
  technologies: string[],
  count: number
) => {
  try {
    // Query the database for matching questions
    const questions = await db.getQuestions(skillLevel, technologies, count);

    // If not enough questions found, include default questions based on technologies
    if (questions.length < count) {
      const additionalQuestions = getDefaultQuestions(skillLevel, technologies, count - questions.length);
      
      // Merge with database questions
      const combinedQuestions = [
        ...questions,
        ...additionalQuestions
      ];

      // Update usage statistics in the background
      db.updateQuestionStats(questions.map(q => q.id));
      
      return {
        questions: combinedQuestions.map(q => ({
          id: q.id,
          question: q.question,
          difficulty: q.difficulty,
          technologies: q.technologies,
          hasDetailedAnswer: Boolean(q.answer),
        })),
      };
    }

    // Update usage statistics in the background
    db.updateQuestionStats(questions.map(q => q.id));

    return {
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        difficulty: q.difficulty,
        technologies: q.technologies,
        hasDetailedAnswer: Boolean(q.answer),
      })),
    };
  } catch (error) {
    console.error('Error fetching interview questions:', error);
    // Fallback to default questions if database fails
    const defaultQuestions = getDefaultQuestions(skillLevel, technologies, count);
    
    return {
      questions: defaultQuestions.map(q => ({
        id: q.id,
        question: q.question,
        difficulty: q.difficulty,
        technologies: q.technologies,
        hasDetailedAnswer: Boolean(q.answer),
      })),
    };
  }
};

// Provide default questions if database is empty or fails
const getDefaultQuestions = (
  skillLevel: 'junior' | 'mid-level' | 'senior',
  technologies: string[],
  count: number
): QuestionRecord[] => {
  const defaultQuestions: Record<string, Record<string, QuestionRecord[]>> = {
    junior: {
      JavaScript: [
        {
          id: 'js-junior-1',
          question: 'Explain the difference between let, const, and var in JavaScript.',
          answer: 'var has function scope and can be redeclared and updated. let has block scope, can be updated but not redeclared. const has block scope and cannot be updated or redeclared.',
          difficulty: 'junior',
          technologies: ['JavaScript'],
          rating: 4.5,
          timesUsed: 0
        },
        {
          id: 'js-junior-2',
          question: 'What is the difference between == and === operators?',
          answer: '== compares values after type conversion while === compares both value and type without conversion.',
          difficulty: 'junior',
          technologies: ['JavaScript'],
          rating: 4.2,
          timesUsed: 0
        },
      ],
      React: [
        {
          id: 'react-junior-1',
          question: 'What is JSX in React?',
          answer: 'JSX is a syntax extension for JavaScript that looks similar to HTML and allows you to write HTML elements in JavaScript. It makes it easier to write and add HTML in React.',
          difficulty: 'junior',
          technologies: ['React', 'JavaScript'],
          rating: 4.7,
          timesUsed: 0
        },
        {
          id: 'react-junior-2',
          question: 'Explain the purpose of useState hook in React.',
          answer: 'useState is a Hook that lets you add React state to function components. It returns a stateful value and a function to update it.',
          difficulty: 'junior',
          technologies: ['React', 'JavaScript'],
          rating: 4.8,
          timesUsed: 0
        },
      ],
      CSS: [
        {
          id: 'css-junior-1',
          question: 'What is the box model in CSS?',
          answer: 'The CSS box model is a box that wraps around every HTML element. It consists of: content, padding, border, and margin.',
          difficulty: 'junior',
          technologies: ['CSS'],
          rating: 4.3,
          timesUsed: 0
        },
      ]
    },
    'mid-level': {
      JavaScript: [
        {
          id: 'js-mid-1',
          question: 'Explain event delegation in JavaScript and its benefits.',
          answer: 'Event delegation is a technique of attaching a single event listener to a parent element to handle events for its current and future children. Benefits include memory efficiency and not having to rebind handlers after DOM changes.',
          difficulty: 'mid-level',
          technologies: ['JavaScript'],
          rating: 4.6,
          timesUsed: 0
        },
        {
          id: 'js-mid-2',
          question: 'Explain closures in JavaScript with a practical example.',
          answer: 'A closure is when a function can remember and access variables from the place where it was defined, even after that outer function has finished executing.',
          difficulty: 'mid-level',
          technologies: ['JavaScript'],
          rating: 4.9,
          timesUsed: 0
        },
      ],
      React: [
        {
          id: 'react-mid-1',
          question: 'How do React hooks work under the hood?',
          answer: 'React hooks rely on the order in which they are called. React keeps track of component state using a linked list where each node represents a hook call. This is why hooks cannot be used conditionally.',
          difficulty: 'mid-level',
          technologies: ['React', 'JavaScript'],
          rating: 4.5,
          timesUsed: 0
        },
      ]
    },
    senior: {
      JavaScript: [
        {
          id: 'js-senior-1',
          question: 'Implement a debounce function from scratch in JavaScript.',
          answer: 'A debounce function limits the rate at which a function can fire. It ensures that the function will not be executed until after a certain amount of time has passed since it was last called.',
          difficulty: 'senior',
          technologies: ['JavaScript'],
          rating: 4.8,
          timesUsed: 0
        },
      ],
      React: [
        {
          id: 'react-senior-1',
          question: 'Explain React Fiber architecture and its benefits.',
          answer: 'React Fiber is a complete reimplementation of React\'s core algorithm. It enables incremental rendering, splitting rendering work into chunks and spreading it out over multiple frames.',
          difficulty: 'senior',
          technologies: ['React', 'JavaScript'],
          rating: 4.9,
          timesUsed: 0
        },
      ],
      Performance: [
        {
          id: 'perf-senior-1',
          question: 'How would you implement code splitting in a large React application?',
          answer: 'Code splitting can be implemented using dynamic imports, React.lazy, and Suspense. This allows loading parts of your application only when they\'re needed.',
          difficulty: 'senior',
          technologies: ['React', 'JavaScript', 'Performance'],
          rating: 4.7,
          timesUsed: 0
        },
      ]
    }
  };

  const relevantQuestions: QuestionRecord[] = [];
  
  // Filter questions by technology
  technologies.forEach(tech => {
    const techKey = Object.keys(defaultQuestions[skillLevel])
      .find(key => key.toLowerCase() === tech.toLowerCase());
    
    if (techKey) {
      relevantQuestions.push(...defaultQuestions[skillLevel][techKey]);
    }
  });

  // If no questions found for specified technologies, include some general questions
  if (relevantQuestions.length === 0) {
    const generalTechs = Object.keys(defaultQuestions[skillLevel]);
    for (const tech of generalTechs) {
      relevantQuestions.push(...defaultQuestions[skillLevel][tech]);
    }
  }

  // Return random selection of questions up to count
  return relevantQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
};