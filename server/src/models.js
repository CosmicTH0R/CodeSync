import { v4 as uuid } from 'uuid';

export const buildRoomPayload = ({ roomId, createdBy, title }) => ({
  roomId,
  createdBy: createdBy || 'Anonymous',
  createdAt: new Date().toISOString(),
  problem: {
    id: roomId,
    title: title || '',
    difficulty: 'Custom',
    description: '',
    constraints: [],
    examples: []
  },
  defaultLanguage: 'cpp',
  starterCode: {
    cpp: '',
    javascript: '',
    python: '',
    java: ''
  },
  defaultTestCases: '',
  submissions: []
});

export const createSubmissionEntry = (code, input, language, stdout, stderr, status) => ({
  id: uuid(),
  code: typeof code === 'string' ? code : '',
  input: typeof input === 'string' ? input : '',
  stdout: typeof stdout === 'string' ? stdout : '',
  stderr: typeof stderr === 'string' ? stderr : '',
  language,
  status,
  createdAt: new Date().toISOString()
});

export const createExecutionResponse = (result, language, input) => ({
  status: result.status,
  language,
  input: input ?? '',
  stdout: result.stdout,
  stderr: result.stderr,
  message:
    result.status === 'Accepted' ? 'Code executed successfully.' :
    result.status === 'Runtime Error' ? 'Runtime error occurred.' :
    result.status === 'Compilation Error' ? 'Code has compilation errors.' :
    result.status === 'Time Limit Exceeded' ? 'Code execution timed out.' :
    'Execution completed.',
  time: parseFloat(result.time),
  memory: result.memory,
  submittedAt: new Date().toISOString()
});
