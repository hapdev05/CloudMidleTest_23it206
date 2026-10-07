const mongoose = require('mongoose');
const { readConnection, writeConnection } = require('../config/database');

const bookSchema = new mongoose.Schema({
  bookCode: {
    type: String,
    required: [true, 'Mã sách không được để trống'],
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Tên sách không được để trống'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Tác giả không được để trống'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Giá sách không được để trống'],
    min: [0, 'Giá sách không thể là số âm']
  },
  vatRate: {
    type: Number,
    required: true,
    default: 12
  },
  priceWithVAT: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: 'Công nghệ thông tin',
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Bóc tách Đa luồng mô hình Least Privilege:
// ReadBook dùng kết nối Tài khoản Read-Only
const ReadBook = readConnection.model('Book', bookSchema);

// WriteBook dùng kết nối Tài khoản Write
const WriteBook = writeConnection.model('Book', bookSchema);

module.exports = {
  ReadBook,
  WriteBook,
  bookSchema
};
