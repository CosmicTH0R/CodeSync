/**
 * Simple in-memory execution queue for code submissions
 * For production, replace with Redis Queue or RabbitMQ
 */

class ExecutionQueue {
  constructor(maxConcurrent = 3) {
    this.queue = []
    this.activeJobs = new Map()
    this.maxConcurrent = maxConcurrent
    this.jobCounter = 0
  }

  /**
   * Enqueue an execution job
   */
  async enqueue(jobData) {
    const jobId = ++this.jobCounter
    const job = {
      id: jobId,
      ...jobData,
      createdAt: Date.now(),
      status: 'queued',
    }

    this.queue.push(job)
    console.log(`[Queue] Job ${jobId} enqueued. Queue length: ${this.queue.length}`)

    // Try to process next job
    this.processNext()

    return jobId
  }

  /**
   * Process next job in queue
   */
  async processNext() {
    if (this.activeJobs.size >= this.maxConcurrent) {
      console.log(`[Queue] Max concurrent jobs reached (${this.maxConcurrent})`)
      return
    }

    if (this.queue.length === 0) {
      return
    }

    const job = this.queue.shift()
    this.activeJobs.set(job.id, job)
    job.status = 'running'

    console.log(`[Queue] Processing job ${job.id}. Active jobs: ${this.activeJobs.size}`)

    try {
      // Execute the job
      const result = await job.executor()

      job.result = result
      job.status = 'completed'

      // Notify callback if provided
      if (job.onComplete) {
        job.onComplete(result)
      }
    } catch (error) {
      job.error = error
      job.status = 'failed'

      if (job.onError) {
        job.onError(error)
      }

      console.error(`[Queue] Job ${job.id} failed:`, error.message)
    } finally {
      this.activeJobs.delete(job.id)
      console.log(`[Queue] Job ${job.id} completed. Remaining: ${this.queue.length}`)

      // Process next job
      this.processNext()
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    const job = this.activeJobs.get(jobId) || this.queue.find(j => j.id === jobId)
    return job ? { id: job.id, status: job.status } : null
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      queued: this.queue.length,
      active: this.activeJobs.size,
      maxConcurrent: this.maxConcurrent,
    }
  }
}

// Global singleton instance
export const executionQueue = new ExecutionQueue(3)

export default ExecutionQueue
