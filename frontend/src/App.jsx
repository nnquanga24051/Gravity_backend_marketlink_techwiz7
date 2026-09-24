import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const BASE_URL = ''; // Relative path leverages Vite's proxy to http://localhost:8081

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('ml_token') || '');
  const [role, setRole] = useState(() => localStorage.getItem('ml_role') || 'GUEST');
  const [userName, setUserName] = useState(() => localStorage.getItem('ml_name') || 'Khách vãng lai');
  const [activeTab, setActiveTab] = useState('ai');

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý ảo AI của sàn Nông sản MarketLink. Tôi có thể hỗ trợ bạn tìm kiếm nông sản sạch, lịch họp chợ và các khung giờ nhận hàng tại sạp. Bạn cần hỗ trợ gì hôm nay?',
      markets: [],
      products: [],
      isStreaming: false
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [aiJson, setAiJson] = useState('// Phản hồi chi tiết từ AI sẽ hiển thị ở đây...');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, aiLoading, activeTab]);

  // Profile form state (for testing PUT /api/users/profile fix)
  const [fullName, setFullName] = useState('Nguyễn Nhựt Quang');
  const [phone, setPhone] = useState('0987654321');
  const [address, setAddress] = useState('Số 123 Đường Láng, Đống Đa, Hà Nội');
  const [lat, setLat] = useState('21.028511');
  const [lon, setLon] = useState('105.804817');
  const [profileResult, setProfileResult] = useState('// Bấm nút để gọi API xem hoặc sửa hồ sơ...');

  // Favorites test state
  const [favTargetType, setFavTargetType] = useState('MARKET');

  // General console outputs
  const [custOutput, setCustOutput] = useState('// Bấm nút để xem dữ liệu Chợ và Đơn hàng...');
  const [farmerOutput, setFarmerOutput] = useState('// Bấm nút để xem nghiệp vụ Nông dân...');
  const [adminOutput, setAdminOutput] = useState('// Bấm nút để xem số liệu Quản trị viên...');
  const [adminMetrics, setAdminMetrics] = useState({ customers: '-', farmers: '-', markets: '-', orders: '-' });

  // Custom request state
  const [customMethod, setCustomMethod] = useState('GET');
  const [customPath, setCustomPath] = useState('/api/markets');
  const [customBody, setCustomBody] = useState('');
  const [customOutput, setCustomOutput] = useState('// Kết quả gọi API tùy biến...');

  // Save auth
  const handleLogin = (tok, r, name) => {
    setToken(tok);
    setRole(r);
    setUserName(name);
    localStorage.setItem('ml_token', tok);
    localStorage.setItem('ml_role', r);
    localStorage.setItem('ml_name', name);
  };

  const handleLogout = () => {
    setToken('');
    setRole('GUEST');
    setUserName('Khách vãng lai');
    localStorage.removeItem('ml_token');
    localStorage.removeItem('ml_role');
    localStorage.removeItem('ml_name');
    alert('Đã xóa phiên đăng nhập!');
  };

  const quickLogin = async (email, password, displayName) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const primaryRole = (data.roles && data.roles[0]) ? data.roles[0].replace('ROLE_', '') : 'CUSTOMER';
        handleLogin(data.token, primaryRole, data.fullName || displayName);
        alert(`Đăng nhập thành công với vai trò: ${primaryRole}`);
      } else {
        alert('Đăng nhập thất bại: ' + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      alert('Lỗi kết nối Backend (8081): ' + err.message);
    }
  };

  // Generic API caller
  const callApi = async (path, method = 'GET', body = null) => {
    const start = performance.now();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const ms = Math.round(performance.now() - start);
      let data;
      const text = await res.text();
      try { data = JSON.parse(text); } catch { data = text; }

      return { status: res.status, ms, data };
    } catch (err) {
      return { status: 500, ms: 0, data: { error: err.message } };
    }
  };

  // Stop AI streaming
  const stopAiStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAiLoading(false);
    setChatMessages(prev => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      if (lastIdx >= 0 && copy[lastIdx].sender === 'bot') {
        copy[lastIdx] = { ...copy[lastIdx], isStreaming: false };
      }
      return copy;
    });
  };

  // AI chat send (Real-time SSE with dynamic typewriter fallback)
  const sendAi = async (messageText) => {
    const q = messageText || aiInput;
    if (!q.trim() || aiLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    const userMsg = { sender: 'user', text: q };
    const botPlaceholder = {
      sender: 'bot',
      text: '',
      isStreaming: true,
      markets: [],
      products: [],
      timing: ''
    };

    setChatMessages(prev => [...prev, userMsg, botPlaceholder]);
    setAiInput('');
    setAiLoading(true);

    const payload = { message: q };
    if (customKey.trim()) payload.apiKey = customKey.trim();

    try {
      // 1. Try real-time streaming endpoint (SSE)
      let streamRes = null;

      try {
        streamRes = await fetch(`${BASE_URL}/api/ai/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortCtrl.signal
        });
        if (streamRes.status === 404) {
          streamRes = await fetch(`${BASE_URL}/api/ai/assistant/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: abortCtrl.signal
          });
        }
      } catch (streamErr) {
        if (abortCtrl.signal.aborted) return;
        console.warn('Direct stream connection error, will use fallback:', streamErr);
      }

      if (streamRes && streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const token = line.replace(/^\s*data:\s?/, '');
              accumulated += token;
              setChatMessages(prev => {
                const copy = [...prev];
                const lastIdx = copy.length - 1;
                if (lastIdx >= 0 && copy[lastIdx].sender === 'bot') {
                  copy[lastIdx] = { ...copy[lastIdx], text: accumulated, isStreaming: true };
                }
                return copy;
              });
            }
          }
        }

        if (accumulated.trim().length > 0) {
          setChatMessages(prev => {
            const copy = [...prev];
            const lastIdx = copy.length - 1;
            if (lastIdx >= 0 && copy[lastIdx].sender === 'bot') {
              copy[lastIdx] = { ...copy[lastIdx], isStreaming: false };
            }
            return copy;
          });
          setAiJson(JSON.stringify({ mode: 'REALTIME_SSE', length: accumulated.length, status: 200 }, null, 2));
          return;
        }
      }

      // 2. Resilient fallback: call standard API and stream token-by-token
      let res = await fetch(`${BASE_URL}/api/ai/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortCtrl.signal
      });

      if (res.status === 404) {
        res = await fetch(`${BASE_URL}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortCtrl.signal
        });
      }

      const raw = await res.json();
      const aiData = raw.data || raw;
      const fullReply = aiData.reply || raw.message || 'Dạ, tôi chưa tìm thấy câu trả lời phù hợp.';
      setAiJson(JSON.stringify(raw, null, 2));

      // Tokenize and stream into UI with 24ms typewriter delay
      const tokens = fullReply.split(/(?<=\s)|(?<=[.,!?])/);
      let currentTyped = '';

      for (let i = 0; i < tokens.length; i++) {
        if (abortCtrl.signal.aborted) break;
        currentTyped += tokens[i];
        setChatMessages(prev => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          if (lastIdx >= 0 && copy[lastIdx].sender === 'bot') {
            copy[lastIdx] = {
              ...copy[lastIdx],
              text: currentTyped,
              isStreaming: i < tokens.length - 1,
              markets: aiData.relevantMarkets || [],
              products: aiData.relevantProducts || [],
              timing: aiData.timingNotes || ''
            };
          }
          return copy;
        });
        await new Promise(r => setTimeout(r, 24));
      }
    } catch (err) {
      if (abortCtrl.signal.aborted) return;
      setChatMessages(prev => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (lastIdx >= 0 && copy[lastIdx].sender === 'bot') {
          copy[lastIdx] = {
            ...copy[lastIdx],
            text: 'Lỗi gọi API Chat: ' + err.message,
            isStreaming: false
          };
        }
        return copy;
      });
    } finally {
      setAiLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Test Profile PUT fix
  const handleUpdateProfile = async () => {
    setProfileResult('Đang gửi PUT /api/users/profile...');
    const body = {
      fullName,
      phoneNumber: phone,
      defaultAddress: address,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon)
    };
    const res = await callApi('/api/users/profile', 'PUT', body);
    setProfileResult(
      `[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2)
    );
  };

  const handleGetProfile = async () => {
    setProfileResult('Đang gửi GET /api/users/profile...');
    const res = await callApi('/api/users/profile', 'GET');
    setProfileResult(
      `[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2)
    );
  };

  const handleFavorites = async () => {
    setProfileResult(`Đang kiểm tra GET /api/customer/favorites?targetType=${favTargetType}...`);
    const res = await callApi(`/api/customer/favorites?targetType=${favTargetType}`, 'GET');
    setProfileResult(
      `[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2)
    );
  };

  // Admin metrics
  const loadAdminMetrics = async () => {
    setAdminOutput('Đang tải dữ liệu chỉ số toàn sàn...');
    const res = await callApi('/api/admin/dashboard/metrics', 'GET');
    setAdminOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
    const payload = res.data?.data || res.data;
    if (payload && (payload.totalCustomers !== undefined || payload.customers !== undefined)) {
      setAdminMetrics({
        customers: payload.totalCustomers ?? payload.customers ?? 0,
        farmers: payload.totalFarmers ?? payload.farmers ?? 0,
        markets: payload.totalMarkets ?? payload.markets ?? 0,
        orders: payload.totalOrders ?? payload.orders ?? 0
      });
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header>
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">🥬</div>
            <div>
              <div className="brand-name">MarketLink Frontend Studio</div>
              <div className="brand-sub">React 19 + Vite • Cổng 5173 • Techwiz 7 Sandbox</div>
            </div>
          </div>

          <div className="auth-bar">
            <div className="user-tag">
              <div className={`dot ${token ? 'online' : ''}`}></div>
              <span>{userName}</span>
              <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
            </div>

            <div className="btn-actions">
              <button className="btn btn-outline" onClick={() => quickLogin('customer@marketlink.vn', 'Customer@123', 'Trần Thị Khách Hàng')}>🛒 Khách Hàng</button>
              <button className="btn btn-outline" onClick={() => quickLogin('farmer@marketlink.vn', 'Farmer@123', 'Nguyễn Văn Nông Dân')}>👨‍🌾 Nông Dân</button>
              <button className="btn btn-outline" onClick={() => quickLogin('admin@marketlink.vn', 'Admin@123', 'Quản Trị Viên')}>👑 Admin</button>
              {token && <button className="btn btn-danger" onClick={handleLogout}>Đăng Xuất</button>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Tabs */}
      <main>
        <div className="tab-nav">
          <button className={`tab-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>🤖 AI Assistant Chatbot</button>
          <button className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>👤 Profile & Favorites (Test Fix)</button>
          <button className={`tab-item ${activeTab === 'customer' ? 'active' : ''}`} onClick={() => setActiveTab('customer')}>🛒 Chợ & Nông Sản</button>
          <button className={`tab-item ${activeTab === 'farmer' ? 'active' : ''}`} onClick={() => setActiveTab('farmer')}>👨‍🌾 Nghiệp vụ Nông Dân</button>
          <button className={`tab-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>👑 Quản Trị Viên (Admin)</button>
          <button className={`tab-item ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>⚡ API Playground Tùy Biến</button>
        </div>

        {/* TAB 1: AI Assistant */}
        {activeTab === 'ai' && (
          <div className="grid-cols-2">
            <div className="card">
              <div className="card-top">
                <div className="card-heading">
                  🤖 Trợ lý ảo Nông sản MarketLink
                  <span className="live-badge">
                    <span className="live-pulse"></span>
                    {aiLoading ? 'Đang truyền trực tiếp...' : 'Real-time Chat'}
                  </span>
                </div>
                <span className="badge-tag">SSE & RAG</span>
              </div>

              <div className="chat-window">
                <div className="chat-history">
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className={`chat-msg ${m.sender}`}>
                      <div className="avatar-circle">{m.sender === 'bot' ? '🥬' : '👤'}</div>
                      <div className="bubble">
                        <div>
                          {m.text}
                          {m.isStreaming && <span className="streaming-cursor">▌</span>}
                        </div>
                        {m.isStreaming && !m.text && (
                          <div className="stream-typing-row">
                            <span>Đang kết nối luồng dữ liệu chợ...</span>
                            <span className="typing-dots"><span></span><span></span><span></span></span>
                          </div>
                        )}
                        {m.markets && m.markets.length > 0 && (
                          <div className="tags-row">
                            {m.markets.map((mk, i) => <span key={i} className="badge-tag">📍 {mk}</span>)}
                          </div>
                        )}
                        {m.products && m.products.length > 0 && (
                          <div className="tags-row">
                            {m.products.map((pr, i) => <span key={i} className="badge-tag">🥦 {pr}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="quick-chips">
                  <span className="chip-btn" onClick={() => sendAi('Chợ nào mở vào Chủ nhật và có bán rau sạch?')}>Chợ mở Chủ nhật?</span>
                  <span className="chip-btn" onClick={() => sendAi('Giá cà chua bi hiện tại là bao nhiêu?')}>Giá cà chua bi?</span>
                  <span className="chip-btn" onClick={() => sendAi('Quy định đặt trước và nhận hàng tại sạp thế nào?')}>Quy định nhận hàng?</span>
                  <span className="chip-btn" onClick={() => sendAi('Thứ 7 này có chợ nào bán xà lách thủy canh không?')}>Xà lách thứ 7?</span>
                </div>

                <div className="chat-footer">
                  <input
                    className="input-control"
                    type="text"
                    placeholder="Gõ câu hỏi cho AI (ví dụ: Chợ nào bán rau sạch vào Chủ nhật?)..."
                    value={aiInput}
                    disabled={aiLoading}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !aiLoading && sendAi()}
                  />
                  {aiLoading ? (
                    <button className="btn-stop" onClick={stopAiStream}>
                      ⏹ Dừng
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => sendAi()}>
                      Gửi ↵
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-top">
                <div className="card-heading">⚙️ Cấu hình AI & JSON Phản Hồi Gốc</div>
              </div>
              <div className="form-item">
                <label>API Key tùy chọn (để trống sẽ dùng cấu hình server application.properties):</label>
                <input
                  className="input-control"
                  type="password"
                  placeholder="AIzaSy... (Tùy chọn)"
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                />
              </div>
              <div className="form-item">
                <label>Phản hồi JSON chi tiết từ máy chủ:</label>
                <pre className="code-console">{aiJson}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Profile & Favorites */}
        {activeTab === 'profile' && (
          <div className="grid-cols-2">
            <div className="card">
              <div className="card-top">
                <div className="card-heading">🛠️ Test Cập Nhật Profile (Vừa sửa lỗi HTTP 500)</div>
                <span className="badge-tag">PUT /api/users/profile</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Bản vá đã loại bỏ cơ chế nhảy nhầm vào <code>switchIfEmpty</code> trên <code>Mono&lt;Void&gt;</code>. Hãy bấm nút dưới để test kết quả trả về!
              </p>

              <div className="form-item">
                <label>Họ và Tên:</label>
                <input className="input-control" type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="form-item">
                <label>Số điện thoại:</label>
                <input className="input-control" type="text" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-item">
                <label>Địa chỉ nhận hàng (Customer):</label>
                <input className="input-control" type="text" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="form-item">
                <label>Tọa độ (Latitude, Longitude):</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input className="input-control" type="number" step="0.000001" value={lat} onChange={e => setLat(e.target.value)} />
                  <input className="input-control" type="number" step="0.000001" value={lon} onChange={e => setLon(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleUpdateProfile}>Cập Nhật Profile (PUT)</button>
                <button className="btn btn-outline" onClick={handleGetProfile}>Xem Profile Hiện Tại (GET)</button>
              </div>
            </div>

            <div className="card">
              <div className="card-top">
                <div className="card-heading">⭐ Test Mục Yêu Thích (Kiểm chứng RBAC)</div>
                <span className="badge-tag">GET /api/customer/favorites</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                API này bắt buộc vai trò <b>ROLE_CUSTOMER</b>. Nếu đang đăng nhập Farmer/Admin sẽ nhận <b>403 Forbidden</b>. Hãy chuyển sang tài khoản Khách hàng để nhận <b>200 OK</b>!
              </p>

              <div className="form-item">
                <label>Loại mục yêu thích (targetType):</label>
                <select className="input-control" value={favTargetType} onChange={e => setFavTargetType(e.target.value)}>
                  <option value="MARKET">MARKET (Chợ nông sản)</option>
                  <option value="PRODUCT">PRODUCT (Nông sản sạch)</option>
                  <option value="FARMER">FARMER (Nông dân)</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleFavorites}>Lấy Danh Sách Yêu Thích</button>

              <div style={{ marginTop: 18 }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kết quả phản hồi từ Server:</label>
                <pre className="code-console" style={{ marginTop: 6 }}>{profileResult}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Customer Flows */}
        {activeTab === 'customer' && (
          <div className="grid-cols-2">
            <div className="card">
              <div className="card-top">
                <div className="card-heading">🛒 Khám phá Chợ & Nông sản</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <button className="btn btn-outline" onClick={async () => {
                  const res = await callApi('/api/markets', 'GET');
                  setCustOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>Danh sách Chợ (GET /api/markets)</button>

                <button className="btn btn-outline" onClick={async () => {
                  const res = await callApi('/api/categories', 'GET');
                  setCustOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>Danh mục (GET /api/categories)</button>

                <button className="btn btn-outline" onClick={async () => {
                  let res = await callApi('/api/products/search?keyword=rau', 'GET');
                  if (res.status === 404 || res.status === 500) {
                    res = await callApi('/api/products?keyword=rau', 'GET');
                  }
                  setCustOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>🔍 Tìm kiếm 'rau' (GET /api/products/search)</button>
              </div>

              <div className="card-top" style={{ marginTop: 20 }}>
                <div className="card-heading">📦 Đơn Đặt Trước (Pre-Orders)</div>
              </div>
              <button className="btn btn-primary" onClick={async () => {
                const res = await callApi('/api/customer/orders', 'GET');
                setCustOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
              }}>Xem Lịch Sử Đơn Hàng Của Tôi</button>
            </div>

            <div className="card">
              <div className="card-top"><div className="card-heading">🖥️ Phản Hồi Từ Máy Chủ</div></div>
              <pre className="code-console">{custOutput}</pre>
            </div>
          </div>
        )}

        {/* TAB 4: Farmer Flows */}
        {activeTab === 'farmer' && (
          <div className="grid-cols-2">
            <div className="card">
              <div className="card-top">
                <div className="card-heading">👨‍🌾 Phân hệ Quản Lý Gian Hàng (Yêu cầu ROLE_FARMER)</div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Bấm nút <b>"👨‍🌾 Nông Dân"</b> trên thanh header để kích hoạt quyền trước khi gọi các API dưới đây:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-primary" onClick={async () => {
                  const res = await callApi('/api/farmer/orders', 'GET');
                  setFarmerOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>📋 Xem Danh Sách Đơn Hàng Tới (GET /api/farmer/orders)</button>

                <button className="btn btn-outline" onClick={async () => {
                  const res = await callApi('/api/farmer/orders/summary', 'GET');
                  setFarmerOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>💰 Tóm Tắt Doanh Thu & Đơn Chờ (GET /api/farmer/orders/summary)</button>

                <button className="btn btn-outline" onClick={async () => {
                  const res = await callApi('/api/farmer/orders/insights/best-selling', 'GET');
                  setFarmerOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>🔥 Top Nông Sản Bán Chạy Nhất (GET /api/farmer/orders/insights/best-selling)</button>

                <button className="btn btn-outline" onClick={async () => {
                  let res = await callApi('/api/farmer/stock-templates', 'GET');
                  if (res.status === 404) {
                    res = await callApi('/api/farmer/weekly-stock', 'GET');
                  }
                  setFarmerOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>📅 Xem Mẫu Tồn Kho Định Kỳ (GET /api/farmer/stock-templates)</button>
              </div>
            </div>

            <div className="card">
              <div className="card-top"><div className="card-heading">🖥️ Phản Hồi Từ Máy Chủ</div></div>
              <pre className="code-console">{farmerOutput}</pre>
            </div>
          </div>
        )}

        {/* TAB 5: Admin */}
        {activeTab === 'admin' && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-top">
                <div className="card-heading">👑 Bảng Điều Khiển Quản Trị Sàn (Yêu cầu ROLE_ADMIN)</div>
                <button className="btn btn-primary" onClick={loadAdminMetrics}>Tải Chỉ Số Sàn</button>
              </div>

              <div className="metrics-row">
                <div className="metric-box">
                  <div className="metric-txt">Tổng Khách Hàng</div>
                  <div className="metric-num">{adminMetrics.customers}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-txt">Tổng Nông Dân</div>
                  <div className="metric-num">{adminMetrics.farmers}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-txt">Tổng Chợ Họp</div>
                  <div className="metric-num">{adminMetrics.markets}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-txt">Tổng Đơn Hàng</div>
                  <div className="metric-num">{adminMetrics.orders}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={async () => {
                  let res = await callApi('/api/admin/dashboard/reports/markets', 'GET');
                  if (res.status === 404) {
                    res = await callApi('/api/admin/dashboard/reports/revenue', 'GET');
                  }
                  setAdminOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>📊 Báo Cáo Doanh Thu Theo Chợ</button>

                <button className="btn btn-outline" onClick={async () => {
                  let res = await callApi('/api/admin/dashboard/reports/most-active-farmers', 'GET');
                  if (res.status === 404) {
                    res = await callApi('/api/admin/dashboard/reports/active-farmers', 'GET');
                  }
                  setAdminOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>🏆 Top Nông Dân Tích Cực Nhất</button>

                <button className="btn btn-outline" onClick={async () => {
                  const res = await callApi('/api/admin/users', 'GET');
                  setAdminOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
                }}>👥 Quản Lý Người Dùng & Duyệt KYC</button>
              </div>
            </div>

            <div className="card">
              <div className="card-top"><div className="card-heading">🖥️ Phản Hồi Từ Máy Chủ (Admin)</div></div>
              <pre className="code-console">{adminOutput}</pre>
            </div>
          </div>
        )}

        {/* TAB 6: Custom REST API Playground */}
        {activeTab === 'custom' && (
          <div className="grid-cols-2">
            <div className="card">
              <div className="card-top">
                <div className="card-heading">⚡ Tùy Biến API Request</div>
              </div>
              <div className="form-item" style={{ display: 'flex', gap: 10 }}>
                <select className="input-control" style={{ width: 120 }} value={customMethod} onChange={e => setCustomMethod(e.target.value)}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  className="input-control"
                  type="text"
                  placeholder="/api/..."
                  value={customPath}
                  onChange={e => setCustomPath(e.target.value)}
                />
              </div>

              <div className="form-item">
                <label>Request Body (JSON):</label>
                <textarea
                  className="input-control"
                  style={{ minHeight: 120, fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}
                  placeholder='{"key": "value"}'
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" onClick={async () => {
                let parsed = null;
                if (customBody.trim()) {
                  try { parsed = JSON.parse(customBody.trim()); } catch { alert('JSON Body không hợp lệ!'); return; }
                }
                setCustomOutput('Đang gửi request...');
                const res = await callApi(customPath, customMethod, parsed);
                setCustomOutput(`[HTTP ${res.status}] (${res.ms}ms)\n` + JSON.stringify(res.data, null, 2));
              }}>Gửi Request</button>
            </div>

            <div className="card">
              <div className="card-top"><div className="card-heading">🖥️ Response Output</div></div>
              <pre className="code-console">{customOutput}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
