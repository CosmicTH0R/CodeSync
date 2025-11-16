import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { config } from './config.js'
import { executeCodeInDocker, isDockerAvailable } from './docker-executor.js'

const __dirname = config.PERSISTENCE_DIR
let dockerAvailable = false

// Initialize Docker availability check on startup
async function initDocker() {
  dockerAvailable = await isDockerAvailable()
  if (dockerAvailable) {
    console.log('[Executor] Docker is available - will use containerized execution')
  } else {
    console.log('[Executor] Docker not available - falling back to local execution')
  }
}

initDocker()

export const executeCode = async (language, code, input = '') => {
  // Use Docker if available, otherwise fall back to local execution
  if (dockerAvailable) {
    try {
      return await executeCodeInDocker(language, code, input)
    } catch (error) {
      console.warn('[Executor] Docker execution failed, falling back to local:', error.message)
      // Fall through to local execution
    }
  }

  // Local execution fallback
  const tempId = randomBytes(8).toString('hex')

  try {
    if (language === 'javascript') {
      return executeJavaScript(code, input)
    } else if (language === 'python') {
      return executePython(code, input, tempId)
    } else if (language === 'cpp') {
      return executeCpp(code, input, tempId)
    } else if (language === 'java') {
      return executeJava(code, input, tempId)
    }

    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      time: 0,
      memory: 0
    }
  } catch (error) {
    console.error(`[Execute] ${language} error:`, error.message)
    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: error.message || error.toString(),
      time: 0,
      memory: 0
    }
  }
}

const executeJavaScript = (code, input) => {
  try {
    const result = execSync(`node -e "${code.replace(/"/g, '\\"')}"`, {
      input,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024
    });
    return {
      status: 'Accepted',
      stdout: result,
      stderr: '',
      time: 0,
      memory: 0
    };
  } catch (e) {
    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: e.stderr ? e.stderr.toString() : e.message,
      time: 0,
      memory: 0
    };
  }
};

const executePython = (code, input, tempId) => {
  const pyFile = join(__dirname, `temp_${tempId}.py`);
  writeFileSync(pyFile, code);
  try {
    const result = execSync(`python "${pyFile}"`, {
      input,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024
    });
    unlinkSync(pyFile);
    return {
      status: 'Accepted',
      stdout: result,
      stderr: '',
      time: 0,
      memory: 0
    };
  } catch (e) {
    try { unlinkSync(pyFile); } catch {}
    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: e.stderr ? e.stderr.toString() : e.message,
      time: 0,
      memory: 0
    };
  }
};

const executeCpp = (code, input, tempId) => {
  const cppFile = join(__dirname, `temp_${tempId}.cpp`);
  const exeFile = join(__dirname, `temp_${tempId}.exe`);
  
  writeFileSync(cppFile, code);
  try {
    execSync(`g++ "${cppFile}" -o "${exeFile}"`, {
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024
    });
    try {
      const result = execSync(`"${exeFile}"`, {
        input,
        encoding: 'utf8',
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024
      });
      unlinkSync(cppFile);
      unlinkSync(exeFile);
      return {
        status: 'Accepted',
        stdout: result,
        stderr: '',
        time: 0,
        memory: 0
      };
    } catch (runtimeErr) {
      unlinkSync(cppFile);
      unlinkSync(exeFile);
      return {
        status: 'Runtime Error',
        stdout: '',
        stderr: runtimeErr.stderr ? runtimeErr.stderr.toString() : runtimeErr.message,
        time: 0,
        memory: 0
      };
    }
  } catch (compileErr) {
    try { unlinkSync(cppFile); } catch {}
    try { unlinkSync(exeFile); } catch {}
    return {
      status: 'Compilation Error',
      stdout: '',
      stderr: compileErr.stderr ? compileErr.stderr.toString() : compileErr.message,
      time: 0,
      memory: 0
    };
  }
};

const executeJava = (code, input, tempId) => {
  const javaFile = join(__dirname, `Main_${tempId}.java`);
  writeFileSync(javaFile, code);
  try {
    execSync(`javac "${javaFile}"`, {
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024
    });
    try {
      const result = execSync(`java -cp "${__dirname}" Main_${tempId}`, {
        input,
        encoding: 'utf8',
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024
      });
      unlinkSync(javaFile);
      const classFile = javaFile.replace('.java', '.class');
      try { unlinkSync(classFile); } catch {}
      return {
        status: 'Accepted',
        stdout: result,
        stderr: '',
        time: 0,
        memory: 0
      };
    } catch (runtimeErr) {
      unlinkSync(javaFile);
      const classFile = javaFile.replace('.java', '.class');
      try { unlinkSync(classFile); } catch {}
      return {
        status: 'Runtime Error',
        stdout: '',
        stderr: runtimeErr.stderr ? runtimeErr.stderr.toString() : runtimeErr.message,
        time: 0,
        memory: 0
      };
    }
  } catch (compileErr) {
    try { unlinkSync(javaFile); } catch {}
    return {
      status: 'Compilation Error',
      stdout: '',
      stderr: compileErr.stderr ? compileErr.stderr.toString() : compileErr.message,
      time: 0,
      memory: 0
    };
  }
};
