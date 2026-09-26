import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';

export default function OpenStreetMapRouting({ 
  token, 
  callApi, 
  targetMarketId, 
  targetMarket, 
  onSelectMarketProducts 
}) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const userMarkerRef = useRef(null);
  const marketMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  // Vị trí mặc định của khách hàng (Đống Đa, Hà Nội)
  const [userPos, setUserPos] = useState({ lat: 21.0185, lon: 105.8290, label: 'Đống Đa, Hà Nội' });
  const [selectedMarketId, setSelectedMarketId] = useState(
    targetMarketId || targetMarket?.id || targetMarket?.marketId || ''
  );
  const [markets, setMarkets] = useState([
    {
      marketId: 101,
      id: 101,
      name: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      address: '12 Núi Trúc, Ba Đình, Hà Nội',
      latitude: 21.0312,
      longitude: 105.8189
    },
    {
      marketId: 103,
      id: 103,
      name: 'Phiên Chợ Hữu Cơ Thảo Điền EcoMarket',
      address: '28 Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
      latitude: 10.8032,
      longitude: 106.7328
    },
    {
      marketId: 104,
      id: 104,
      name: 'Hội Chợ Nông Sản Vùng Miền Tây Hồ',
      address: '614 Lạc Long Quân, Q. Tây Hồ, Hà Nội',
      latitude: 21.0601,
      longitude: 105.8182
    },
    {
      marketId: 105,
      id: 105,
      name: 'Chợ Phiên Nông Nghiệp Xanh Ecopark',
      address: 'Công viên Mùa Hạ, KĐT Ecopark, Hưng Yên',
      latitude: 20.9634,
      longitude: 105.9321
    }
  ]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geofenceAlert, setGeofenceAlert] = useState(null);
  const [farmerAlert, setFarmerAlert] = useState(null);

  const safeCallApi = async (url, method = 'GET', body = null) => {
    if (callApi && typeof callApi === 'function') {
      try {
        return await callApi(url, method, body);
      } catch (err) {
        console.warn('callApi error:', err);
      }
    }
    try {
      const activeToken = token || localStorage.getItem('ml_token') || localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;
      const opts = { method, headers };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      if (!res.ok) return { status: res.status, data: null };
      const data = await res.json();
      return { status: res.status, data };
    } catch (err) {
      return { status: 500, error: err };
    }
  };

  // 1. Tải danh sách chợ khi mở tab
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const res = await safeCallApi('/api/markets', 'GET');
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map(m => ({
            ...m,
            marketId: m.marketId || m.id,
            id: m.marketId || m.id
          }));
          setMarkets(formatted);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách chợ:', err);
      }
    };
    loadMarkets();
  }, []);

  // 2. Khởi tạo bản đồ Leaflet OpenStreetMap
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      // Tọa độ trung tâm Hà Nội
      const map = L.map(mapRef.current).setView([21.0312, 105.8189], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      leafletMap.current = map;
    }

    // Tự động tính đường ban đầu
    fetchRoute(userPos.lat, userPos.lon, selectedMarketId);

    return () => {
      // Cleanup map on unmount
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // 3. Hàm tính toán lộ trình ngắn nhất (Backend OSRM + Fallback Client-Side)
  const fetchRoute = async (lat, lon, marketId = '') => {
    setLoading(true);
    setGeofenceAlert(null);
    setFarmerAlert(null);

    try {
      let url = `/api/markets/nearest-and-route?latitude=${lat}&longitude=${lon}`;
      if (marketId) url += `&marketId=${marketId}`;

      const res = await safeCallApi(url, 'GET');
      let data = res.data?.data || res.data;

      // Nếu backend chưa restart (trả về 404), fallback tính toán trực tiếp từ OpenStreetMap OSRM trên client
      if (res.status === 404 || !data?.routeGeometry) {
        data = await calculateClientSideRoute(lat, lon, marketId);
      }

      setRouteInfo(data);
      updateMapDisplay(lat, lon, data);

      // Kiểm tra vùng Geofencing 300m
      if (data.inGeofence || (data.distanceKilometers !== undefined && data.distanceKilometers <= 0.35)) {
        triggerGeofenceCheckIn(lat, lon, data.marketId, data.marketName);
      }
    } catch (err) {
      console.error('Lỗi tính đường:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán dự phòng qua OSRM trực tiếp trên trình duyệt nếu backend chưa có endpoint
  const calculateClientSideRoute = async (userLat, userLon, targetMId) => {
    let target = null;
    if (targetMId && markets.length > 0) {
      target = markets.find(m => m.marketId === Number(targetMId));
    }
    if (!target && markets.length > 0) {
      // Tìm chợ gần nhất bằng Haversine
      target = markets.reduce((prev, curr) => {
        const d1 = getHaversineMeters(userLat, userLon, prev.latitude, prev.longitude);
        const d2 = getHaversineMeters(userLat, userLon, curr.latitude, curr.longitude);
        return d1 < d2 ? prev : curr;
      });
    }

    if (!target) {
      target = {
        marketId: 101,
        name: 'Phiên Chợ Xanh Nông Sản Ba Đình',
        address: '12 Núi Trúc, Ba Đình, Hà Nội',
        latitude: 21.0312,
        longitude: 105.8189
      };
    }

    const mLat = Number(target.latitude);
    const mLon = Number(target.longitude);

    try {
      const osrmRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${mLon},${mLat}?overview=full&geometries=geojson&steps=true`
      );
      const osrmData = await osrmRes.json();
      if (osrmData.routes && osrmData.routes.length > 0) {
        const route = osrmData.routes[0];
        const distKm = Math.round((route.distance / 1000) * 10) / 10;
        const mins = Math.ceil(route.duration / 60);
        const coords = route.geometry.coordinates.map(pt => [pt[1], pt[0]]);
        const steps = (route.legs[0]?.steps || []).map(s => `Đi ${s.name ? `vào ${s.name}` : 'tiếp tục'} (${Math.round(s.distance)} m)`).filter(Boolean);

        return {
          marketId: target.marketId,
          marketName: target.name,
          marketAddress: target.address,
          marketLatitude: mLat,
          marketLongitude: mLon,
          distanceKilometers: distKm,
          estimatedMinutes: mins,
          routeGeometry: coords,
          navigationSteps: steps,
          inGeofence: distKm <= 0.3,
          googleMapsNavUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${mLat},${mLon}`
        };
      }
    } catch {
      // Fallback thẳng
    }

    const distMeters = getHaversineMeters(userLat, userLon, mLat, mLon);
    const km = Math.round((distMeters / 1000) * 10) / 10;
    return {
      marketId: target.marketId,
      marketName: target.name,
      marketAddress: target.address,
      marketLatitude: mLat,
      marketLongitude: mLon,
      distanceKilometers: km,
      estimatedMinutes: Math.ceil(km * 2.5),
      routeGeometry: [[userLat, userLon], [mLat, mLon]],
      navigationSteps: [`Đi thẳng theo trục đường tới ${target.name}`, `Đến cổng chợ tại ${target.address}`],
      inGeofence: distMeters <= 300,
      googleMapsNavUrl: `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${mLat},${mLon}`
    };
  };

  const getHaversineMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 4. Vẽ Marker và Polyline lên OpenStreetMap
  const updateMapDisplay = (userLat, userLon, route) => {
    const map = leafletMap.current;
    if (!map) return;

    // Icon Khách hàng (📍)
    const userIcon = L.divIcon({
      className: 'user-pin-marker',
      html: '<div style="background:#0284c7;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 0 14px rgba(2,132,199,0.8);">📍</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    // Icon Chợ Nông Sản (🥬)
    const marketIcon = L.divIcon({
      className: 'market-pin-marker',
      html: '<div style="background:#059669;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 0 16px rgba(5,150,105,0.9);">🥬</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    // 1. Cập nhật User Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLat, userLon]);
    } else {
      userMarkerRef.current = L.marker([userLat, userLon], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Vị trí của bạn</b><br>Đang tìm đường ngắn nhất...');
    }

    // 2. Cập nhật Market Marker
    if (route?.marketLatitude && route?.marketLongitude) {
      const mLat = route.marketLatitude;
      const mLon = route.marketLongitude;

      if (marketMarkerRef.current) {
        marketMarkerRef.current.setLatLng([mLat, mLon]);
        marketMarkerRef.current.setPopupContent(`<b>${route.marketName}</b><br>${route.marketAddress}`);
      } else {
        marketMarkerRef.current = L.marker([mLat, mLon], { icon: marketIcon })
          .addTo(map)
          .bindPopup(`<b>${route.marketName}</b><br>${route.marketAddress}`);
      }

      // 3. Vẽ Polyline đường đi uốn lượn
      if (route.routeGeometry && route.routeGeometry.length > 0) {
        if (polylineRef.current) {
          polylineRef.current.setLatLngs(route.routeGeometry);
        } else {
          polylineRef.current = L.polyline(route.routeGeometry, {
            color: '#10b981',
            weight: 5,
            opacity: 0.9,
            lineJoin: 'round'
          }).addTo(map);
        }

        // Tự động căn chỉnh góc nhìn bản đồ bao quát toàn bộ tuyến đường
        const bounds = L.latLngBounds([
          [userLat, userLon],
          [mLat, mLon],
          ...route.routeGeometry
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  // 5. Kích hoạt thông báo Geofencing khi vào vùng 300m
  const triggerGeofenceCheckIn = async (lat, lon, marketId, marketName) => {
    setGeofenceAlert({
      title: '📍 Chào mừng bạn đã đến phiên chợ!',
      message: `Bạn đang ở trong bán kính 300m quanh ${marketName}. Đơn hàng đặt trước của bạn đã sẵn sàng nhận tại sạp!`,
      marketName
    });

    // Giả lập chuông báo tới máy Nông dân
    setFarmerAlert({
      farmerName: 'Bác Ba Nông Dân (Sạp 05)',
      msg: `🔔 Thông báo tới Nông Dân: Khách hàng đang tiến vào cổng chợ! Hãy chuẩn bị sẵn giỏ rau củ số #ORD-2026.`
    });

    // Gửi check-in lên máy chủ nếu có token
    try {
      await safeCallApi('/api/customer/geofence/check-in', 'POST', {
        latitude: lat,
        longitude: lon,
        targetMarketId: marketId
      });
    } catch {
      // Ignored
    }
  };

  // 6. Xử lý các nút Giả lập kịch bản GPS
  const handleSimulate = (lat, lon, label) => {
    setUserPos({ lat, lon, label });
    fetchRoute(lat, lon, selectedMarketId);
  };

  // Lấy GPS thực từ thiết bị
  const handleGetRealGps = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ Geolocation GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lon: longitude, label: 'Toạ độ GPS thực tế' });
        fetchRoute(latitude, longitude, selectedMarketId);
      },
      (err) => alert('Không lấy được toạ độ GPS: ' + err.message)
    );
  };

  return (
    <div className="grid-cols-2">
      {/* CỘT TRÁI: Bản đồ OpenStreetMap Leaflet */}
      <div className="card">
        <div className="card-top">
          <div className="card-heading">
            🗺️ Bản Đồ OpenStreetMap Trực Tuyến
            <span className="live-badge" style={{ background: '#10b981' }}>
              <span className="live-pulse"></span>
              OSRM Engine Active
            </span>
          </div>
          <span className="badge-tag">Free & Open Source</span>
        </div>

        {/* Khung bản đồ Leaflet */}
        <div ref={mapRef} id="osm-map-container" className="map-view-box"></div>

        {/* Bộ chọn Chợ mục tiêu */}
        <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#aaa', minWidth: 90 }}>Đích đến:</span>
          <select
            className="input-control"
            value={selectedMarketId}
            onChange={(e) => {
              setSelectedMarketId(e.target.value);
              fetchRoute(userPos.lat, userPos.lon, e.target.value);
            }}
          >
            <option value="">🎯 Tự động tìm chợ gần tôi nhất (Haversine)</option>
            {markets.map((m) => (
              <option key={m.marketId} value={m.marketId}>
                {m.name} ({m.address?.split(',')[1] || m.address})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CỘT PHẢI: Bảng điều khiển lộ trình & Mô phỏng Geofencing */}
      <div className="card">
        <div className="card-top">
          <div className="card-heading">🧭 Lộ Trình & Định Vị Geofencing (300m)</div>
          <span className="badge-tag">O2O Smart Navigation</span>
        </div>

        {/* Banner Geofencing khi bước vào vùng 300m */}
        {geofenceAlert && (
          <div className="geofence-banner">
            <div className="geofence-icon">🔔</div>
            <div>
              <div className="geofence-title">{geofenceAlert.title}</div>
              <div className="geofence-desc">{geofenceAlert.message}</div>
            </div>
          </div>
        )}

        {/* Chuông báo tới sạp Nông dân */}
        {farmerAlert && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #f59e0b',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 13,
              color: '#fde68a'
            }}
          >
            <b>👨‍🌾 Góc nhìn Nông Dân:</b> {farmerAlert.msg}
          </div>
        )}

        {/* Nút giả lập kịch bản toạ độ GPS */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
            📍 MÔ PHỎNG VỊ TRÍ KHÁCH HÀNG (DEMO CHẤM THI TECHWIZ):
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn ${userPos.label.includes('Đống Đa') ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => handleSimulate(21.0185, 105.8290, 'Đống Đa (Cách chợ 3.2km)')}
            >
              🏠 1. Tại nhà (3.2 km)
            </button>

            <button
              className={`btn ${userPos.label.includes('Kim Mã') ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => handleSimulate(21.0310, 105.8115, 'Kim Mã (Cách chợ 750m)')}
            >
              🛵 2. Đang đi (750m)
            </button>

            <button
              className={`btn ${userPos.label.includes('Cổng Chợ') ? 'btn-primary' : 'btn-outline'}`}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                borderColor: '#10b981',
                color: userPos.label.includes('Cổng Chợ') ? '#fff' : '#34d399'
              }}
              onClick={() => handleSimulate(21.0318, 105.8185, 'Cổng Chợ Ba Đình (120m) ➜ GEOFENCE!')}
            >
              🎯 3. Cổng Chợ (120m) - Bật Alert!
            </button>

            <button
              className="btn btn-outline"
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={handleGetRealGps}
            >
              📡 GPS Thực Tế
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Vị trí hiện tại: <b>{userPos.label}</b> ({userPos.lat.toFixed(4)}, {userPos.lon.toFixed(4)})
          </div>
        </div>

        {/* Thông số quãng đường & thời gian */}
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#38bdf8' }}>
            ⏳ Đang giải thuật tìm đoạn đường ngắn nhất qua OpenStreetMap...
          </div>
        ) : routeInfo ? (
          <div>
            <div className="route-stat-grid">
              <div className="route-stat-item">
                <div className="route-stat-label">Chợ Đón Tiếp</div>
                <div className="route-stat-val" style={{ fontSize: '0.95rem', color: '#10b981' }}>
                  {routeInfo.marketName?.split(' ')[1] || 'Ba Đình'}
                </div>
              </div>
              <div className="route-stat-item">
                <div className="route-stat-label">Quãng Đường</div>
                <div className="route-stat-val">{routeInfo.distanceKilometers} km</div>
              </div>
              <div className="route-stat-item">
                <div className="route-stat-label">Thời Gian Dự Kiến</div>
                <div className="route-stat-val" style={{ color: '#f59e0b' }}>
                  ~{routeInfo.estimatedMinutes} phút
                </div>
              </div>
              <div className="route-stat-item">
                <div className="route-stat-label">Geofence 300m</div>
                <div
                  className="route-stat-val"
                  style={{ fontSize: '0.9rem', color: routeInfo.inGeofence ? '#10b981' : '#ef4444' }}
                >
                  {routeInfo.inGeofence ? '✅ ĐÃ VÀO VÙNG' : '❌ NGOÀI VÙNG'}
                </div>
              </div>
            </div>

            {/* Chi tiết chợ */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>🎯 {routeInfo.marketName}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>📍 {routeInfo.marketAddress}</div>
            </div>

            {/* Chỉ dẫn rẽ từng chặng (Turn-by-turn) */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                🚦 Hướng dẫn lộ trình chi tiết:
              </div>
              <ol className="steps-list">
                {routeInfo.navigationSteps?.slice(0, 5).map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Nút chuyển tiếp Google Maps & Xem sản phẩm sạp */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              {routeInfo.googleMapsNavUrl && (
                <a
                  href={routeInfo.googleMapsNavUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: 'none',
                    borderColor: '#38bdf8',
                    color: '#38bdf8'
                  }}
                >
                  🧭 Mở Google Maps Dẫn Đường
                </a>
              )}
              {onSelectMarketProducts && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#059669',
                    borderColor: '#059669',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const currentM = markets.find(m => m.marketId === Number(routeInfo.marketId)) || {
                      id: routeInfo.marketId,
                      name: routeInfo.marketName,
                      address: routeInfo.marketAddress
                    };
                    onSelectMarketProducts(currentM);
                  }}
                >
                  🧺 Xem sản phẩm sạp tại chợ này →
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
