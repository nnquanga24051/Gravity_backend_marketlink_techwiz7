import React, { useState, useEffect, useRef } from 'react';
import './MarketDetailModal.css';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import L from 'leaflet';
import { notificationService, playNotificationChime } from '../../services/notificationService';

export default function MarketDetailModal({
  isOpen,
  onClose,
  market,
  onViewStalls,
  initialTab = 'schedule'
}) {
  if (!market) return null;

  const [activeTab, setActiveTab] = useState(initialTab);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const polylineRef = useRef(null);
  const userMarkerRef = useRef(null);
  const marketMarkerRef = useRef(null);

  const {
    id,
    marketId,
    name,
    address,
    city = 'Hà Nội',
    distance = '1.2 km',
    operatingDays = 'Thứ 7 & Chủ Nhật',
    operatingHours = '06:00 - 11:30',
    stallsCount = 16,
    description = 'Chợ phiên nông sản sạch quy tụ các hợp tác xã và nông hộ từ vùng Ba Vì, Mộc Châu, Đà Lạt. Toàn bộ rau củ thu hoạch trong bán kính 60km, đảm bảo độ tươi ngon nhất.',
    imageUrl = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=700&q=80',
    amenities = ['Bãi giữ xe miễn phí', 'Điểm nhận hàng nhanh', 'Thùng rác hữu cơ', 'Sạp kiểm định chất lượng', 'Thanh toán VietQR'],
    latitude = 21.0312,
    longitude = 105.8189
  } = market;

  const mLat = Number(market.latitude || latitude || 21.0312);
  const mLon = Number(market.longitude || longitude || 105.8189);

  // User location for navigation
  const [userPos, setUserPos] = useState({
    lat: 21.0185,
    lon: 105.8290,
    label: 'Đống Đa, Hà Nội'
  });
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [geofenceTriggered, setGeofenceTriggered] = useState(false);
  const [farmerAlertMsg, setFarmerAlertMsg] = useState(null);

  // Haversine formula for distance in km
  const getHaversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  };

  // Calculate route using OSRM
  const calculateRoute = async (uLat, uLon) => {
    setLoadingRoute(true);
    setGeofenceTriggered(false);
    setFarmerAlertMsg(null);

    const distKm = getHaversineKm(uLat, uLon, mLat, mLon);
    const estMins = Math.max(3, Math.ceil(distKm * 2.5));

    try {
      const osrmRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${uLon},${uLat};${mLon},${mLat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await osrmRes.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const osrmDist = Math.round((route.distance / 1000) * 10) / 10;
        const osrmMins = Math.ceil(route.duration / 60);
        const coords = route.geometry.coordinates.map(pt => [pt[1], pt[0]]);
        const steps = (route.legs[0]?.steps || [])
          .map(s => `Đi ${s.name ? `vào ${s.name}` : 'tiếp tục'} (${Math.round(s.distance)} m)`)
          .filter(Boolean);

        setRouteData({
          distanceKm: osrmDist,
          minutes: osrmMins,
          coords,
          steps,
          inGeofence: osrmDist <= 0.35,
          googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${uLat},${uLon}&destination=${mLat},${mLon}`
        });

        if (osrmDist <= 0.35) {
          setGeofenceTriggered(true);
          setFarmerAlertMsg(`🔔 Chuông báo Nông Dân: Khách hàng đang ở cổng chợ! Đang chuẩn bị giỏ rau củ.`);
          playNotificationChime();
          try {
            notificationService.showBrowserNotification(`📍 Chào mừng đến ${name}!`, {
              body: `Bạn đang ở trong phạm vi 300m quanh chợ. Đơn hàng đã sẵn sàng nhận tại quầy!`,
              tag: `geofence-${market?.marketId || market?.id || 'm'}`
            });
          } catch {}
        }
        return;
      }
    } catch (err) {
      console.warn('OSRM routing fallback to direct line:', err);
    }

    // Direct line fallback
    setRouteData({
      distanceKm: distKm,
      minutes: estMins,
      coords: [[uLat, uLon], [mLat, mLon]],
      steps: [`Đi thẳng theo trục đường chính tới ${name}`, `Đến cổng chợ tại ${address}`],
      inGeofence: distKm <= 0.35,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${uLat},${uLon}&destination=${mLat},${mLon}`
    });

    if (distKm <= 0.35) {
      setGeofenceTriggered(true);
      setFarmerAlertMsg(`🔔 Chuông báo Nông Dân: Khách hàng đang ở cổng chợ! Đang chuẩn bị giỏ rau củ.`);
      playNotificationChime();
      try {
        notificationService.showBrowserNotification(`📍 Chào mừng đến ${name}!`, {
          body: `Bạn đang ở trong phạm vi 300m quanh chợ. Đơn hàng đã sẵn sàng nhận tại quầy!`,
          tag: `geofence-${market?.marketId || market?.id || 'm'}`
        });
      } catch {}
    }
    setLoadingRoute(false);
  };

  // Initialize Leaflet map when map tab is opened
  useEffect(() => {
    if (!isOpen || activeTab !== 'map' || !mapRef.current) return;

    let timer = setTimeout(() => {
      if (!leafletMap.current && mapRef.current) {
        const map = L.map(mapRef.current).setView([mLat, mLon], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        leafletMap.current = map;
      }

      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
        // Mặc định tự động dò GPS thực tế
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude: uLat, longitude: uLon } = pos.coords;
              setUserPos({ lat: uLat, lon: uLon, label: '📍 Vị trí GPS của tôi' });
              calculateRoute(uLat, uLon);
            },
            () => {
              calculateRoute(userPos.lat, userPos.lon);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
          );
        } else {
          calculateRoute(userPos.lat, userPos.lon);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, activeTab, mLat, mLon]);

  // Update markers and polyline when routeData changes
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !routeData) return;

    // Market Marker (Green 🎪)
    const marketIcon = L.divIcon({
      className: 'ml-map-pin-market',
      html: '<div style="background:#059669;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 3px 12px rgba(5,150,105,0.7);cursor:pointer;">🎪</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    // User Marker (Blue 📍)
    const userIcon = L.divIcon({
      className: 'ml-map-pin-user',
      html: '<div style="background:#0284c7;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 3px 12px rgba(2,132,199,0.7);cursor:pointer;">📍</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    if (marketMarkerRef.current) {
      marketMarkerRef.current.setLatLng([mLat, mLon]);
    } else {
      marketMarkerRef.current = L.marker([mLat, mLon], { icon: marketIcon })
        .addTo(map)
        .bindPopup(`<b>${name}</b><br>${address}<br><span style="color:#059669;font-weight:600;">🕒 ${operatingDays} (${operatingHours})</span>`);
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPos.lat, userPos.lon]);
    } else {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>Vị trí của bạn:</b><br>${userPos.label}`);
    }

    if (routeData.coords && routeData.coords.length > 0) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(routeData.coords);
      } else {
        polylineRef.current = L.polyline(routeData.coords, {
          color: '#10b981',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(map);
      }

      const bounds = L.latLngBounds([
        [userPos.lat, userPos.lon],
        [mLat, mLon],
        ...routeData.coords
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [routeData, mLat, mLon, name, address, operatingDays, operatingHours, userPos]);

  // Clean up Leaflet on modal close
  useEffect(() => {
    if (!isOpen && leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
      userMarkerRef.current = null;
      marketMarkerRef.current = null;
      polylineRef.current = null;
    }
  }, [isOpen]);

  const handleGetRealGps = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ Geolocation GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: uLat, longitude: uLon } = pos.coords;
        setUserPos({ lat: uLat, lon: uLon, label: 'Toạ độ GPS của tôi' });
        calculateRoute(uLat, uLon);
      },
      (err) => alert('Không lấy được toạ độ GPS: ' + err.message)
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={name}
      subtitle={`📍 ${address}, ${city}`}
      maxWidth="780px"
    >
      <div className="ml-market-detail-content">
        {/* Navigation Tabs: Lịch họp vs Bản đồ */}
        <div className="ml-modal-tab-nav">
          <button
            type="button"
            className={`ml-modal-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            📅 Lịch Hoạt Động & Hướng Dẫn
          </button>
          <button
            type="button"
            className={`ml-modal-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            🗺️ Bản Đồ & Chỉ Đường GPS
          </button>
        </div>

        {/* ========================================================
            TAB 1: LỊCH HỌP & HƯỚNG DẪN NHẬN HÀNG
            ======================================================== */}
        {activeTab === 'schedule' && (
          <div className="ml-modal-tab-content">
            <div className="ml-detail-banner">
              <img src={imageUrl} alt={name} className="ml-detail-img" />
              <div className="ml-detail-pills">
                <Badge variant="organic" size="sm">📍 Khoảng cách: {distance}</Badge>
                <Badge variant="ready" size="sm">✓ Đang mở nhận đặt trước</Badge>
              </div>
            </div>

            {/* Thẻ Lịch họp & Khung giờ */}
            <div className="ml-detail-schedule-card">
              <div className="ml-sched-item">
                <span className="ml-sched-icon">📅</span>
                <div>
                  <div className="ml-sched-label">Lịch họp định kỳ:</div>
                  <div className="ml-sched-val"><strong>{operatingDays}</strong></div>
                </div>
              </div>
              <div className="ml-sched-item">
                <span className="ml-sched-icon">⏰</span>
                <div>
                  <div className="ml-sched-label">Khung giờ đón khách:</div>
                  <div className="ml-sched-val"><strong>{operatingHours}</strong></div>
                </div>
              </div>
            </div>

            {/* Phiên chợ sắp tới & Hạn chốt đơn */}
            <div className="ml-session-card">
              <div className="ml-session-header">
                <span className="ml-session-icon">⚡</span>
                <div>
                  <h4 className="ml-session-title">Phiên Chợ Sắp Diễn Ra: Cuối Tuần Này</h4>
                  <p className="ml-session-desc">
                    Nông dân thu hoạch rau củ vào 4:30 - 5:00 sáng và chở thẳng đến sạp.
                  </p>
                </div>
              </div>
              <div className="ml-cutoff-notice">
                <span className="ml-cutoff-badge">⏳ Hạn chót đặt trước (Cut-off):</span>
                <span><strong>20:00 tối Thứ Sáu</strong> — Sau giờ này sạp sẽ đóng đơn để tập trung thu hái theo số lượng.</span>
              </div>
            </div>

            {/* Giới thiệu chợ phiên */}
            <div className="ml-detail-section">
              <h4 className="ml-detail-heading">Giới thiệu phiên chợ</h4>
              <p className="ml-detail-text">{description}</p>
            </div>

            {/* Quy trình nhận hàng nhanh O2O */}
            <div className="ml-detail-section">
              <h4 className="ml-detail-heading">3 Bước nhận nông sản nhanh tại chợ</h4>
              <div className="ml-steps-grid">
                <div className="ml-step-card">
                  <div className="ml-step-num">1</div>
                  <div className="ml-step-info">
                    <strong>Đặt trước online</strong>
                    <span>Chọn rau quả và chọn giờ hẹn ra chợ.</span>
                  </div>
                </div>
                <div className="ml-step-card">
                  <div className="ml-step-num">2</div>
                  <div className="ml-step-info">
                    <strong>Đến chợ (Geofence 300m)</strong>
                    <span>Hệ thống rung chuông để sạp soạn sẵn giỏ hàng.</span>
                  </div>
                </div>
                <div className="ml-step-card">
                  <div className="ml-step-num">3</div>
                  <div className="ml-step-info">
                    <strong>Đọc mã nhận hàng</strong>
                    <span>Đến bàn Express hoặc sạp lấy hàng ngay không chờ đợi.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tiện ích chợ */}
            <div className="ml-detail-section">
              <h4 className="ml-detail-heading">Tiện ích hỗ trợ khách lấy hàng</h4>
              <div className="ml-amenities-grid">
                {amenities.map((item, idx) => (
                  <span key={idx} className="ml-amenity-chip">✓ {item}</span>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="ml-detail-footer">
              <div className="ml-detail-stall-note">
                🎪 Hiện có <strong>{stallsCount} gian hàng nông dân</strong> đã đăng ký sản phẩm sẵn sàng phục vụ.
              </div>
              <div className="ml-modal-actions-row">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => setActiveTab('map')}
                  icon={<span>🗺️</span>}
                >
                  Xem bản đồ & chỉ đường
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    onClose();
                    if (onViewStalls) onViewStalls(market);
                  }}
                  icon={<span>🧺</span>}
                >
                  Xem sản phẩm sạp tại chợ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: BẢN ĐỒ TƯƠNG TÁC & CHỈ ĐƯỜNG GPS
            ======================================================== */}
        {activeTab === 'map' && (
          <div className="ml-modal-tab-content">
            <div className="ml-map-top-bar">
              <div className="ml-map-target-info">
                <span className="ml-map-target-icon">🎪</span>
                <div>
                  <strong>{name}</strong>
                  <div className="ml-map-target-addr">📍 {address}</div>
                </div>
              </div>
              <Badge variant="organic" size="sm">OSRM Live Engine</Badge>
            </div>

            {/* Khung bản đồ Leaflet */}
            <div className="ml-leaflet-container-wrap">
              <div ref={mapRef} id="ml-modal-leaflet-map" className="ml-modal-map-view"></div>
            </div>

            {/* Thông số lộ trình */}
            {loadingRoute ? (
              <div className="ml-route-loading">
                ⏳ Đang tính toán đường đi ngắn nhất qua OpenStreetMap...
              </div>
            ) : routeData ? (
              <div className="ml-route-stats-container">
                <div className="ml-route-stat-box">
                  <span className="ml-route-stat-label">Khoảng cách</span>
                  <span className="ml-route-stat-num">{routeData.distanceKm} km</span>
                </div>
                <div className="ml-route-stat-box">
                  <span className="ml-route-stat-label">Thời gian xe máy</span>
                  <span className="ml-route-stat-num highlight">~{routeData.minutes} phút</span>
                </div>
                <div className="ml-route-stat-box">
                  <span className="ml-route-stat-label">Bán kính 300m</span>
                  <span className={`ml-route-stat-num ${routeData.inGeofence ? 'in' : 'out'}`}>
                    {routeData.inGeofence ? '✅ ĐÃ ĐẾN VÙNG' : '📍 NGOÀI VÙNG'}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Alert Geofencing khi đến gần */}
            {geofenceTriggered && (
              <div className="ml-geofence-alert-box">
                <span className="ml-geofence-bell">🔔</span>
                <div>
                  <div className="ml-geofence-title">Chào mừng bạn đã đến gần {name}!</div>
                  <div className="ml-geofence-desc">
                    Bạn đang ở trong bán kính 300m. Nông dân tại các sạp đã nhận được tín hiệu chuẩn bị túi hàng tươi cho bạn!
                  </div>
                </div>
              </div>
            )}

            {/* Nông dân alert preview */}
            {farmerAlertMsg && (
              <div className="ml-farmer-alert-preview">
                👨‍🌾 <strong>Phía Nông Dân:</strong> {farmerAlertMsg}
              </div>
            )}

            {/* Vị trí GPS hiện tại */}
            <div className="ml-current-pos-section" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--bg-secondary, #f8fafc)',
              borderRadius: 8,
              margin: '12px 0',
              border: '1px solid var(--border-color, #e2e8f0)',
              fontSize: 13
            }}>
              <div>
                📍 Vị trí GPS của bạn: <strong>{userPos.label}</strong> ({userPos.lat.toFixed(4)}, {userPos.lon.toFixed(4)})
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
                onClick={handleGetRealGps}
              >
                📡 Dò lại GPS
              </button>
            </div>

            {/* Lộ trình từng bước */}
            {routeData?.steps && routeData.steps.length > 0 && (
              <div className="ml-route-steps-section">
                <div className="ml-steps-heading">🚦 Hướng dẫn lộ trình:</div>
                <ol className="ml-steps-list">
                  {routeData.steps.slice(0, 4).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="ml-map-modal-footer">
              {routeData?.googleMapsUrl && (
                <a
                  href={routeData.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-btn-gmaps"
                >
                  🧭 Mở Google Maps Dẫn Đường
                </a>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  if (onViewStalls) onViewStalls(market);
                }}
                icon={<span>🧺</span>}
              >
                Xem sản phẩm sạp tại chợ
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
