// frontend/src/services/authService.js
import apiClient from './apiClient';

export const authService = {
  /**
   * Log in user with email & password
   */
  async login(email, password) {
    const data = await apiClient.post('/auth/login', { email, password });
    
    // Save authentication details
    const token = data.accessToken || data.token;
    if (token) {
      localStorage.setItem('ml_token', token);
      localStorage.setItem('accessToken', token);
      
      let role = 'CUSTOMER';
      if (data.roles && data.roles.length > 0) {
        const firstRole = data.roles[0];
        role = firstRole.replace('ROLE_', '');
      } else if (data.role) {
        role = data.role.replace('ROLE_', '');
      }
      
      localStorage.setItem('ml_role', role);
      localStorage.setItem('ml_name', data.fullName || email.split('@')[0]);
      localStorage.setItem('ml_user_id', data.userId || '');
      localStorage.setItem('ml_email', data.email || email);
    }
    
    return data;
  },

  /**
   * Register new user (Customer or Farmer)
   */
  async register(registerData) {
    const data = await apiClient.post('/auth/register', registerData);
    
    const token = data.accessToken || data.token;
    if (token) {
      localStorage.setItem('ml_token', token);
      localStorage.setItem('accessToken', token);
      
      let role = registerData.role || 'CUSTOMER';
      if (data.roles && data.roles.length > 0) {
        role = data.roles[0].replace('ROLE_', '');
      }
      localStorage.setItem('ml_role', role);
      localStorage.setItem('ml_name', data.fullName || registerData.fullName || '');
      localStorage.setItem('ml_user_id', data.userId || '');
      localStorage.setItem('ml_email', data.email || registerData.email || '');
    }
    
    return data;
  },

  /**
   * Send OTP for Email Verification, Phone OTP, or Password Reset
   */
  async sendOtp(emailOrPhone, type = 'PASSWORD_RESET') {
    const res = await apiClient.post('/auth/verification/send-otp', {
      emailOrPhone,
      type
    });
    return res?.data || res;
  },

  /**
   * Verify OTP code
   */
  async verifyOtp(emailOrPhone, code, type = 'PASSWORD_RESET') {
    const res = await apiClient.post('/auth/verification/verify-otp', {
      emailOrPhone,
      code,
      type
    });
    return res?.data || res;
  },

  /**
   * Reset Password with OTP
   */
  async resetPassword(emailOrPhone, code, newPassword) {
    const res = await apiClient.post('/auth/reset-password', {
      emailOrPhone,
      code,
      newPassword
    });
    return res?.data || res;
  },

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  /**
   * Get stored session details from localStorage
   */
  getStoredUser() {
    const token = localStorage.getItem('ml_token') || localStorage.getItem('accessToken');
    const role = localStorage.getItem('ml_role') || 'GUEST';
    const name = localStorage.getItem('ml_name') || 'Khách vãng lai';
    const email = localStorage.getItem('ml_email') || '';
    const userId = localStorage.getItem('ml_user_id') || '';
    return { token, role, name, email, userId, isLoggedIn: !!token && role !== 'GUEST' };
  },

  /**
   * Logout and clear session storage
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('ml_token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('ml_role');
      localStorage.removeItem('ml_name');
      localStorage.removeItem('ml_user_id');
      localStorage.removeItem('ml_email');
    }
  }
};

export default authService;
