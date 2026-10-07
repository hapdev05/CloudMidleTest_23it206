const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { engine } = require('express-handlebars');
require('dotenv').config();

const bookRoutes = require('./routes/bookRoutes');
const { seedInitialBooks } = require('./controllers/bookController');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cấu hình Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. Cấu hình Thư mục Static Public
app.use(express.static(path.join(__dirname, 'public')));

// 3. Cấu hình View Engine Handlebars
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: {
    formatCurrency: function(value) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
    },
    eq: function(a, b) {
      return a === b;
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// 4. Cấu hình Stateless Session trên MongoDB Atlas (MongoStore)
// Đảm bảo phiên làm việc không bị mất khi Auto-scaling trên PaaS Cloud
const mongoSessionUri = process.env.MONGODB_WRITE_URI || process.env.MONGODB_READ_URI || 'mongodb://localhost:27017/DB_23IT206';
const storeFactory = MongoStore.default || MongoStore;

app.use(session({
  secret: process.env.SESSION_SECRET || 'super_secret_cloud_23it206',
  resave: false,
  saveUninitialized: false,
  store: storeFactory.create({
    mongoUrl: mongoSessionUri,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 ngày
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 ngày
    httpOnly: true
  }
}));

// 5. Global Middleware truyền dữ liệu Cá Nhân Hóa & Session sang Views Handlebars
app.use((req, res, next) => {
  const mssv = process.env.MSSV || '23IT206';
  const last3Digits = process.env.MSSV_LAST_3_DIGITS || '206';
  const lastDigit = parseInt(process.env.MSSV_LAST_DIGIT || '6', 10);
  const vatRate = lastDigit + 6; // 12%

  res.locals.studentInfo = {
    name: process.env.STUDENT_NAME || 'Nguyễn Văn A',
    mssv: mssv,
    last3Digits: last3Digits,
    lastDigit: lastDigit,
    vatRate: vatRate
  };

  // Đếm lượt truy cập theo phiên Stateless Session
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  
  res.locals.sessionViews = req.session.views;
  res.locals.sessionId = req.sessionID;

  next();
});

// 6. Kích hoạt Routes
app.use('/', bookRoutes);

// 7. Handling 404 Pages
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Không Tìm Thấy Trang (404)',
    errorCode: 'PAGE_NOT_FOUND',
    message: 'Trang hoặc đường dẫn bạn truy cập không tồn tại trên hệ thống Cloud Book Management.',
    details: `URL: ${req.originalUrl}`
  });
});

// 8. Khởi động Máy chủ Web Cloud
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 [Cloud App Online] Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`👤 Sinh viên thực hiện: ${process.env.STUDENT_NAME || 'Nguyễn Văn A'} - MSSV: ${process.env.MSSV || '23IT206'}`);
  console.log(`📊 Thuế suất VAT áp dụng: ${parseInt(process.env.MSSV_LAST_DIGIT || '6', 10) + 6}%`);
  console.log(`🛡️  Bộ lọc mã sách: Tiền tố bắt buộc '${process.env.MSSV_LAST_3_DIGITS || '206'}'`);
  console.log(`=======================================================`);
  
  // Tự động kiểm tra và thêm dữ liệu khởi tạo nếu DB mới lập
  await seedInitialBooks();
});
