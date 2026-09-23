/**
 * ===================================================================
 * MarketLink Test & Demo Client - Interactive Web App
 * ===================================================================
 */

// Storage keys
const TOKEN_KEY = 'marketlink_jwt_token';

// Elements
const baseUrlInput = document.getElementById('base-url-input');
const statusDot = document.getElementById('server-status-dot');
const statusText = document.getElementById('server-status-text');
const consoleLogs = document.getElementById('console-logs');
const toastEl = document.getElementById('toast');

// Auto detect default Base URL
if (window.location.protocol.startsWith('http')) {
    baseUrlInput.value = window.location.origin;
}

function getBaseUrl() {
    return baseUrlInput.value.replace(/\/+$/, '');
}

// -------------------------------------------------------------------
// 1. Health Check
// -------------------------------------------------------------------
async function checkServerHealth() {
    try {
        const start = performance.now();
        const res = await fetch(`${getBaseUrl()}/api/categories`, { method: 'GET' });
        const elapsed = Math.round(performance.now() - start);

        if (res.status === 200 || res.status === 401) {
            statusDot.className = 'status-dot online';
            statusText.textContent = `Online (${elapsed}ms)`;
        } else {
            statusDot.className = 'status-dot offline';
            statusText.textContent = `Lỗi HTTP ${res.status}`;
        }
    } catch (err) {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Mất kết nối Backend';
    }
}

// -------------------------------------------------------------------
// 2. Tab Navigation
// -------------------------------------------------------------------
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const btn = document.getElementById(`tab-btn-${tabName}`);
    const content = document.getElementById(`tab-${tabName}`);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');

    if (tabName === 'profile') {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            refreshProfile();
        } else {
            document.getElementById('profile-unauth-view').style.display = 'block';
            document.getElementById('profile-auth-view').style.display = 'none';
        }
    }
}

// -------------------------------------------------------------------
// 3. Role Selector Handler
// -------------------------------------------------------------------
function handleRoleChange(role) {
    const farmerCard = document.getElementById('role-card-farmer');
    const customerCard = document.getElementById('role-card-customer');
    const farmerFields = document.getElementById('farmer-fields');

    if (role === 'FARMER') {
        farmerCard.classList.add('active');
        customerCard.classList.remove('active');
        farmerFields.style.display = 'block';
    } else {
        customerCard.classList.add('active');
        farmerCard.classList.remove('active');
        farmerFields.style.display = 'none';
    }
}

function fillLoginForm(email, password) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    showToast(`Đã điền tài khoản: ${email}`, 'info');
}

// -------------------------------------------------------------------
// 4. Auth - Login
// -------------------------------------------------------------------
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-login');
    setButtonLoading(btn, true);

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const payload = { email, password };
    logToConsole('POST', '/api/auth/login', payload);

    try {
        const start = performance.now();
        const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const elapsed = Math.round(performance.now() - start);
        const data = await res.json();
        logToConsole('RESP', `/api/auth/login [${res.status}] (${elapsed}ms)`, data, res.ok ? 'success' : 'error');

        if (res.ok && data.token) {
            saveToken(data.token);
            showToast('Đăng nhập thành công! Token đã được nạp.', 'success');
            switchTab('profile');
        } else {
            showToast(data.message || 'Đăng nhập thất bại', 'error');
        }
    } catch (err) {
        logToConsole('ERROR', '/api/auth/login', { error: err.message }, 'error');
        showToast(`Lỗi kết nối: ${err.message}`, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// -------------------------------------------------------------------
// 5. Auth - Register
// -------------------------------------------------------------------
async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-register');
    setButtonLoading(btn, true);

    const role = document.querySelector('input[name="register-role"]:checked').value;
    const fullName = document.getElementById('reg-fullname').value.trim();
    const phoneNumber = document.getElementById('reg-phone').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const payload = { email, password, fullName, phoneNumber, role };

    if (role === 'FARMER') {
        payload.stallName = document.getElementById('reg-stall-name').value.trim() || undefined;
        payload.farmAddress = document.getElementById('reg-farm-address').value.trim() || undefined;
    }

    logToConsole('POST', '/api/auth/register', payload);

    try {
        const start = performance.now();
        const res = await fetch(`${getBaseUrl()}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const elapsed = Math.round(performance.now() - start);
        const data = await res.json();
        logToConsole('RESP', `/api/auth/register [${res.status}] (${elapsed}ms)`, data, res.ok ? 'success' : 'error');

        if (res.ok && data.token) {
            saveToken(data.token);
            showToast(`Đăng ký tài khoản ${role} thành công!`, 'success');
            switchTab('profile');
        } else {
            showToast(data.message || 'Đăng ký thất bại', 'error');
        }
    } catch (err) {
        logToConsole('ERROR', '/api/auth/register', { error: err.message }, 'error');
        showToast(`Lỗi kết nối: ${err.message}`, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

// -------------------------------------------------------------------
// 6. Profile Retrieval (/api/auth/me)
// -------------------------------------------------------------------
async function refreshProfile() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    logToConsole('GET', '/api/auth/me', { Authorization: `Bearer ${token.substring(0, 15)}...` });

    try {
        const start = performance.now();
        const res = await fetch(`${getBaseUrl()}/api/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const elapsed = Math.round(performance.now() - start);
        const data = await res.json();
        logToConsole('RESP', `/api/auth/me [${res.status}] (${elapsed}ms)`, data, res.ok ? 'success' : 'error');

        if (res.ok) {
            renderProfile(data);
            showToast('Đã làm mới thông tin hồ sơ!', 'success');
        } else {
            showToast(`Lỗi nạp profile: ${data.message || res.status}`, 'error');
        }
    } catch (err) {
        logToConsole('ERROR', '/api/auth/me', { error: err.message }, 'error');
        showToast('Không thể kết nối máy chủ', 'error');
    }
}

function renderProfile(user) {
    document.getElementById('profile-unauth-view').style.display = 'none';
    document.getElementById('profile-auth-view').style.display = 'block';

    const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    document.getElementById('prof-avatar').textContent = initials;
    document.getElementById('prof-fullname').textContent = user.fullName || 'Người dùng';
    document.getElementById('prof-email').textContent = user.email || '';
    document.getElementById('prof-id').textContent = user.userId;
    document.getElementById('prof-phone').textContent = user.phoneNumber || '--';

    const primaryRole = (user.roles && user.roles.length > 0) ? user.roles[0] : 'CUSTOMER';
    document.getElementById('prof-role').textContent = `ROLE: ${primaryRole}`;
    document.getElementById('prof-kyc').textContent = `KYC: ${user.kycStatus || 'UNVERIFIED'}`;
    document.getElementById('prof-status').textContent = user.status || 'ACTIVE';

    const extraRow = document.getElementById('prof-extra-row');
    if (user.farmerProfile) {
        extraRow.innerHTML = `
            <span class="detail-label">Thông tin Sạp Nông Dân:</span>
            <div style="margin-top: 6px; font-size: 13px;">
                <div>🏷️ <strong>Tên sạp:</strong> ${user.farmerProfile.stallName || 'Chưa đặt tên'}</div>
                <div style="margin-top: 4px;">📍 <strong>Địa chỉ vườn:</strong> ${user.farmerProfile.farmAddress || 'Chưa cập nhật'}</div>
                <div style="margin-top: 4px;">✅ <strong>Trạng thái duyệt:</strong> ${user.farmerProfile.isApproved ? '<span style="color: #10b981;">Đã duyệt bán hàng</span>' : '<span style="color: #f59e0b;">Chờ Admin duyệt</span>'}</div>
            </div>
        `;
    } else if (user.customerProfile) {
        extraRow.innerHTML = `
            <span class="detail-label">Thông tin Khách Hàng:</span>
            <div style="margin-top: 6px; font-size: 13px;">
                <div>🏠 <strong>Địa chỉ nhận mặc định:</strong> ${user.customerProfile.defaultAddress || 'Chưa thiết lập'}</div>
                <div style="margin-top: 4px;">👨‍👩‍👦 <strong>Tài khoản gia đình:</strong> ${user.customerProfile.familyAccountId ? `Liên kết ID #${user.customerProfile.familyAccountId}` : 'Tài khoản độc lập'}</div>
            </div>
        `;
    } else {
        extraRow.innerHTML = '';
    }
}

function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    renderTokenInspector(null);
    document.getElementById('profile-unauth-view').style.display = 'block';
    document.getElementById('profile-auth-view').style.display = 'none';
    document.getElementById('auth-logged-dot').style.display = 'none';
    showToast('Đã đăng xuất tài khoản thành công', 'info');
}

// -------------------------------------------------------------------
// 7. JWT Inspector & Parsing
// -------------------------------------------------------------------
function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    renderTokenInspector(token);
    document.getElementById('auth-logged-dot').style.display = 'inline-block';
}

function renderTokenInspector(token) {
    const rawBox = document.getElementById('jwt-raw-box');
    const claimsBox = document.getElementById('claims-box');

    if (!token) {
        rawBox.innerHTML = '<span class="jwt-placeholder">Chưa có JWT Token. Hãy Đăng nhập hoặc Đăng ký để nhận Token.</span>';
        claimsBox.style.display = 'none';
        return;
    }

    const parts = token.split('.');
    if (parts.length === 3) {
        rawBox.innerHTML = `
            <span class="jwt-part-header">${parts[0]}</span>.<span class="jwt-part-payload">${parts[1]}</span>.<span class="jwt-part-signature">${parts[2]}</span>
        `;

        try {
            const headerObj = JSON.parse(decodeBase64Url(parts[0]));
            const payloadObj = JSON.parse(decodeBase64Url(parts[1]));

            document.getElementById('jwt-header-view').textContent = JSON.stringify(headerObj, null, 2);
            document.getElementById('jwt-payload-view').textContent = JSON.stringify(payloadObj, null, 2);

            if (payloadObj.exp) {
                const expDate = new Date(payloadObj.exp * 1000);
                document.getElementById('jwt-expires-time').textContent = expDate.toLocaleString('vi-VN');
            }

            claimsBox.style.display = 'flex';
        } catch (e) {
            console.error('Lỗi giải mã token', e);
        }
    }
}

function decodeBase64Url(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

function copyToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        showToast('Chưa có token để sao chép', 'error');
        return;
    }
    navigator.clipboard.writeText(token);
    showToast('Đã sao chép JWT Token vào Clipboard!', 'success');
}

// -------------------------------------------------------------------
// 8. Security Quick Tests
// -------------------------------------------------------------------
async function testNoToken() {
    logToConsole('GET', '/api/auth/me (KHÔNG TOKEN)', {});
    try {
        const start = performance.now();
        const res = await fetch(`${getBaseUrl()}/api/auth/me`, { method: 'GET' });
        const elapsed = Math.round(performance.now() - start);
        logToConsole('RESP', `/api/auth/me [${res.status}] (${elapsed}ms)`, { note: 'Bảo mật chặn thành công khi thiếu Token' }, res.status === 401 ? 'success' : 'error');
        showToast(res.status === 401 ? 'PASS: Chặn 401 Unauthorized!' : `Nhận mã ${res.status}`, res.status === 401 ? 'success' : 'error');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function testTamperedToken() {
    const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrZXJAanB0LnZuIn0.TAMPERED_SIGNATURE";
    logToConsole('GET', '/api/auth/me (TOKEN GIẢ MẠO)', { token: fakeToken });

    try {
        const start = performance.now();
        const res = await fetch(`${getBaseUrl()}/api/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${fakeToken}` }
        });
        const elapsed = Math.round(performance.now() - start);
        logToConsole('RESP', `/api/auth/me [${res.status}] (${elapsed}ms)`, { note: 'Phát hiện chữ ký không khớp' }, res.status === 401 ? 'success' : 'error');
        showToast(res.status === 401 ? 'PASS: Chặn 401 Signature Mismatch!' : `Nhận mã ${res.status}`, res.status === 401 ? 'success' : 'error');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function testValidToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        showToast('Vui lòng Đăng nhập để có token hợp lệ trước!', 'error');
        return;
    }
    refreshProfile();
}

async function testCategories() {
    logToConsole('GET', '/api/categories (API CÔNG KHAI)', {});
    try {
        const start = performance.now();
        const res = await fetch(`${getBaseUrl()}/api/categories`, { method: 'GET' });
        const elapsed = Math.round(performance.now() - start);
        const data = await res.json().catch(() => ({}));
        logToConsole('RESP', `/api/categories [${res.status}] (${elapsed}ms)`, data, res.ok ? 'success' : 'error');
        showToast(`Gọi API công khai thành công (${res.status})`, 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// -------------------------------------------------------------------
// 9. Console Logger & Toast
// -------------------------------------------------------------------
function logToConsole(type, endpoint, data, status = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${status}`;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    let badgeClass = type.toLowerCase();
    if (endpoint.includes('[200]') || endpoint.includes('[201]')) badgeClass += ' status-200';
    if (endpoint.includes('[401]')) badgeClass += ' status-401';
    if (endpoint.includes('[500]')) badgeClass += ' status-500';

    entry.innerHTML = `
        <div>
            <span class="log-time">${timeStr}</span>
            <span class="log-badge ${badgeClass}">${type}</span>
            <strong>${endpoint}</strong>
        </div>
        ${data ? `<pre class="log-json">${escapeHtml(JSON.stringify(data, null, 2))}</pre>` : ''}
    `;

    consoleLogs.appendChild(entry);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

function clearConsole() {
    consoleLogs.innerHTML = `
        <div class="log-entry log-info">
            <span class="log-time">[HỆ THỐNG]</span>
            <span class="log-msg">Đã xóa sạch lịch sử nhật ký console.</span>
        </div>
    `;
}

function showToast(msg, type = 'info') {
    toastEl.textContent = msg;
    toastEl.className = `toast show ${type}`;
    setTimeout(() => {
        toastEl.className = 'toast';
    }, 3200);
}

function setButtonLoading(btn, isLoading) {
    const textSpan = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    if (isLoading) {
        btn.disabled = true;
        if (textSpan) textSpan.style.opacity = '0.5';
        if (spinner) spinner.style.display = 'inline-block';
    } else {
        btn.disabled = false;
        if (textSpan) textSpan.style.opacity = '1';
        if (spinner) spinner.style.display = 'none';
    }
}

function escapeHtml(string) {
    return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// -------------------------------------------------------------------
// 10. Initialization
// -------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    checkServerHealth();
    setInterval(checkServerHealth, 10000);

    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
        renderTokenInspector(savedToken);
        document.getElementById('auth-logged-dot').style.display = 'inline-block';
    }
});
