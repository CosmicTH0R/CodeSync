import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DOCKER_IMAGE = 'codesync-executor:latest'
const TIMEOUT_SECONDS = 5
const MEMORY_LIMIT = '256m'
const CPU_LIMIT = '0.5'

// Use OS temp directory for cross-platform compatibility
const TEMP_BASE_DIR = path.join(os.tmpdir(), 'codesync-exec')

/**
 * Execute code in a Docker container
 * @param {string} language - Programming language (cpp, python, javascript, java)
 * @param {string} code - Source code to execute
 * @param {string} input - Standard input for the program
 * @returns {Promise<{status: string, stdout: string, stderr: string, time: number, memory: number}>}
 */
export async function executeCodeInDocker(language, code, input) {
  const startTime = Date.now()
  let containerId = null
  let tempDir = null
  // Ensure Docker is available and the executor image exists (build if necessary)
  if (!(await isDockerAvailable())) {
    throw new Error('Docker is not available on the host. Please ensure Docker is running.')
  }

  // If image missing, try to build it automatically
  if (!(await isImagePresent())) {
    console.log('[Docker] Executor image not found locally, attempting to build...')
    const built = await buildDockerImage()
    if (!built) {
      throw new Error(`Docker image ${DOCKER_IMAGE} not found and automatic build failed.`)
    }
  }
  try {
    // Create a unique container name
    containerId = `codesync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Write source code to a temporary file on host (will be copied to container)
    const sourceFile = getSourceFileName(language)
    const containerSourcePath = `/tmp/execution/${sourceFile}`

    // Create temporary directory for this execution
    tempDir = path.join(TEMP_BASE_DIR, containerId)
    await fs.mkdir(tempDir, { recursive: true })

    const hostSourcePath = path.join(tempDir, sourceFile)
    await fs.writeFile(hostSourcePath, code)

    console.log(`[Docker] Created temp file: ${hostSourcePath}`)
    console.log(`[Docker] Container source path: ${containerSourcePath}`)

    // Build docker run command with resource limits
    const dockerCmd = [
      'docker', 'run',
      '--rm', // Remove container after execution
      '--name', containerId,
      '--memory', MEMORY_LIMIT,
      '--cpus', CPU_LIMIT,
      '--network', 'none', // Disable network
      '--read-only', // Make filesystem read-only
      '--tmpfs', '/tmp:rw,size=100m', // Temporary writable tmpfs
      '-v', `${hostSourcePath}:${containerSourcePath}:ro`, // Mount source as read-only
      '-w', '/tmp/execution',
      DOCKER_IMAGE,
      'bash', '-c', getExecutionCommand(language, sourceFile, input)
    ]

    const fullCmd = dockerCmd.join(' ')
    console.log(`[Docker] Executing: ${language} in container ${containerId}`)
    console.log(`[Docker] Command: ${fullCmd}`)

    const { stdout, stderr } = await execAsync(fullCmd, {
      timeout: TIMEOUT_SECONDS * 1000,
      maxBuffer: 10 * 1024 * 1024, // 10MB max output
    })

    const executionTime = Date.now() - startTime

    console.log(`[Docker] Execution successful. Time: ${executionTime}ms`)
    console.log(`[Docker] Stdout: ${stdout}`)
    console.log(`[Docker] Stderr: ${stderr}`)

    return {
      status: 'Accepted',
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      time: executionTime,
      memory: 0,
      language,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime

    console.error(`[Docker] Execution error:`, error.message)
    console.error(`[Docker] stdout: ${error.stdout}`)
    console.error(`[Docker] stderr: ${error.stderr}`)

    // Handle timeout
    if (error.killed || error.signal === 'SIGTERM') {
      return {
        status: 'Timeout',
        stdout: error.stdout || '',
        stderr: `Execution exceeded ${TIMEOUT_SECONDS} second time limit`,
        time: executionTime,
        memory: 0,
        language,
      }
    }

    // Handle other errors
    return {
      status: 'Runtime Error',
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || 'Unknown error',
      time: executionTime,
      memory: 0,
      language,
    }
  } finally {
    // Clean up temporary files
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
        console.log(`[Docker] Cleaned up temp dir: ${tempDir}`)
      } catch (err) {
        console.warn(`[Docker] Failed to clean up temp dir: ${err.message}`)
      }
    }
  }
}

/**
 * Get source file name based on language
 */
function getSourceFileName(language) {
  const fileMap = {
    cpp: 'solution.cpp',
    python: 'solution.py',
    javascript: 'solution.js',
    java: 'Solution.java',
  }
  return fileMap[language] || 'solution.txt'
}

/**
 * Get execution command for language
 */
function getExecutionCommand(language, sourceFile, input) {
  const inputCmd = input ? `echo '${input.replace(/'/g, "'\\''")}' |` : ''

  const commands = {
    cpp: `g++ -O2 /tmp/execution/${sourceFile} -o /tmp/execution/app && ${inputCmd} timeout ${TIMEOUT_SECONDS} /tmp/execution/app`,
    python: `${inputCmd} timeout ${TIMEOUT_SECONDS} python3 /tmp/execution/${sourceFile}`,
    javascript: `${inputCmd} timeout ${TIMEOUT_SECONDS} node /tmp/execution/${sourceFile}`,
    java: `cd /tmp/execution && javac ${sourceFile} && ${inputCmd} timeout ${TIMEOUT_SECONDS} java ${sourceFile.replace('.java', '')}`,
  }

  return commands[language] || commands.python
}

/**
 * Build Docker image (run once during setup)
 */
export async function buildDockerImage() {
  try {
    const dockerfilePath = path.join(__dirname, '..', 'Dockerfile')
    console.log(`[Docker] Building image: ${DOCKER_IMAGE}`)

    const { stdout, stderr } = await execAsync(
      `docker build -t ${DOCKER_IMAGE} -f ${dockerfilePath} ${path.join(__dirname, '..')}`,
      { timeout: 60000 }
    )

    console.log('[Docker] Image build successful')
    return true
  } catch (error) {
    console.error('[Docker] Image build failed:', error.message)
    return false
  }
}

/**
 * Check if Docker is available
 */
export async function isDockerAvailable() {
  try {
    await execAsync('docker --version', { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/**
 * Check whether the executor docker image exists locally
 */
export async function isImagePresent() {
  try {
    // Try to inspect the image
    await execAsync(`docker image inspect ${DOCKER_IMAGE}`, { timeout: 10000 })
    return true
  } catch (err) {
    return false
  }
}
