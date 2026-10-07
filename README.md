# ĐỀ KIỂM TRA GIỮA KỲ MÔN ĐIỆN TOÁN ĐÁM MÂY
## HỆ THỐNG QUẢN LÝ SÁCH CLOUD (CLOUD BOOK MANAGEMENT)

- **Sinh viên thực hiện:** Nguyễn Văn A
- **Mã số sinh viên (MSSV):** 23IT206
- **3 chữ số cuối MSSV:** `206`
- **Chữ số cuối MSSV:** `6`
- **Mức thuế VAT áp dụng:** `12%` (Tính theo công thức: 6 + 6 = 12%)

---

## 1. TỔNG QUAN DỰ ÁN & CẤU TRÚC THƯ MỤC

Dự án được xây dựng trên nền tảng **Node.js, Express, Handlebars (HBS)** kết hợp **MongoDB Atlas** đáp ứng đầy đủ 3 tiêu chí:
1. **Bảo mật phân quyền (Least Privilege)**: Tách biệt 2 tài khoản kết nối Read-Only và Write trên MongoDB Atlas.
2. **Khả năng chịu tải phân tán (Stateless Architecture)**: Lưu trữ Session tập trung trực tiếp xuống đám mây MongoDB Atlas (`connect-mongo`), không phụ thuộc vào RAM máy chủ, hỗ trợ Auto-scaling hoàn hảo trên PaaS Cloud (Render).
3. **Quy trình DevOps & Cá nhân hóa**: Bộ lọc tiền tố mã sách `206`, tự động tính giá sau thuế 12% trước khi lưu trữ cloud và hiển thị Footer bắt buộc theo đúng đề bài.

```
cloud-book-management/
│
├── config/
│   └── database.js            # Cấu hình đa luồng kết nối MongoDB Atlas (Read/Write)
│
├── controllers/
│   └── bookController.js      # Điều hướng luồng truy vấn Read-Only và Write
│
├── middleware/
│   └── validation.js          # Bộ lọc tiền tố 206 & Thuật toán tính thuế VAT 12%
│
├── models/
│   └── book.js                # Schema & Bind Model cho 2 kết nối riêng biệt
│
├── routes/
│   └── bookRoutes.js          # Định tuyến ứng dụng Express
│
├── views/
│   ├── layouts/
│   │   └── main.hbs           # Layout chính với Footer bắt buộc (Họ tên, MSSV, VAT 12%)
│   │
│   ├── books/
│   │   ├── index.hbs          # Giao diện xem danh sách sách (Read Node)
│   │   └── create.hbs         # Giao diện thêm sách mới (Write Node)
│   │
│   └── error.hbs              # Giao diện thông báo lỗi bộ lọc
│
├── public/
│   └── css/
│       └── style.css          # Giao diện Glassmorphism hiện đại
│
├── .env                       # Biến môi trường local (được bảo mật trong gitignore)
├── .env.example               # Mẫu cấu hình môi trường cho PaaS Render
├── .gitignore                 # Cấu hình loại bỏ file nhạy cảm
├── app.js                     # File khởi tạo máy chủ ứng dụng
├── package.json               # Cấu hình phụ thuộc và scripts
└── README.md                  # Hướng dẫn chi tiết dự án
```

---

## 2. HƯỚNG DẪN THIẾT LẬP MONGODB ATLAS (LEAST PRIVILEGE)

### Bước 2.1: Tạo Cơ sở dữ liệu
Vào MongoDB Atlas, tạo cơ sở dữ liệu có tên: **`DB_23IT206`**

### Bước 2.2: Tạo 02 Tài khoản người dùng (Database Access)
1. **Tài khoản Read-Only (Chỉ có quyền đọc):**
   - **Username:** `user_read_23it206`
   - **Password:** `<Password_Của_Bạn>`
   - **Database Privileges:** Chọn Custom Role hoặc `read` trên database `DB_23IT206`.
2. **Tài khoản Write (Quyền ghi & session):**
   - **Username:** `user_write_23it206`
   - **Password:** `<Password_Của_Bạn>`
   - **Database Privileges:** Chọn `readWrite` trên database `DB_23IT206`.

### Bước 2.3: Điền chuỗi kết nối vào `.env`
Mở file `.env` và thay thế chuỗi kết nối thực tế từ MongoDB Atlas của bạn:
```env
MONGODB_READ_URI=mongodb+srv://user_read_23it206:<Password>@cluster0.mongodb.net/DB_23IT206?retryWrites=true&w=majority
MONGODB_WRITE_URI=mongodb+srv://user_write_23it206:<Password>@cluster0.mongodb.net/DB_23IT206?retryWrites=true&w=majority
```

---

## 3. LOGIC XỬ LÝ BACKEND & THUẬT TOÁN CÁ NHÂN HÓA

1. **Điều hướng Đa luồng Connection:**
   - Khi người dùng truy cập trang chủ (`/`), `bookController.js` gọi `ReadBook.find()` thuộc luồng `readConnection` (Tài khoản Read-Only).
   - Khi người dùng tạo sách mới (`POST /books/create`), `bookController.js` gọi `new WriteBook().save()` thuộc luồng `writeConnection` (Tài khoản Write).

2. **Cài đặt Bộ lọc Dữ liệu (Validation Middleware):**
   - Tiền tố Mã Sách bắt buộc: **`206`** (3 chữ số cuối MSSV 23IT206).
   - Nếu mã sách nhập vào KHÔNG bắt đầu bằng `206`, hệ thống từ chối lưu và render giao diện `error.hbs` báo lỗi HTTP 400.

3. **Thuật toán VAT Cá Nhân Hóa:**
   - Formula: `VAT = (Chữ số cuối MSSV + 6)% = (6 + 6)% = 12%`.
   - Giá sau thuế: `priceWithVAT = price * (1 + 12 / 100)`.
   - Hệ thống tự động tính toán giá sau thuế trước khi ghi xuống Cloud MongoDB.

4. **Stateless Session Cloud:**
   - Session không lưu trong RAM máy chủ.
   - Được lưu tập trung vào collection `sessions` trong MongoDB Atlas bằng `connect-mongo`.

---

## 4. QUY TRÌNH DEVOPS & QUẢN LÝ MÃ NGUỒN (GIT BRANCH STRATEGY)

Để đáp ứng yêu cầu bóc tách 02 nhánh tính năng riêng biệt và lưu vết Merge Node trên Git Tree:

```bash
# 1. Khởi tạo Git repository
git init
git branch -M main

# 2. Tạo commit ban đầu trên nhánh main
git add .gitignore package.json package-lock.json README.md .env.example
git commit -m "Initial commit: Khởi tạo cấu trúc dự án Cloud Book Management 23IT206"

# 3. Tạo và chuyển sang nhánh Database
git checkout -b feature/database
git add config/ models/
git commit -m "Feat(Database): Xây dựng kiến trúc 2 connection Read/Write Least Privilege"

# 4. Quay lại main và tạo nhánh Session
git checkout main
git checkout -b feature/session
git add middleware/ views/ public/ app.js controllers/ routes/
git commit -m "Feat(Session): Cấu hình MongoStore Stateless Session và Bộ lọc mã 206 VAT 12%"

# 5. Gộp các nhánh về main giữ nguyên vết Merge Node (--no-ff)
git checkout main
git merge feature/database --no-ff -m "Merge branch 'feature/database' into main: Tích hợp kiến trúc Database Least Privilege"
git merge feature/session --no-ff -m "Merge branch 'feature/session' into main: Tích hợp Stateless Session & UI Handlebars"

# 6. Kiểm tra sơ đồ cây Git Merge Node
git log --graph --oneline --all
```

---

## 5. TRIỂN KHAI TRỰC TUYẾN 24/7 TRÊN RENDER (PAAS CLOUD)

### Bước 5.1: Đẩy mã nguồn lên GitHub
```bash
git remote add origin https://github.com/<your-username>/cloud-book-management-23it206.git
git push -u origin main
```

### Bước 5.2: Triển khai trên Render PaaS
1. Đăng nhập vào [Render.com](https://render.com).
2. Tạo mới **Web Service** -> Kết nối với kho lưu trữ GitHub vừa đẩy lên.
3. Cấu hình cài đặt:
   - **Name:** `cloud-book-management-23it206`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js`
4. **Cấu hình Environment Variables trong giao diện quản trị Render:**
   - `PORT`: `3000`
   - `SESSION_SECRET`: `cloud_midterm_23it206_secret_key_98765`
   - `STUDENT_NAME`: `Nguyễn Văn A`
   - `MSSV`: `23IT206`
   - `MSSV_LAST_3_DIGITS`: `206`
   - `MSSV_LAST_DIGIT`: `6`
   - `MONGODB_READ_URI`: `mongodb+srv://user_read_23it206:<Password>@cluster0.mongodb.net/DB_23IT206?retryWrites=true&w=majority`
   - `MONGODB_WRITE_URI`: `mongodb+srv://user_write_23it206:<Password>@cluster0.mongodb.net/DB_23IT206?retryWrites=true&w=majority`
5. Nhấn **Deploy Web Service** và lấy đường dẫn URL trực tuyến 24/7!

---

## 6. KIỂM TRA VÀ XÁC NHẬN KẾT QUẢ

- **Xem danh sách:** Mở `http://localhost:3000/` -> Kiểm tra dữ liệu được truy vấn qua tài khoản Read-Only.
- **Thêm sách hợp lệ:** Thử nhập mã `206-SACH-01`, Giá `100000` -> Hệ thống tự động tính Giá sau thuế là `112000` VNĐ (12% VAT) và lưu qua kết nối Write.
- **Thêm sách vi phạm:** Thử nhập mã `999-SACH-01` -> Hệ thống lập tức từ chối và render màn hình báo lỗi `INVALID_BOOK_CODE_PREFIX`.
- **Footer:** Chân trang luôn hiển thị cố định: `Họ tên: Nguyễn Văn A | MSSV: 23IT206 | Mức VAT áp dụng: 12%`.
