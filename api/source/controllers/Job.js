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
    const deleted = await JobService.deleteJob(jobId)
    if (!deleted) {
      throw new SmError.NotFoundError(`Job with ID [${jobId}] not found.`)
    }
    res.status(204).end()
  } catch (error) {
    next(error) 
  }
}

exports.patchJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.getEventsByJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.postEventByJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.getRunsByJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.runImmediateJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.getRunByJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.deleteRunByJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.getOutputByJobRun = async (req, res, next) => {
  res.end('Not implemented');
}

exports.getTasksByJob = async (req, res, next) => {
  res.end('Not implemented');
}

exports.putTasksByJob = async (req, res, next) => {
  res.end('Not implemented');
}

