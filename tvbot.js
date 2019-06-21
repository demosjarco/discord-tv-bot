const workerThreadsPool = require('worker-threads-pool');

const wtPool = new workerThreadsPool({ max: require('os').cpus().length });