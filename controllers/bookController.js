const { ReadBook, WriteBook } = require('../models/book');

/**
 * Controller Quản Lý Sách
 * Đảm bảo phân luồng truy vấn Read/Write chính xác vào từng tài khoản MongoDB Atlas
 */

// 1. Xem danh sách Sách -> Tự động điều hướng qua ReadBook (Read-Only Connection Pool)
exports.getAllBooks = async (req, res) => {
  try {
    // Luồng Read: Truy vấn dữ liệu từ Cloud qua tài khoản Read-Only
    const books = await ReadBook.find().sort({ createdAt: -1 }).lean();
    
    // Đếm tổng số sách
    const totalBooks = books.length;

    res.render('books/index', {
      title: 'Danh Sách Quản Lý Sách Cloud',
      books,
      totalBooks,
      connectionType: 'Read-Only Account (MongoDB Atlas)',
      successMsg: req.session.successMsg || null,
      errorMsg: req.session.errorMsg || null
    });

    // Clear session flash messages after rendering
    req.session.successMsg = null;
    req.session.errorMsg = null;
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách sách từ Read Connection:', error);
    res.status(500).render('error', {
      title: 'Lỗi Truy Vấn Cơ Sở Dữ Liệu',
      errorCode: 'READ_QUERY_ERROR',
      message: 'Không thể truy vấn danh sách sách từ MongoDB Atlas qua kết nối Read-Only.',
      details: error.message
    });
  }
};

// 2. Hiển thị form tạo mới Sách
exports.getCreateForm = (req, res) => {
  res.render('books/create', {
    title: 'Thêm Sách Mới Trực Tuyến',
    last3Digits: process.env.MSSV_LAST_3_DIGITS || '206',
    vatRate: parseInt(process.env.MSSV_LAST_DIGIT || '6', 10) + 6
  });
};

// 3. Thêm Sách mới -> Tự động điều hướng qua WriteBook (Write Connection Pool)
exports.createBook = async (req, res) => {
  try {
    const { bookCode, title, author, price, vatRate, priceWithVAT, category, description } = req.body;

    // Kiếm tra mã trùng qua ReadBook trước
    const existingBook = await ReadBook.findOne({ bookCode }).lean();
    if (existingBook) {
      return res.status(400).render('error', {
        title: 'Lỗi Trùng Mã Sản Phẩm',
        errorCode: 'DUPLICATE_BOOK_CODE',
        message: `Mã sách "${bookCode}" đã tồn tại trên hệ thống MongoDB Atlas. Vui lòng nhập mã khác!`,
        details: 'Nguyên tắc duy nhất cho mã sách được bảo đảm trên đám mây.'
      });
    }

    // Luồng Write: Lưu trữ dữ liệu trực tiếp xuống Cloud qua tài khoản Write
    const newBook = new WriteBook({
      bookCode,
      title,
      author,
      price,
      vatRate,
      priceWithVAT,
      category: category || 'Công nghệ thông tin',
      description
    });

    await newBook.save();

    console.log(`✅ [Write Node] Thêm sách mới thành công: ${bookCode} - ${title} (Giá sau thuế ${vatRate}%: ${priceWithVAT})`);
    
    req.session.successMsg = `Thêm sách "${title}" (${bookCode}) thành công với mức thuế VAT ${vatRate}%!`;
    res.redirect('/');
  } catch (error) {
    console.error('❌ Lỗi khi lưu sách qua Write Connection:', error);
    res.status(500).render('error', {
      title: 'Lỗi Ghi Dữ Liệu Cloud',
      errorCode: 'WRITE_QUERY_ERROR',
      message: 'Không thể lưu thông tin sách xuống MongoDB Atlas qua kết nối Write.',
      details: error.message
    });
  }
};

// 4. Seeding dữ liệu mẫu nếu Database trống (dùng WriteBook)
exports.seedInitialBooks = async () => {
  try {
    const count = await ReadBook.countDocuments();
    if (count === 0) {
      console.log('📌 Cơ sở dữ liệu trống, tiến hành khởi tạo dữ liệu mẫu...');
      const lastDigit = parseInt(process.env.MSSV_LAST_DIGIT || '6', 10);
      const vatRate = lastDigit + 6; // 12%

      const sampleBooks = [
        {
          bookCode: '206-CLOUD-01',
          title: 'Kiến Trúc Điện Toán Đám Mây Mới Nhất',
          author: 'Nguyễn Văn A',
          price: 150000,
          vatRate: vatRate,
          priceWithVAT: Math.round(150000 * (1 + vatRate / 100)),
          category: 'Điện toán đám mây',
          description: 'Sách nhập môn thiết kế hạ tầng Cloud Stateless và Microservices.'
        },
        {
          bookCode: '206-DEVOPS-02',
          title: 'Quy Trình DevOps & Triển Khai PaaS Render',
          author: 'Trần Thị B',
          price: 200000,
          vatRate: vatRate,
          priceWithVAT: Math.round(200000 * (1 + vatRate / 100)),
          category: 'DevOps & CI/CD',
          description: 'Hướng dẫn xây dựng Git branch strategy và deployment tự động.'
        }
      ];

      await WriteBook.insertMany(sampleBooks);
      console.log('✅ Đã tạo thành công dữ liệu mẫu khởi tạo!');
    }
  } catch (err) {
    console.log('💡 Lưu ý khởi tạo dữ liệu mẫu:', err.message);
  }
};
