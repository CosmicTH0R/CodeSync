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
    cpp: `// Your First C++ Program

#include <iostream>

int main() {
    std::cout << "Hello World!";
    return 0;
}`,
    javascript: `// Your First JavaScript Program

function solution(input) {
    // Write your solution here
    console.log("Hello World!");
}

solution();`,
    python: `# Your First Python Program

def solution():
    # Write your solution here
    print("Hello World!")

if __name__ == "__main__":
    solution()`,
    java: `// Your First Java Program

public class Main {
    public static void main(String[] args) {
        // Write your solution here
        System.out.println("Hello World!");
    }
}`
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
