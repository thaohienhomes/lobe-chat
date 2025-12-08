# PROPOSAL: Chiến Lược & Cơ Cấu Giá Mới Cho Phở Chat

## 1. Phân Tích Hiện Trạng (Dựa trên PRICING_MASTERPLAN.md.md)

- **Điểm mạnh:** Mô hình "Hidden Credit" (Phở Points) giúp linh hoạt trừ tiền theo model (rẻ vs đắt). Hỗ trợ thanh toán nội địa (Sepay) và quốc tế (Polar).
- **Điểm yếu:**
  - Tỷ lệ quy đổi điểm hiện tại (199k VND = 2M điểm => 1 VNĐ \~ 10 điểm) gây khó nhẩm tính cho user.
  - Gói "Unlimited Tier 1" (GPT-4o-mini) ở mức 69k có rủi ro lạm dụng (abuse) nếu không có Fair Usage Policy (FUP).
  - Thiếu phương án "mua thêm" (top-up) khi hết điểm giữa chu kỳ.

## 2. Đề Xuất Thay Đổi Chiến Lược (Pricing Strategy)

### 2.1. Chuẩn Hóa Đơn Vị Tiền Tệ ("Pho Credit")

Thay vì hệ thống điểm abstract khó hiểu, hãy neo giá trị điểm trực tiếp vào tiền tệ để user dễ hình dung giá trị.

- **Đơn vị:** 1 Phở Credit = 1 VNĐ.
- **Logic:** Khi user nạp 100k, họ có 100,000 Credits.
- **Lợi ích:** Minh bạch. User biết 100k dùng được bao nhiêu.

### 2.2. Cơ Cấu Gói Cước (Revamped Tiers)

Thêm khái niệm "Mua thêm" và FUP.

#### Region A: Vietnam (Sepay) - Chuyển sang mô hình Hybrid

| Gói                     | Giá (VNĐ/tháng) | Quyền Lợi                                                     | Credit Tặng Kèm | Ghi Chú                                           |
| :---------------------- | :-------------- | :------------------------------------------------------------ | :-------------- | :------------------------------------------------ |
| **Phở Không Người Lái** | 0đ              | Free Tier 1 (Limit 30 msg/day)                                | 0               | Chỉ dùng model rẻ nhất (4o-mini).                 |
| **Phở Tái** (Cơ bản)    | 69,000đ         | **Unlimited** Tier 1 (FUP 500 msg/day)\* <br> Truy cập Tier 2 | 20,000 Credits  | Credit dùng để gọi Model xịn (Tier 2, 3) khi cần. |
| **Phở Đặc Biệt** (Pro)  | 199,000đ        | **Unlimited** Tier 1 & 2 (FUP)\* <br> Truy cập Tier 3         | 100,000 Credits | Credit lớn để dùng Model siêu cấp (Opus, O1).     |
| **Bánh Quẩy** (Top-up)  | 20,000đ+        | N/A                                                           | 20,000 Credits  | Mua thêm khi hết credit, không cần nâng gói.      |

_\*Fair Usage Policy (FUP): Nếu vượt quá giới hạn mềm, tốc độ sẽ bị giảm hoặc chuyển sang hàng đợi thấp, nhưng không bị chặn._

#### Region B: Global (Polar) - Giữ nguyên nhưng map lại Credit

- **Standard ($9.90 \~ 240k):** Map tương đương Phở Đặc Biệt (240k Credits).
- **Premium ($19.90 \~ 480k):** Map tương đương 500k Credits.

## 3. Giải Pháp Kỹ Thuật (Technical Architecture)

### 3.1. Token Counting & Streaming (Vấn đề hóc búa nhất)

Khi stream response, ta chưa biết tổng token output cho đến khi kết thúc.

- **Giải pháp:** "Optimistic Reservation & Async Settlement"
  1. **Start:** Kiểm tra số dư. Nếu `balance > safe_threshold` (ví dụ: chi phí cho 500 tokens) -> Cho phép request.
  2. **Reserve:** Tạm khóa (hoặc chỉ check) một lượng credit nhỏ.
  3. **Stream:** Trả về chunks cho user.
  4. **End:** Lấy `usage` thực tế từ provider (OpenAI trả về `usage` trong chunk cuối hoặc stream_options).
  5. **Deduct:** Thực hiện trừ điểm chính xác trong DB (Atomic Decrement).
  6. **Overage:** Nếu user disconnect giữa chừng hoặc tài khoản bị âm nhẹ -> Cho phép âm tối đa -10,000 Credits (ghi nợ), bắt buộc nạp để dùng tiếp.

### 3.2. Caching Layer (Redis)

Không query DB User table mỗi request.

- Lưu `user_balance_{id}` trong Redis.
- Update Redis ngay khi trừ tiền. Sync xuống DB (Postgres) mỗi 1 phút hoặc sau mỗi request (Write-through) tùy tải.

### 3.3. Database Schema Updates (Prisma)

Cần update schema như sau để hỗ trợ model mới:

```prisma
model User {
  // ... existing fields
  phoCreditBalance  Int      @default(0) // 1 Credit = 1 VND
  lifetimeSpent     Int      @default(0) // Total money spent

  // FUP Tracking
  dailyTier1Usage   Int      @default(0) // Reset daily
  lastUsageDate     DateTime @default(now())
}

model ModelPriceConfig {
  id             String @id
  modelId        String @unique
  inputPrice     Float  // VND per 1M tokens
  outputPrice    Float  // VND per 1M tokens
  perMsgFee      Float  @default(0) // Phụ phí mỗi msg nếu cần
}
```

## 4. Kế Hoạch Triển Khai (Roadmap)

1. **Phase 1: DB & Basic Logic** - Tạo bảng, migrate dữ liệu cũ (nếu có), viết hàm tính giá.
2. **Phase 2: Billing Integration** - Tích hợp Sepay webhook & Polar webhook.
3. **Phase 3: Middleware Enforcer** - Chặn request khi hết tiền, xử lý logic FUP.
4. **Phase 4: UI** - Trang Pricing, Ví Credit, Lịch sử trừ tiền.

---

_Document created by Antigravity for Phở Chat Project (Strategy Proposal)._
