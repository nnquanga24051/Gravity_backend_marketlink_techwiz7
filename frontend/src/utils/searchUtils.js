// frontend/src/utils/searchUtils.js

/**
 * Utility chuẩn hóa tiếng Việt không dấu
 * Loại bỏ toàn bộ dấu thanh, dấu mũ, chữ đ/Đ để so khớp tìm kiếm không phân biệt dấu.
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  let s = String(str).toLowerCase().trim();
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  // Kết hợp khử ký tự tổ hợp Unicode (Combining Diacritical Marks)
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return s;
}

/**
 * Bảng từ đồng nghĩa / viết tắt phổ biến trong nông sản và địa danh
 */
const SEARCH_ALIASES = {
  'bavi': 'ba vi',
  'dalat': 'da lat',
  'mocchau': 'moc chau',
  'sapa': 'sa pa',
  'thanhha': 'thanh ha',
  'hanoi': 'ha noi',
  'hn': 'ha noi',
  'hcm': 'ho chi minh',
  'tphcm': 'ho chi minh',
  'sg': 'sai gon',
  'saigon': 'sai gon',
  'badinh': 'ba dinh',
  'thaodien': 'thao dien',
  'tayho': 'tay ho',
  'ecopark': 'ecopark',
  'vietgap': 'viet gap',
  'vg': 'viet gap',
  'huuco': 'huu co',
  'organic': 'huu co',
  'cachua': 'ca chua',
  'dautay': 'dau tay',
  'raumuong': 'rau muong',
  'caiboxoi': 'cai bo xoi',
  'namhuong': 'nam huong',
  'rau': 'rau cu rau la',
  'cai': 'rau cai',
  'nam': 'nam thao duoc',
  'traicay': 'trai cay hoa qua',
  'hoaqua': 'hoa qua trai cay'
};

export const POPULAR_PRODUCT_KEYWORDS = [
  '🥬 Cải bó xôi',
  '🍅 Cà chua Cherry',
  '🍓 Dâu tây Đà Lạt',
  '🍄 Nấm Sa Pa',
  '🌿 Rau muống sạch',
  '🍒 Vải thiều Thanh Hà',
  '🛡️ Chuẩn VietGAP',
  '🏡 Ba Vì'
];

export const POPULAR_STALL_KEYWORDS = [
  'Hữu cơ Ba Vì',
  'Vườn Mộc Châu',
  'Đà Lạt Farm',
  'Sa Pa Xanh',
  'Vải Thanh Hà',
  'VietGAP',
  'Rau Lá Hữu Cơ',
  'Trái Cây'
];

export const POPULAR_MARKET_KEYWORDS = [
  'Ba Đình',
  'Thảo Điền',
  'Tây Hồ',
  'Ecopark',
  'Hà Nội',
  'TP. Hồ Chí Minh'
];

/**
 * Kiểm tra xem một đối tượng hoặc chuỗi có khớp với từ khóa tìm kiếm hay không.
 * Hỗ trợ:
 * - Tìm kiếm không dấu hoặc có dấu
 * - Tách từ (mỗi từ trong cụm tìm kiếm đều xuất hiện trong nội dung)
 * - So khớp linh hoạt (partial matching)
 * 
 * @param {string|string[]|Object} target - Chuỗi hoặc danh sách các trường cần tìm
 * @param {string} query - Từ khóa người dùng nhập vào ô tìm kiếm
 * @returns {boolean}
 */
export function matchSearch(target, query) {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  let textToSearch = '';
  if (Array.isArray(target)) {
    textToSearch = target.filter(Boolean).join(' ');
  } else if (typeof target === 'object') {
    textToSearch = Object.values(target).filter(val => typeof val === 'string' || typeof val === 'number').join(' ');
  } else {
    textToSearch = String(target);
  }

  const rawTargetLower = textToSearch.toLowerCase();
  const normTarget = removeVietnameseTones(textToSearch);

  const rawQuery = query.trim().toLowerCase();
  const normQuery = removeVietnameseTones(query);

  // 1. So khớp chuỗi trực tiếp (có dấu hoặc không dấu)
  if (rawTargetLower.includes(rawQuery) || normTarget.includes(normQuery)) {
    return true;
  }

  // 2. Tra cứu từ viết tắt / alias
  const aliasExpansion = SEARCH_ALIASES[normQuery] || SEARCH_ALIASES[rawQuery];
  if (aliasExpansion && (normTarget.includes(aliasExpansion) || normTarget.includes(removeVietnameseTones(aliasExpansion)))) {
    return true;
  }

  // 3. Tách từ khóa thành các token độc lập
  const tokens = normQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    // Tất cả các từ đều xuất hiện trong nội dung (không nhất thiết phải liền kề)
    const allTokensFound = tokens.every(token => {
      const tokenAlias = SEARCH_ALIASES[token];
      return normTarget.includes(token) || (tokenAlias && normTarget.includes(tokenAlias));
    });
    if (allTokensFound) return true;

    // Nếu có ít nhất 60% từ khớp thì vẫn coi là phù hợp để tránh trống kết quả
    const matchedCount = tokens.filter(token => normTarget.includes(token)).length;
    if (matchedCount >= Math.ceil(tokens.length * 0.6)) {
      return true;
    }
  }

  return false;
}

/**
 * Tính điểm khớp tìm kiếm để sắp xếp kết quả liên quan nhất lên đầu
 */
export function calculateMatchScore(targetText, query) {
  if (!query || !query.trim()) return 1;
  const rawTargetLower = String(targetText || '').toLowerCase();
  const normTarget = removeVietnameseTones(targetText);
  const rawQuery = query.trim().toLowerCase();
  const normQuery = removeVietnameseTones(query);

  if (rawTargetLower === rawQuery) return 100;
  if (normTarget === normQuery) return 90;
  if (rawTargetLower.startsWith(rawQuery)) return 80;
  if (normTarget.startsWith(normQuery)) return 70;
  if (rawTargetLower.includes(rawQuery)) return 60;
  if (normTarget.includes(normQuery)) return 50;

  const tokens = normQuery.split(/\s+/).filter(Boolean);
  const matchedTokens = tokens.filter(t => normTarget.includes(t));
  return (matchedTokens.length / tokens.length) * 40;
}
