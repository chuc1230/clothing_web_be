const winston = require('winston');
const path = require('path');

// Cấu hình định dạng log
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // 1. In log ra console để debug nhanh
    new winston.transports.Console(),
    // 2. Ghi log lỗi vào file error.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error' 
    }),
    // 3. Ghi tất cả log vào file combined.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log') 
    })
  ],
});

module.exports = logger;