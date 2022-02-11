// Load the morgan library - common name for variable is morgan
const morgan = require('morgan');

// Load the winston library - common name for variable is winston
const winston = require('winston');

// Load the filesystem library - common name for variable is fs
const fs = require('fs');

// Load the path library - common name for variable is path
const path = require('path');

// Load the rotating-file-stream library - common name for variable is rfs
const rfs = require('rotating-file-stream');

// Load the express library - common name for variable is "express"
const express = require('express');

var app = express();

// The relative directory containing the log files
const log_directory = "logs";
var logDirectory = path.resolve('logs');
console.log(`log dir: ${logDirectory}`);
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

var accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
});

// create a rotating write stream for dev logging
var devLogStream = rfs.createStream('dev.log', {
  interval: '1d', // rotate daily
  path: logDirectory
});

// setup dev info log
app.use(morgan('combined', {stream: accessLogStream}));

// setup Apache standard log format
app.use(morgan('dev', { stream: devLogStream }));

// Create a logger and setup transports
const logger = winston.createLogger({
  level: 'info',
  levels: winston.config.syslog.levels,
  format: winston.format.combine(winston.format.timestamp(),
    winston.format.json()),
  exitOnError: false,
  transports: [
    //
    // Write to all logs with level `info` and below to `combined.log`
    // Write all logs error (and below) to `error.log`.
    // Write unhandled exceptions to exceptions.log
    new winston.transports.File({ filename: `${logDirectory}/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${logDirectory}/combined.log` })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: `${logDirectory}/exceptions.log` })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
module.exports.logger = logger;
