const mongoose = require('mongoose');
require('dotenv').config();

const readUri = process.env.MONGODB_READ_URI || 'mongodb://localhost:27017/DB_23IT206';
const writeUri = process.env.MONGODB_WRITE_URI || 'mongodb://localhost:27017/DB_23IT206';

// Option flags for Mongoose connection creation
const options = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  tlsAllowInvalidCertificates: true
};

// 1. Connection dành riêng cho Luồng ĐỌC (Read-Only User Account)
const readConnection = mongoose.createConnection(readUri, options);

// 2. Connection dành riêng cho Luồng GHI (Write User Account)
const writeConnection = mongoose.createConnection(writeUri, options);

readConnection.on('connected', () => {
  console.log('✅ [MongoDB Cloud - Read Node] Kết nối thành công bằng tài khoản READ-ONLY!');
});

readConnection.on('error', (err) => {
  console.error('❌ [MongoDB Cloud - Read Node] Lỗi kết nối Read-Only User:', err.message);
});

writeConnection.on('connected', () => {
  console.log('✅ [MongoDB Cloud - Write Node] Kết nối thành công bằng tài khoản WRITE!');
});

writeConnection.on('error', (err) => {
  console.error('❌ [MongoDB Cloud - Write Node] Lỗi kết nối Write User:', err.message);
});

module.exports = {
  readConnection,
  writeConnection
};
