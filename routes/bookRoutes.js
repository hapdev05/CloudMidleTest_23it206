const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { validateBookData } = require('../middleware/validation');

// Route 1: Xem danh sách sách (Read-Only Connection Thread)
router.get('/', bookController.getAllBooks);

// Route 2: Form giao diện thêm sách mới
router.get('/books/create', bookController.getCreateForm);

// Route 3: Tiếp nhận thêm sách mới (Validation Middleware + Write Connection Thread)
router.post('/books/create', validateBookData, bookController.createBook);

module.exports = router;
