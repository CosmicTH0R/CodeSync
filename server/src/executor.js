import { execSync, spawnSync } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { config } from './config.js'

const __dirname = config.PERSISTENCE_DIR

/**
 * Measures execution time and memory usage for a code execution function
 * @param {Function} executeFn - The function to execute
 * @returns {Object} Result with timing and memory info
 */
const measureExecution = async (executeFn) => {
  // Record start time using high-resolution timer
  const startTime = process.hrtime.bigint()
  const startMemory = process.memoryUsage()

  // Execute the function
  const result = await executeFn()

  // Calculate elapsed time in seconds (with ms precision)
  const endTime = process.hrtime.bigint()
  const elapsedNs = Number(endTime - startTime)
  const elapsedSeconds = elapsedNs / 1_000_000_000 // Convert nanoseconds to seconds

  // Calculate memory usage difference in KB
  const endMemory = process.memoryUsage()
  const memoryUsedKB = Math.max(0, Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024))

  return {
    ...result,
    time: Math.round(elapsedSeconds * 1000) / 1000, // Round to 3 decimal places
    memory: memoryUsedKB
  }
}

/**
 * Execute code in the specified language with timing and memory tracking
 */
export const executeCode = async (language, code, input = '') => {
  const tempId = randomBytes(8).toString('hex')

  try {
    if (language === 'javascript') {
      return await measureExecution(() => executeJavaScript(code, input))
    } else if (language === 'python') {
      return await measureExecution(() => executePython(code, input, tempId))
    } else if (language === 'cpp') {
      return await measureExecution(() => executeCpp(code, input, tempId))
    } else if (language === 'java') {
      return await measureExecution(() => executeJava(code, input, tempId))
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

/**
 * Execute JavaScript code using Node.js
 */
const executeJavaScript = (code, input) => {
  try {
    // Use spawnSync for better control and memory tracking
    const result = spawnSync('node', ['-e', code], {
      input,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    })

    if (result.error) {
      throw result.error
    }

    if (result.status !== 0) {
      return {
        status: 'Runtime Error',
        stdout: result.stdout || '',
        stderr: result.stderr || 'Process exited with non-zero status',
        time: 0,
        memory: 0
      }
    }

    return {
      status: 'Accepted',
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      time: 0,
      memory: 0
    }
  } catch (e) {
    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: e.stderr ? e.stderr.toString() : e.message,
      time: 0,
      memory: 0
    }
  }
}

/**
 * Execute Python code
 */
const executePython = (code, input, tempId) => {
  const pyFile = join(__dirname, `temp_${tempId}.py`)
  writeFileSync(pyFile, code)
  
  try {
    const result = spawnSync('python', [pyFile], {
      input,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    })

    cleanupFile(pyFile)

    if (result.error) {
      throw result.error
    }

    if (result.status !== 0) {
      return {
        status: 'Runtime Error',
        stdout: result.stdout || '',
        stderr: result.stderr || 'Process exited with non-zero status',
        time: 0,
        memory: 0
      }
    }

    return {
      status: 'Accepted',
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      time: 0,
      memory: 0
    }
  } catch (e) {
    cleanupFile(pyFile)
    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: e.stderr ? e.stderr.toString() : e.message,
      time: 0,
      memory: 0
    }
  }
}

/**
 * Execute C++ code
 */
const executeCpp = (code, input, tempId) => {
  const cppFile = join(__dirname, `temp_${tempId}.cpp`)
  const exeFile = join(__dirname, `temp_${tempId}.exe`)

  writeFileSync(cppFile, code)
  
  try {
    // Compile
    const compileResult = spawnSync('g++', [cppFile, '-o', exeFile], {
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    })

    if (compileResult.error || compileResult.status !== 0) {
      cleanupFile(cppFile)
      cleanupFile(exeFile)
      return {
        status: 'Compilation Error',
        stdout: '',
        stderr: compileResult.stderr || compileResult.error?.message || 'Compilation failed',
        time: 0,
        memory: 0
      }
    }

    // Execute
    const runResult = spawnSync(exeFile, [], {
      input,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    })

    cleanupFile(cppFile)
    cleanupFile(exeFile)

    if (runResult.error) {
      throw runResult.error
    }

    if (runResult.status !== 0) {
      return {
        status: 'Runtime Error',
        stdout: runResult.stdout || '',
        stderr: runResult.stderr || 'Process exited with non-zero status',
        time: 0,
        memory: 0
      }
    }

    return {
      status: 'Accepted',
      stdout: runResult.stdout || '',
      stderr: runResult.stderr || '',
      time: 0,
      memory: 0
    }
  } catch (e) {
    cleanupFile(cppFile)
    cleanupFile(exeFile)
    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: e.stderr ? e.stderr.toString() : e.message,
      time: 0,
      memory: 0
    }
  }
}

/**
 * Execute Java code
 */
const executeJava = (code, input, tempId) => {
  // Extract class name from code, default to Main
  const classNameMatch = code.match(/public\s+class\s+(\w+)/)
  const className = classNameMatch ? classNameMatch[1] : `Main_${tempId}`
  
  const javaFile = join(__dirname, `${className}.java`)
  writeFileSync(javaFile, code)
  const classFile = javaFile.replace('.java', '.class')

  try {
    // Compile
    const compileResult = spawnSync('javac', [javaFile], {
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    })

    if (compileResult.error || compileResult.status !== 0) {
      cleanupFile(javaFile)
      cleanupFile(classFile)
      return {
        status: 'Compilation Error',
        stdout: '',
        stderr: compileResult.stderr || compileResult.error?.message || 'Compilation failed',
        time: 0,
        memory: 0
      }
    }

    // Execute
    const runResult = spawnSync('java', ['-cp', __dirname, className], {
      input,
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    })

    cleanupFile(javaFile)
    cleanupFile(classFile)

    if (runResult.error) {
      throw runResult.error
    }

    if (runResult.status !== 0) {
      return {
        status: 'Runtime Error',
        stdout: runResult.stdout || '',
        stderr: runResult.stderr || 'Process exited with non-zero status',
        time: 0,
        memory: 0
      }
    }

    return {
      status: 'Accepted',
      stdout: runResult.stdout || '',
      stderr: runResult.stderr || '',
      time: 0,
      memory: 0
    }
  } catch (e) {
    cleanupFile(javaFile)
    cleanupFile(classFile)
    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: e.stderr ? e.stderr.toString() : e.message,
      time: 0,
      memory: 0
    }
  }
}

/**
 * Safely cleanup a temp file
 */
const cleanupFile = (filePath) => {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  } catch {
    // Ignore cleanup errors
  }
}
