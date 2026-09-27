import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { notificationService, playNotificationChime } from '../services/notificationService';

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
  const geofenceCircleRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastAlertRef = useRef({ marketId: null, timestamp: 0 });

  // Vị trí người dùng (Mặc định khởi động bằng GPS thực tế)
  const [userPos, setUserPos] = useState({ lat: 21.0185, lon: 105.8290, label: 'Đang dò GPS thực tế...' });
  const [gpsStatus, setGpsStatus] = useState({ loading: true, active: false, accuracy: null, error: null });
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

  // Yêu cầu và theo dõi GPS thực tế của thiết bị
  const requestRealGps = (isInitial = false) => {
    if (!navigator.geolocation) {
      setGpsStatus({ loading: false, active: false, accuracy: null, error: 'Trình duyệt không hỗ trợ Geolocation GPS' });
      setUserPos(prev => ({ ...prev, label: 'Đống Đa, Hà Nội (Không hỗ trợ GPS)' }));
      fetchRoute(21.0185, 105.8290, selectedMarketId);
      return;
    }

    setGpsStatus(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const realPos = {
          lat: latitude,
          lon: longitude,
          label: `📍 GPS Thực Tế (±${Math.round(accuracy)}m)`,
          accuracy: Math.round(accuracy)
        };
        setUserPos(realPos);
        setGpsStatus({ loading: false, active: true, accuracy: Math.round(accuracy), error: null });

        if (leafletMap.current) {
          leafletMap.current.setView([latitude, longitude], 14);
        }

        fetchRoute(latitude, longitude, selectedMarketId);
        startLiveGpsWatcher();
      },
      (err) => {
        console.warn('Không lấy được toạ độ GPS:', err.message);
        setGpsStatus({ loading: false, active: false, accuracy: null, error: err.message });
        setUserPos({ lat: 21.0185, lon: 105.8290, label: 'Đống Đa, Hà Nội (Chưa cấp quyền GPS)' });
        fetchRoute(21.0185, 105.8290, selectedMarketId);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const startLiveGpsWatcher = () => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserPos(prev => {
          const movedMeters = getHaversineMeters(prev.lat, prev.lon, latitude, longitude);
          if (movedMeters > 8) {
            fetchRoute(latitude, longitude, selectedMarketId);
            return {
              lat: latitude,
              lon: longitude,
              label: `📍 GPS Thực Tế (±${Math.round(accuracy)}m)`,
              accuracy: Math.round(accuracy)
            };
          }
          return prev;
        });
      },
      (err) => console.debug('watchPosition status:', err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // 2. Khởi tạo bản đồ Leaflet OpenStreetMap
  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMap.current) {
      // Tọa độ trung tâm ban đầu
      const map = L.map(mapRef.current).setView([21.0312, 105.8189], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      leafletMap.current = map;
    }

    // MẶC ĐỊNH: Tự động xin quyền và lấy tọa độ GPS thực tế của thiết bị ngay khi mở
    requestRealGps(true);

    return () => {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
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

        // 3. Vòng tròn Geofencing bán kính 300m quanh chợ
        if (geofenceCircleRef.current) {
          geofenceCircleRef.current.setLatLng([mLat, mLon]);
          geofenceCircleRef.current.setStyle({
            color: route?.inGeofence ? '#10b981' : '#059669',
            fillColor: route?.inGeofence ? '#34d399' : '#10b981',
            fillOpacity: route?.inGeofence ? 0.22 : 0.10
          });
        } else {
          geofenceCircleRef.current = L.circle([mLat, mLon], {
            radius: 300,
            color: '#059669',
            fillColor: '#10b981',
            fillOpacity: 0.12,
            dashArray: '6, 6'
          }).addTo(map).bindPopup('<b>Vùng Geofence 300m</b><br>Tự động thông báo khi đến gần chợ!');
        }

        // 4. Vẽ Polyline đường đi uốn lượn
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
  const triggerGeofenceCheckIn = async (lat, lon, marketId, marketName, isManual = false) => {
    const now = Date.now();
    const cooldownMs = 5 * 60 * 1000;
    if (!isManual && lastAlertRef.current.marketId === marketId && (now - lastAlertRef.current.timestamp) < cooldownMs) {
      return;
    }
    lastAlertRef.current = { marketId, timestamp: now };

    setGeofenceAlert({
      title: '📍 Chào mừng bạn đã đến phiên chợ!',
      message: `Bạn đang ở trong bán kính 300m quanh ${marketName}. Đơn hàng đặt trước của bạn đã sẵn sàng nhận tại sạp!`,
      marketName
    });

    // Giả lập chuông báo tới máy Nông dân
    setFarmerAlert({
      farmerName: 'Bác Ba Nông Dân (Sạp 05)',
      msg: `🔔 Thông báo tới Nông Dân: Khách hàng vừa tiến vào phạm vi 300m chợ! Hãy chuẩn bị sẵn giỏ nông sản đã hẹn.`
    });

    // Phát âm thanh chuông dịu nhẹ Web Audio API
    playNotificationChime();

    // Thông báo đẩy trình duyệt (HTML5 Web Notification)
    try {
      notificationService.showBrowserNotification(`📍 Bạn đã đến ${marketName}!`, {
        body: `Bạn đang ở trong bán kính 300m quanh chợ. Đơn hàng đặt trước đã sẵn sàng nhận tại quầy!`,
        tag: `geofence-${marketId}`,
        onClick: () => {
          window.focus();
        }
      });
    } catch (err) {
      console.debug('Browser notification notice:', err);
    }

    // Gửi check-in lên máy chủ để kích hoạt SSE Push Notification tới Nông dân & Khách
    try {
      await safeCallApi('/api/customer/geofence/check-in', 'POST', {
        latitude: lat,
        longitude: lon,
        targetMarketId: marketId
      });
    } catch {
      // Geofence check-in thất bại - sẽ tự retry khi vị trí cập nhật lần sau
    }
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

      {/* CỘT PHẢI: Bảng điều khiển lộ trình & Geofencing */}
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

        {/* Thanh trạng thái GPS Thực Tế */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: gpsStatus.active ? 'rgba(16, 185, 129, 0.12)' : gpsStatus.loading ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${gpsStatus.active ? '#10b981' : gpsStatus.loading ? '#3b82f6' : '#f59e0b'}`,
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 12,
          fontSize: 13
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{gpsStatus.active ? '🛰️' : gpsStatus.loading ? '📡' : '⚠️'}</span>
            <div>
              {gpsStatus.loading ? (
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Đang dò tìm tọa độ GPS thực tế của thiết bị...</span>
              ) : gpsStatus.active ? (
                <span style={{ color: '#34d399', fontWeight: 600 }}>GPS Thực Tế (±{gpsStatus.accuracy}m) • Đang theo dõi trực tiếp</span>
              ) : (
                <span style={{ color: '#fde68a' }}>Chưa cấp quyền GPS ({gpsStatus.error || 'Dùng vị trí mặc định'})</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: 12, padding: '4px 10px', height: 'auto', background: 'transparent' }}
            onClick={() => requestRealGps(false)}
          >
            🔄 Dò lại GPS
          </button>
        </div>

        {/* Vị trí GPS hiện tại */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 16,
          fontSize: 12,
          color: '#94a3b8'
        }}>
          <div>
            📍 Vị trí hiện tại: <b style={{ color: '#f1f5f9' }}>{userPos.label}</b> ({userPos.lat.toFixed(4)}, {userPos.lon.toFixed(4)})
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
            onClick={() => requestRealGps(false)}
          >
            📡 Cập nhật GPS
          </button>
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
