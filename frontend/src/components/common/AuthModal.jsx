import React, { useState, useEffect } from 'react';
import './AuthModal.css';
import Modal from './Modal';
import Button from './Button';
import authService from '../../services/authService';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'LOGIN', // 'LOGIN' | 'REGISTER' | 'FORGOT'
  onLoginSuccess
}) {
  const [mode, setMode] = useState(initialMode); // 'LOGIN' | 'REGISTER' | 'FORGOT'
  const [role, setRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'FARMER'

  // Form fields
  const [email, setEmail] = useState('customer@marketlink.vn');
  const [password, setPassword] = useState('Customer@123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('Nguyễn Nhựt Quang');
  const [phone, setPhone] = useState('0901234567');
  const [farmName, setFarmName] = useState('Nông Trại Xanh Ba Vì');

  // Show/Hide password toggle
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password / OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync mode with prop when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setSuccessMsg('');
      setOtpSent(false);
      setOtpCode('');
    }
  }, [isOpen, initialMode]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Submit Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await authService.login(email.trim(), password);
      const token = data.accessToken || data.token;
      let userRole = role;
      if (data.roles && data.roles.length > 0) {
        userRole = data.roles[0].replace('ROLE_', '');
      }
      const userName = data.fullName || email.split('@')[0];

      if (onLoginSuccess) {
        onLoginSuccess(token, userRole, userName);
      }
      onClose();
    } catch (err) {
      console.warn('Login error:', err);
      setErrorMsg(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        role: role === 'FARMER' ? 'FARMER' : 'CUSTOMER'
      };

      const res = await authService.register(payload);
      const token = res.accessToken || res.token || 'reg_token_' + Date.now();
      const userRole = res.role?.replace('ROLE_', '') || role;
      const userName = res.fullName || fullName;

      if (onLoginSuccess) {
        onLoginSuccess(token, userRole, userName);
      }
      onClose();
    } catch (err) {
      console.warn('Register error:', err);
      setErrorMsg(err.message || 'Đăng ký tài khoản thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email) {
      setErrorMsg('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.sendOtp(email.trim(), 'PASSWORD_RESET');
      setOtpSent(true);
      setCountdown(60);
      setSuccessMsg(res?.message || 'Mã xác minh OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến (Inbox) hoặc Spam.');
    } catch (err) {
      console.warn('Send OTP error:', err);
      setErrorMsg(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword(email.trim(), otpCode.trim(), password);
      setSuccessMsg(res?.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        setMode('LOGIN');
        setOtpSent(false);
        setOtpCode('');
        setErrorMsg('');
      }, 1500);
    } catch (err) {
      console.warn('Reset password error:', err);
      setErrorMsg(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'LOGIN'
          ? 'Đăng Nhập Vào MarketLink'
          : mode === 'REGISTER'
            ? 'Đăng Ký Thành Viên Mới'
            : 'Khôi Phục & Đặt Lại Mật Khẩu'
      }
      subtitle={
        mode === 'LOGIN'
          ? 'Kết nối trực tiếp nông sản sạch từ vườn ra chợ phiên'
          : mode === 'REGISTER'
            ? 'Tham gia mạng lưới đặt trước nông sản & mở sạp chợ'
            : 'Nhận mã OTP bảo mật để đặt lại mật khẩu mới'
      }
      maxWidth="500px"
    >
      <div className="ml-auth-modal-content">
        {/* Alerts */}
        {errorMsg && (
          <div className="ml-auth-alert ml-auth-alert--error" role="alert">
            <span className="ml-alert-icon">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="ml-auth-alert ml-auth-alert--success" role="status">
            <span className="ml-alert-icon">✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================
            MODE: LOGIN
            ======================================================== */}
        {mode === 'LOGIN' && (
          <>
            <form onSubmit={handleLogin} className="ml-auth-form">
              <div className="ml-form-group">
                <label className="ml-form-label">Email tài khoản:</label>
                <div className="ml-input-wrapper">
                  <span className="ml-input-icon">✉️</span>
                  <input
                    type="email"
                    className="ml-form-input ml-form-input--icon"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="ml-form-group">
                <div className="ml-form-label-row">
                  <label className="ml-form-label">Mật khẩu:</label>
                  <button
                    type="button"
                    className="ml-link-btn"
                    onClick={() => {
                      setMode('FORGOT');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="ml-input-wrapper">
                  <span className="ml-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="ml-form-input ml-form-input--icon ml-form-input--pwd"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="ml-pwd-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    aria-label="Ẩn hiện mật khẩu"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="ml-auth-submit-btn"
              >
                Đăng nhập ngay
              </Button>
            </form>

            <div className="ml-auth-switch">
              <p>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  className="ml-auth-switch-btn"
                  onClick={() => {
                    setMode('REGISTER');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                >
                  Đăng ký thành viên mới
                </button>
              </p>
            </div>
          </>
        )}

        {/* ========================================================
            MODE: REGISTER
            ======================================================== */}
        {mode === 'REGISTER' && (
          <>
            {/* Role Segment Toggle */}
            <div className="ml-auth-role-tabs">
              <button
                type="button"
                className={`ml-auth-role-tab ${role === 'CUSTOMER' ? 'active' : ''}`}
                onClick={() => setRole('CUSTOMER')}
              >
                <span className="ml-role-tab-icon">🛒</span>
                <span className="ml-role-tab-text">
                  <strong>Tôi là Khách Hàng</strong>
                  <small>Đặt trước & nhận hàng tại chợ</small>
                </span>
              </button>
              <button
                type="button"
                className={`ml-auth-role-tab ${role === 'FARMER' ? 'active' : ''}`}
                onClick={() => setRole('FARMER')}
              >
                <span className="ml-role-tab-icon">👨‍🌾</span>
                <span className="ml-role-tab-text">
                  <strong>Tôi là Nông Dân</strong>
                  <small>Đăng ký sạp & bán mùa vụ</small>
                </span>
              </button>
            </div>

            <form onSubmit={handleRegister} className="ml-auth-form">
              <div className="ml-form-group">
                <label className="ml-form-label">Họ và tên của bạn:</label>
                <div className="ml-input-wrapper">
                  <span className="ml-input-icon">👤</span>
                  <input
                    type="text"
                    className="ml-form-input ml-form-input--icon"
                    placeholder="VD: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="ml-form-row">
                <div className="ml-form-group">
                  <label className="ml-form-label">Số điện thoại:</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">📱</span>
                    <input
                      type="tel"
                      className="ml-form-input ml-form-input--icon"
                      placeholder="0912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Email tài khoản:</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">✉️</span>
                    <input
                      type="email"
                      className="ml-form-input ml-form-input--icon"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {role === 'FARMER' && (
                <div className="ml-form-group">
                  <label className="ml-form-label">Tên nhà vườn / Hợp tác xã:</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">🏡</span>
                    <input
                      type="text"
                      className="ml-form-input ml-form-input--icon"
                      placeholder="VD: Hợp Tác Xã Nông Sản Ba Vì"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="ml-form-row">
                <div className="ml-form-group">
                  <label className="ml-form-label">Mật khẩu (≥ 6 ký tự):</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="ml-form-input ml-form-input--icon"
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Xác nhận mật khẩu:</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">🔑</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="ml-form-input ml-form-input--icon"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {confirmPassword && password !== confirmPassword && (
                <div className="ml-field-hint ml-field-hint--error">
                  ⚠️ Mật khẩu xác nhận chưa khớp
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="ml-auth-submit-btn"
              >
                {role === 'FARMER' ? 'Đăng ký bán hàng tại chợ' : 'Đăng ký tài khoản mua sắm'}
              </Button>
            </form>

            <div className="ml-auth-switch">
              <p>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  className="ml-auth-switch-btn"
                  onClick={() => {
                    setMode('LOGIN');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </>
        )}

        {/* ========================================================
            MODE: FORGOT PASSWORD / OTP
            ======================================================== */}
        {mode === 'FORGOT' && (
          <div className="ml-auth-forgot-box">
            {!otpSent ? (
              // Step 1: Send OTP
              <form onSubmit={handleSendOtp} className="ml-auth-form">
                <p className="ml-forgot-instruction">
                  Nhập email đăng ký của bạn. Hệ thống sẽ tạo và gửi mã xác minh OTP gồm 6 chữ số để bạn đặt lại mật khẩu an toàn.
                </p>

                <div className="ml-form-group">
                  <label className="ml-form-label">Email tài khoản:</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">✉️</span>
                    <input
                      type="email"
                      className="ml-form-input ml-form-input--icon"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  className="ml-auth-submit-btn"
                >
                  Gửi mã xác minh OTP
                </Button>
              </form>
            ) : (
              // Step 2: Input OTP & New Password
              <form onSubmit={handleResetPassword} className="ml-auth-form">
                <div className="ml-email-otp-notice">
                  <span className="ml-email-otp-notice-icon">📬</span>
                  <div className="ml-email-otp-notice-text">
                    Mã xác minh bảo mật đã gửi tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến (Inbox) hoặc thư mục Spam/Rác.
                  </div>
                </div>

                <div className="ml-form-group">
                  <div className="ml-form-label-row">
                    <label className="ml-form-label">Mã OTP (6 chữ số):</label>
                    <button
                      type="button"
                      className="ml-link-btn"
                      disabled={countdown > 0}
                      onClick={handleSendOtp}
                    >
                      {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
                    </button>
                  </div>
                  <input
                    type="text"
                    className="ml-form-input ml-otp-input"
                    placeholder="VD: 123456"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Mật khẩu mới (≥ 6 ký tự):</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="ml-form-input ml-form-input--icon"
                      placeholder="Mật khẩu mới"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="ml-form-group">
                  <label className="ml-form-label">Xác nhận mật khẩu mới:</label>
                  <div className="ml-input-wrapper">
                    <span className="ml-input-icon">🔑</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="ml-form-input ml-form-input--icon"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  className="ml-auth-submit-btn"
                >
                  Xác nhận đặt lại mật khẩu
                </Button>
              </form>
            )}

            <div className="ml-auth-switch">
              <p>
                <button
                  type="button"
                  className="ml-auth-switch-btn"
                  onClick={() => {
                    setMode('LOGIN');
                    setErrorMsg('');
                    setSuccessMsg('');
                    setOtpSent(false);
                  }}
                >
                  ← Quay lại Đăng nhập
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
