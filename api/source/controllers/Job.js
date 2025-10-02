const SmError = require('../utils/error');
const JobService = require(`../service/JobService`)


exports.getJobs = async (req, res, next) => {
  try {
    const projections = req.query.projection
    const jobs = await JobService.getJobs({projections})
    res.json(jobs)
  } catch (error) {
    next(error) 
  }
}

exports.postJob = async (req, res, next) => {
  try {
    const jobId = await JobService.createJob({
      jobData: req.body, 
      userId: req.userObject.userId, 
      svcStatus: res.svcStatus
    })
    const newJob = await JobService.getJob(jobId)
    res.status(201).json(newJob)
  } catch (error) {
    next(error)
  }
}

exports.getJob = async (req, res, next) => {
  try {
    const projections = req.query.projection
    const jobId = req.params.jobId
    const job = await JobService.getJob(jobId, {projections})
    if (!job) {
      throw new SmError.NotFoundError(`Job with ID [${jobId}] not found.`)
    }
    res.json(job)
  } catch (error) {
    next(error) 
  }
}

exports.deleteJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId
    const job = await JobService.getJob(jobId)
    if (!job) {
      throw new SmError.NotFoundError(`Job with ID [${jobId}] not found.`)
    }
    if (!job.createdBy.userId) {
      throw new SmError.UnprocessableError(`Job with ID [${jobId}] is a system job and cannot be deleted.`)
    }
    await JobService.deleteJob(jobId)
    res.status(204).end()
  } catch (error) {
    next(error) 
  }
}

exports.patchJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId
    await JobService.patchJob({
      jobId,
      jobData: req.body, 
      userId: req.userObject.userId, 
      svcStatus: res.svcStatus
    })
    const patchedJob = await JobService.getJob(jobId)
    res.status(200).json(patchedJob)
  } catch (error) {
    next(error)
  }
}

exports.getRunsByJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId
    const runs = await JobService.getRunsByJob(jobId)
    res.json(runs)
  } catch (error) {
    next(error)
  }
}

exports.runImmediateJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId
    const uuid = await JobService.runImmediateJob(jobId)
    res.json({runId: uuid})
  } catch (error) {
    next(error)
  }
}

exports.getRunById = async (req, res, next) => {
  try {
    const runId = req.params.runId
    const run = await JobService.getRunById(runId)
    if (!run) {
      throw new SmError.NotFoundError(`Run with ID [${runId}] not found.`)
    }
    res.json(run)
  } catch (error) {
    next(error) 
  }
}

exports.deleteRunByJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.getOutputByRun = async (req, res, next) => {
  try {
    const runId = req.params.runId
    const afterSeq = req.query['after-seq']
    const output = await JobService.getOutputByRun(runId, { filters: { afterSeq } })
    res.json(output)
  } catch (error) {
    next(error)
  } 
}

exports.getAllTasks = async (req, res, next) => {
  try {
    const tasks = await JobService.getAllTasks()
    res.json(tasks)
  } catch (error) {
    next(error)
  }
}


