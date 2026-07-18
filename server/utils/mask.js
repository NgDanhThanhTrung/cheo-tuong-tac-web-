/**
 * utils/mask.js
 * TOAN BO logic che giau thong tin ca nhan PHAI chay o Server.
 * Client KHONG BAO GIO nhan ve fullName / phone that (tru chinh chu da dang nhap).
 */

/**
 * Che so dien thoai: chi giu lai 4 so cuoi.
 * "0987654678" -> "***4678"
 */
function maskPhone(phone) {
  if (!phone) return "***";
  const digits = String(phone).replace(/\D/g, "");
  const last4 = digits.slice(-4).padStart(4, "0");
  return `***${last4}`;
}

/**
 * Che ho ten: chi giu lai toi da 2 tu cuoi cung.
 * "Nguyen Van Anh Tuan" -> "Anh Tuan"
 * "Lan" -> "Lan"
 */
function maskName(fullName) {
  if (!fullName) return "An danh";
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(-2).join(" ");
}

/**
 * Sinh chuoi hien thi cong khai chuan:
 * "Anh Tuan #1024 (***4678)"
 */
function publicDisplayName(user) {
  return `${maskName(user.full_name)} #${String(user.public_id).padStart(4, "0")} (${maskPhone(user.phone)})`;
}

/**
 * Tra ve object user AN TOAN de gui cho client khi KHONG phai chinh chu.
 */
function toPublicUser(user) {
  return {
    id: user.id,
    publicId: `#${String(user.public_id).padStart(4, "0")}`,
    displayName: maskName(user.full_name),
    maskedPhone: maskPhone(user.phone),
    label: publicDisplayName(user),
    totalCrossed: user.total_crossed || 0,
    createdAt: user.created_at,
  };
}

/**
 * Tra ve object user DAY DU - chi dung khi tra ve cho chinh chu da dang nhap
 * (server xac thuc qua token session truoc khi goi ham nay).
 */
function toPrivateUser(user) {
  return {
    id: user.id,
    publicId: `#${String(user.public_id).padStart(4, "0")}`,
    fullName: user.full_name,
    phone: user.phone,
    displayName: maskName(user.full_name),
    maskedPhone: maskPhone(user.phone),
    totalCrossed: user.total_crossed || 0,
    createdAt: user.created_at,
  };
}

module.exports = { maskPhone, maskName, publicDisplayName, toPublicUser, toPrivateUser };
