import React, { useState, useEffect } from 'react';
import ImageUploadInput from './ImageUploadInput';
import { formatImageUrl } from '../services/apiClient';

export default function AdminMarketStudio({ callApi, role, token }) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMarketId, setCurrentMarketId] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLat, setFormLat] = useState('21.038234');
  const [formLng, setFormLng] = useState('105.817456');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formSchedules, setFormSchedules] = useState([
    { dayOfWeek: 6, openTime: '06:30', closeTime: '11:30' },
    { dayOfWeek: 7, openTime: '06:30', closeTime: '11:30' }
  ]);

  // Modal State for Stall Assignments
  const [showStallModal, setShowStallModal] = useState(false);
  const [selectedMarketForStalls, setSelectedMarketForStalls] = useState(null);
  const [marketAssignments, setMarketAssignments] = useState([]);
  const [stallLoading, setStallLoading] = useState(false);

  // Assign Farmer form fields
  const [assignFarmerId, setAssignFarmerId] = useState('');
  const [assignStallNumber, setAssignStallNumber] = useState('');
  const [assignStatus, setAssignStatus] = useState('ACTIVE');

  // Load Markets
  const loadMarkets = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        queryParams.append('status', statusFilter);
      }
      if (searchKeyword.trim()) {
        queryParams.append('search', searchKeyword.trim());
      }

      const url = `/api/admin/markets?${queryParams.toString()}`;
      const res = await callApi(url, 'GET');
      if (res.status === 200 && res.data) {
        const list = res.data.data || res.data;
        setMarkets(Array.isArray(list) ? list : []);
      } else {
        setStatusMessage(`[HTTP ${res.status}] ${res.data?.message || 'Không thể tải danh sách chợ.'}`);
      }
    } catch (err) {
      setStatusMessage('Lỗi kết nối khi tải chợ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarkets();
  }, [statusFilter]);

  // Open Create Modal
  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentMarketId(null);
    setFormName('');
    setFormAddress('');
    setFormLat('21.038234');
    setFormLng('105.817456');
    setFormDesc('Chợ phiên quy tụ các hợp tác xã nông sản sạch, rau hữu cơ đạt chuẩn VietGAP.');
    setFormImage('https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&auto=format&fit=crop&q=80');
    setFormStatus('ACTIVE');
    setFormSchedules([
      { dayOfWeek: 6, openTime: '06:30', closeTime: '11:30' },
      { dayOfWeek: 7, openTime: '06:30', closeTime: '11:30' }
    ]);
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (market) => {
    setIsEditing(true);
    setCurrentMarketId(market.marketId);
    setFormName(market.name || '');
    setFormAddress(market.address || '');
    setFormLat(market.latitude ? String(market.latitude) : '21.038234');
    setFormLng(market.longitude ? String(market.longitude) : '105.817456');
    setFormDesc(market.description || '');
    setFormImage(market.imageUrl || '');
    setFormStatus(market.status || 'ACTIVE');

    if (market.schedules && market.schedules.length > 0) {
      setFormSchedules(market.schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        openTime: s.openTime ? s.openTime.substring(0, 5) : '06:30',
        closeTime: s.closeTime ? s.closeTime.substring(0, 5) : '11:30'
      })));
    } else {
      setFormSchedules([{ dayOfWeek: 7, openTime: '06:30', closeTime: '11:30' }]);
    }
    setShowModal(true);
  };

  // Handle Submit (Create or Update)
  const handleSaveMarket = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim()) {
      alert('Vui lòng điền đầy đủ Tên chợ và Địa chỉ!');
      return;
    }

    const payload = {
      name: formName.trim(),
      address: formAddress.trim(),
      latitude: parseFloat(formLat),
      longitude: parseFloat(formLng),
      description: formDesc.trim(),
      imageUrl: formImage.trim(),
      status: formStatus,
      schedules: formSchedules.map(s => ({
        dayOfWeek: parseInt(s.dayOfWeek),
        openTime: s.openTime ? s.openTime.substring(0, 5) : '06:00',
        closeTime: s.closeTime ? s.closeTime.substring(0, 5) : '12:00'
      }))
    };

    if (isEditing) {
      const res = await callApi(`/api/admin/markets/${currentMarketId}`, 'PUT', payload);
      if (res.status === 200) {
        alert('Cập nhật chợ nông sản thành công!');
        setShowModal(false);
        loadMarkets();
      } else {
        alert('Cập nhật thất bại: ' + (res.data?.message || JSON.stringify(res.data)));
      }
    } else {
      const res = await callApi('/api/admin/markets', 'POST', payload);
      if (res.status === 201 || res.status === 200) {
        alert('Tạo chợ nông sản mới thành công!');
        setShowModal(false);
        loadMarkets();
      } else {
        alert('Tạo chợ thất bại: ' + (res.data?.message || JSON.stringify(res.data)));
      }
    }
  };

  // Toggle Market Status (Active / Inactive)
  const handleToggleStatus = async (market) => {
    const newStatus = market.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionName = newStatus === 'ACTIVE' ? 'Mở lại hoạt động' : 'Tạm dừng hoạt động';
    if (!window.confirm(`Bạn có chắc muốn ${actionName} cho chợ "${market.name}"?`)) return;

    const res = await callApi(`/api/admin/markets/${market.marketId}/status?status=${newStatus}`, 'PATCH');
    if (res.status === 200) {
      loadMarkets();
    } else {
      alert('Đổi trạng thái thất bại: ' + (res.data?.message || JSON.stringify(res.data)));
    }
  };

  // Soft Delete (Tạm dừng)
  const handleSoftDelete = async (market) => {
    if (!window.confirm(`Xác nhận TẠM DỪNG (Xóa mềm) chợ "${market.name}"? Chợ sẽ ẩn khỏi bản đồ nhưng dữ liệu đơn hàng vẫn được bảo toàn.`)) return;

    const res = await callApi(`/api/admin/markets/${market.marketId}`, 'DELETE');
    if (res.status === 200) {
      alert('Đã tạm dừng hoạt động chợ thành công!');
      loadMarkets();
    } else {
      alert('Lỗi: ' + (res.data?.message || JSON.stringify(res.data)));
    }
  };

  // Hard Delete (Permanent)
  const handlePermanentDelete = async (market) => {
    const confirmMsg = prompt(
      `CẢNH BÁO NGUY HIỂM: Bạn đang chuẩn bị XÓA VĨNH VIỄN chợ "${market.name}"!\n` +
      `Nếu chợ đã có đơn hàng trong quá khứ, hệ thống sẽ từ chối để tránh mất mát dữ liệu kế toán.\n\n` +
      `Nhập chữ "XOA" vào ô bên dưới để xác nhận xóa vĩnh viễn:`
    );
    if (confirmMsg !== 'XOA') {
      alert('Đã hủy thao tác xóa vĩnh viễn.');
      return;
    }

    const res = await callApi(`/api/admin/markets/${market.marketId}/permanent`, 'DELETE');
    if (res.status === 200) {
      alert('Đã xóa vĩnh viễn chợ nông sản thành công!');
      loadMarkets();
    } else {
      alert('Không thể xóa vĩnh viễn: ' + (res.data?.message || JSON.stringify(res.data)));
    }
  };

  // Schedule Rows Helpers
  const addScheduleRow = () => {
    setFormSchedules([...formSchedules, { dayOfWeek: 7, openTime: '06:00', closeTime: '11:30' }]);
  };

  const removeScheduleRow = (idx) => {
    setFormSchedules(formSchedules.filter((_, i) => i !== idx));
  };

  const updateScheduleRow = (idx, field, val) => {
    const updated = [...formSchedules];
    updated[idx][field] = val;
    setFormSchedules(updated);
  };

  // Stall Management Modal
  const openStallModal = async (market) => {
    setSelectedMarketForStalls(market);
    setShowStallModal(true);
    setStallLoading(true);
    try {
      const res = await callApi(`/api/admin/markets/${market.marketId}/assignments`, 'GET');
      if (res.status === 200 && res.data) {
        const list = res.data.data || res.data;
        setMarketAssignments(Array.isArray(list) ? list : []);
      } else {
        setMarketAssignments([]);
      }
    } catch {
      setMarketAssignments([]);
    } finally {
      setStallLoading(false);
    }
  };

  // Assign Farmer to Stall
  const handleAssignFarmer = async (e) => {
    e.preventDefault();
    if (!assignFarmerId || !assignStallNumber.trim()) {
      alert('Vui lòng nhập ID nông dân và Tên sạp!');
      return;
    }

    const payload = {
      farmerId: parseInt(assignFarmerId),
      marketId: selectedMarketForStalls.marketId,
      stallNumber: assignStallNumber.trim(),
      status: assignStatus
    };

    const res = await callApi('/api/admin/markets/assignments', 'POST', payload);
    if (res.status === 200 || res.status === 201) {
      alert('Phân sạp cho nông dân thành công!');
      setAssignFarmerId('');
      setAssignStallNumber('');
      openStallModal(selectedMarketForStalls);
      loadMarkets();
    } else {
      alert('Lỗi phân sạp: ' + (res.data?.message || JSON.stringify(res.data)));
    }
  };

  // Change Assignment Status
  const handleUpdateStallStatus = async (assignmentId, newStatus) => {
    const res = await callApi(`/api/admin/markets/assignments/${assignmentId}/status?status=${newStatus}`, 'PATCH');
    if (res.status === 200) {
      openStallModal(selectedMarketForStalls);
    } else {
      alert('Lỗi cập nhật sạp: ' + (res.data?.message || JSON.stringify(res.data)));
    }
  };

  // Delete Assignment
  const handleDeleteStall = async (assignmentId, stallNum) => {
    if (!window.confirm(`Xác nhận xóa phân bổ sạp "${stallNum}"?`)) return;
    const res = await callApi(`/api/admin/markets/assignments/${assignmentId}`, 'DELETE');
    if (res.status === 200) {
      openStallModal(selectedMarketForStalls);
      loadMarkets();
    } else {
      alert('Lỗi xóa sạp: ' + (res.data?.message || JSON.stringify(res.data)));
    }
  };

  const getDayName = (d) => {
    switch (parseInt(d)) {
      case 1: return 'Thứ 2';
      case 2: return 'Thứ 3';
      case 3: return 'Thứ 4';
      case 4: return 'Thứ 5';
      case 5: return 'Thứ 6';
      case 6: return 'Thứ 7';
      case 7: return 'Chủ Nhật';
      default: return `Thứ ${d}`;
    }
  };

  return (
    <div className="admin-market-container" style={{ marginTop: 24 }}>
      {/* Top Banner & Action Controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-top" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-heading" style={{ fontSize: '1.25rem' }}>
              🏪 Quản Lý Chợ Nông Sản (Market Management CRUD)
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Hệ thống tạo lập, điều phối lịch họp định kỳ, cấp phát sạp nông dân và kiểm soát trạng thái phiên chợ.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={openCreateModal}>
              ➕ Thêm Điểm Chợ Mới
            </button>
            <button className="btn btn-outline" onClick={loadMarkets}>
              🔄 Làm Mới
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Tất Cả ({markets.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'ACTIVE' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              🟢 Đang Hoạt Động
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'INACTIVE' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter('INACTIVE')}
            >
              🔴 Đã Tạm Dừng
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 260, display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="input-control"
              placeholder="🔍 Tìm kiếm theo tên chợ, quận huyện, địa chỉ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMarkets()}
            />
            <button className="btn btn-outline" onClick={loadMarkets}>Tìm</button>
          </div>
        </div>

        {statusMessage && (
          <div style={{ marginTop: 10, fontSize: '0.85rem', color: '#f87171' }}>
            ⚠️ {statusMessage}
          </div>
        )}
      </div>

      {/* Markets Cards / Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>⏳ Đang tải danh sách chợ...</div>
        </div>
      ) : markets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🌾</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Chưa có chợ nào phù hợp với bộ lọc</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
            Bấm "Thêm Điểm Chợ Mới" để tạo phiên chợ đầu tiên trên hệ thống.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {markets.map((m) => (
            <div key={m.marketId} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Header with image */}
              <div style={{ position: 'relative', height: 140, borderRadius: '10px 10px 0 0', overflow: 'hidden', margin: '-18px -18px 14px -18px' }}>
                <img
                  src={formatImageUrl(m.imageUrl, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&auto=format&fit=crop&q=80')}
                  alt={m.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&auto=format&fit=crop&q=80'; }}
                />
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  display: 'flex',
                  gap: 6
                }}>
                  <span className={`badge-tag ${m.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}
                        style={{
                          background: m.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          fontWeight: 700
                        }}>
                    {m.status === 'ACTIVE' ? '🟢 HOẠT ĐỘNG' : '🔴 TẠM DỪNG'}
                  </span>
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 10,
                  background: 'rgba(15, 23, 42, 0.85)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#94a3b8'
                }}>
                  ID #{m.marketId}
                </div>
              </div>

              {/* Title & Address */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px 0', color: '#f1f5f9' }}>
                  {m.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
                  <span>📍</span>
                  <span>{m.address}</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: 12, marginBottom: 10 }}>
                  <span>🗺️ Lat: <b>{Number(m.latitude).toFixed(4)}</b></span>
                  <span>Long: <b>{Number(m.longitude).toFixed(4)}</b></span>
                </div>

                {m.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                    {m.description.length > 110 ? m.description.substring(0, 110) + '...' : m.description}
                  </p>
                )}

                {/* Schedules */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                    LỊCH HỌP CHỢ ĐỊNH KỲ:
                  </div>
                  {m.schedules && m.schedules.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {m.schedules.map((s, idx) => (
                        <span key={idx} className="badge-tag" style={{ background: 'rgba(51, 65, 85, 0.8)', fontSize: '0.72rem' }}>
                          📅 {getDayName(s.dayOfWeek)} ({s.openTime ? s.openTime.substring(0, 5) : '06:00'} - {s.closeTime ? s.closeTime.substring(0, 5) : '12:00'})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Chưa thiết lập lịch</span>
                  )}
                </div>

                {/* Farmer Count Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    👨‍🌾 {m.activeFarmersCount || 0} Nông dân có sạp hoạt động
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                borderTop: '1px solid var(--card-border)',
                paddingTop: 12,
                marginTop: 'auto'
              }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEditModal(m)}>
                  ✏️ Chỉnh Sửa
                </button>

                <button
                  className={`btn btn-sm ${m.status === 'ACTIVE' ? 'btn-outline' : 'btn-primary'}`}
                  onClick={() => handleToggleStatus(m)}
                >
                  {m.status === 'ACTIVE' ? '⏸️ Tạm Dừng' : '▶️ Kích Hoạt'}
                </button>

                <button className="btn btn-outline btn-sm" onClick={() => openStallModal(m)}>
                  🏪 Quản Lý Sạp
                </button>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1, padding: '4px 6px', fontSize: '0.75rem' }}
                    onClick={() => handleSoftDelete(m)}
                    title="Xóa mềm (chuyển sang INACTIVE để bảo toàn dữ liệu)"
                  >
                    🗑️ Ẩn Chợ
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ background: '#450a0a', borderColor: '#b91c1c', padding: '4px 6px', fontSize: '0.75rem' }}
                    onClick={() => handlePermanentDelete(m)}
                    title="Xóa vĩnh viễn (Chỉ xóa được nếu chưa có đơn hàng)"
                  >
                    ❌ Xóa Hẳn
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MARKET MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 650, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-top">
              <div className="card-heading">
                {isEditing ? `✏️ Cập Nhật Chợ Nông Sản (ID #${currentMarketId})` : '➕ Tạo Mới Chợ Nông Sản'}
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowModal(false)}
                style={{ padding: '2px 8px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMarket}>
              <div className="form-item">
                <label>Tên Chợ Nông Sản (*):</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ví dụ: Chợ Phiên Nông Sản Ba Đình"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-item">
                <label>Địa Chỉ Thực Tế (*):</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ví dụ: Cung Thể Thao Quần Ngựa, Văn Cao, Liễu Giai, Ba Đình, Hà Nội"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-item">
                <label>Tọa Độ GPS (Vĩ độ Lat, Kinh độ Long):</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="number"
                    step="0.000001"
                    className="input-control"
                    placeholder="Latitude"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    step="0.000001"
                    className="input-control"
                    placeholder="Longitude"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    required
                  />
                </div>
                {/* Preset shortcuts */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gợi ý tọa độ:</span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => { setFormLat('21.038234'); setFormLng('105.817456'); }}
                  >
                    📍 Ba Đình (HN)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => { setFormLat('21.036882'); setFormLng('105.783115'); }}
                  >
                    📍 Cầu Giấy (HN)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => { setFormLat('10.776889'); setFormLng('106.700806'); }}
                  >
                    📍 Quận 1 (HCM)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setFormLat(pos.coords.latitude.toFixed(6));
                            setFormLng(pos.coords.longitude.toFixed(6));
                            alert('Đã lấy tọa độ thực từ thiết bị!');
                          },
                          (err) => alert('Không lấy được GPS: ' + err.message)
                        );
                      }
                    }}
                  >
                    🎯 GPS Thiết Bị
                  </button>
                </div>
              </div>

              <div className="form-item">
                <label>Mô Tả Chợ:</label>
                <textarea
                  className="input-control"
                  style={{ minHeight: 70 }}
                  placeholder="Mô tả phiên chợ, loại đặc sản bày bán..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <ImageUploadInput
                value={formImage}
                onChange={setFormImage}
                folder="markets"
                label="Ảnh Bìa Chợ Nông Sản:"
                helpText="Chọn ảnh chụp thực tế chợ từ máy tính hoặc điện thoại (hoặc nhập URL)"
              />

              <div className="form-item">
                <label>Trạng Thái Ban Đầu:</label>
                <select
                  className="input-control"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="ACTIVE">🟢 ACTIVE (Đang hoạt động)</option>
                  <option value="INACTIVE">🔴 INACTIVE (Tạm ngưng hoạt động)</option>
                </select>
              </div>

              {/* Schedules Builder */}
              <div style={{ marginTop: 16, marginBottom: 16, borderTop: '1px solid var(--card-border)', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#34d399' }}>
                    📅 Cấu Hình Lịch Họp Chợ Trong Tuần:
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={addScheduleRow}
                  >
                    ➕ Thêm Buổi Họp
                  </button>
                </div>

                {formSchedules.map((row, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <select
                      className="input-control"
                      style={{ flex: 1.2 }}
                      value={row.dayOfWeek}
                      onChange={(e) => updateScheduleRow(idx, 'dayOfWeek', e.target.value)}
                    >
                      <option value={1}>Thứ 2</option>
                      <option value={2}>Thứ 3</option>
                      <option value={3}>Thứ 4</option>
                      <option value={4}>Thứ 5</option>
                      <option value={5}>Thứ 6</option>
                      <option value={6}>Thứ 7</option>
                      <option value={7}>Chủ Nhật</option>
                    </select>

                    <input
                      type="time"
                      className="input-control"
                      style={{ flex: 1 }}
                      value={row.openTime}
                      onChange={(e) => updateScheduleRow(idx, 'openTime', e.target.value)}
                      required
                    />

                    <span style={{ color: 'var(--text-muted)' }}>đến</span>

                    <input
                      type="time"
                      className="input-control"
                      style={{ flex: 1 }}
                      value={row.closeTime}
                      onChange={(e) => updateScheduleRow(idx, 'closeTime', e.target.value)}
                      required
                    />

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeScheduleRow(idx)}
                      style={{ padding: '6px 10px' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Lưu Thay Đổi (PUT)' : 'Tạo Chợ (POST)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STALL ASSIGNMENT MANAGEMENT MODAL */}
      {showStallModal && selectedMarketForStalls && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 750, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-top">
              <div>
                <div className="card-heading">
                  🏪 Quản Lý Phân Sạp Nông Dân
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Chợ: <b>{selectedMarketForStalls.name}</b> (ID #{selectedMarketForStalls.marketId})
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowStallModal(false)}
                style={{ padding: '2px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Assign Form */}
            <form onSubmit={handleAssignFarmer} style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: 14,
              borderRadius: 8,
              border: '1px solid var(--card-border)',
              marginBottom: 18
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#38bdf8', marginBottom: 10 }}>
                ➕ Chỉ Định Nông Dân Vào Gian Hàng / Sạp Mới:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
                <input
                  type="number"
                  className="input-control"
                  placeholder="User ID Nông Dân"
                  value={assignFarmerId}
                  onChange={(e) => setAssignFarmerId(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="input-control"
                  placeholder="Mã số sạp (vd: Sạp A-08)"
                  value={assignStallNumber}
                  onChange={(e) => setAssignStallNumber(e.target.value)}
                  required
                />
                <select
                  className="input-control"
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value)}
                >
                  <option value="ACTIVE">ACTIVE (Hoạt động)</option>
                  <option value="REGISTERED">REGISTERED (Chờ duyệt)</option>
                  <option value="REVOKED">REVOKED (Thu hồi)</option>
                </select>
                <button type="submit" className="btn btn-primary">
                  Gán Sạp
                </button>
              </div>
            </form>

            {/* List of current assignments */}
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>
              📋 Danh Sách Sạp Đã Phân Bổ ({marketAssignments.length}):
            </div>

            {stallLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                Đang tải danh sách sạp...
              </div>
            ) : marketAssignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Chưa có nông dân nào được phân sạp tại chợ này.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {marketAssignments.map((a) => (
                  <div
                    key={a.assignmentId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      flexWrap: 'wrap',
                      gap: 8
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>
                          🎪 {a.stallNumber || 'Chưa đặt số sạp'}
                        </span>
                        <span className="badge-tag" style={{
                          background: a.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: a.status === 'ACTIVE' ? '#34d399' : '#f87171',
                          fontSize: '0.72rem'
                        }}>
                          {a.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
                        👨‍🌾 {a.farmerName || 'Nông dân'} (ID: #{a.farmerId}) • SĐT: {a.phoneNumber || 'N/A'} • Gian hàng: {a.stallName || 'Chưa đặt tên'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {a.status !== 'ACTIVE' ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUpdateStallStatus(a.assignmentId, 'ACTIVE')}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          ✅ Duyệt Sạp
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUpdateStallStatus(a.assignmentId, 'REVOKED')}
                          style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#fca5a5' }}
                        >
                          ⛔ Thu Hồi
                        </button>
                      )}

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteStall(a.assignmentId, a.stallNumber)}
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setShowStallModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
