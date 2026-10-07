/**
 * Validation Middleware & Personalized Data Filter
 * MSSV: 23IT206
 * - Tiền tố mã sách bắt buộc: 3 số cuối MSSV ("206")
 * - Công thức thuế suất động: VAT = (Chữ số cuối MSSV + 6)% = (6 + 6)% = 12%
 */

const validateBookData = (req, res, next) => {
  const { bookCode, title, author, price } = req.body;
  const last3Digits = process.env.MSSV_LAST_3_DIGITS || '206';
  const lastDigit = parseInt(process.env.MSSV_LAST_DIGIT || '6', 10);

  // 1. Cài đặt bộ lọc dữ liệu: Mã sản phẩm BẮT BUỘC phải có tiền tố 3 số cuối MSSV (206)
  if (!bookCode || typeof bookCode !== 'string' || !bookCode.trim().startsWith(last3Digits)) {
    return res.status(400).render('error', {
      title: 'Lỗi Dữ Liệu Bắt Buộc',
      errorCode: 'INVALID_BOOK_CODE_PREFIX',
      message: `Mã sản phẩm / sách không hợp lệ! Mã phải bắt đầu bằng tiền tố 3 số cuối MSSV của bạn là '${last3Digits}' (Ví dụ: ${last3Digits}-SACH-01).`,
      details: `Mã bạn vừa nhập: "${bookCode || ''}"`
    });
  }

  // 2. Validate giá sản phẩm
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).render('error', {
      title: 'Lỗi Giá Sản Phẩm',
      errorCode: 'INVALID_PRICE',
      message: 'Giá sản phẩm phải là một số dương hợp lệ.',
      details: `Giá nhập vào: "${price}"`
    });
  }

  // 3. Thuật toán cá nhân hóa: Tính VAT động theo công thức VAT = (Chữ số cuối MSSV + 6)%
  const vatRate = lastDigit + 6; // Với 23IT206 -> (6 + 6) = 12%

  // 4. Tính giá sau thuế trước khi lưu xuống cloud
  const priceWithVAT = Math.round(parsedPrice * (1 + vatRate / 100));

  // Gắn thông tin đã được xử lý chuẩn hóa vào req.body
  req.body.bookCode = bookCode.trim();
  req.body.title = title ? title.trim() : '';
  req.body.author = author ? author.trim() : '';
  req.body.price = parsedPrice;
  req.body.vatRate = vatRate;
  req.body.priceWithVAT = priceWithVAT;

  next();
};

module.exports = {
  validateBookData
};
