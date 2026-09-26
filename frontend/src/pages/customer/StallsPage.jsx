import React, { useState, useEffect } from 'react';
import './StallsPage.css';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ProductCard from '../../components/customer/ProductCard';
import marketService from '../../services/marketService';
import productService from '../../services/productService';
import farmerService from '../../services/farmerService';
import customerService from '../../services/customerService';
import { matchSearch, POPULAR_STALL_KEYWORDS } from '../../utils/searchUtils';

export default function StallsPage({
  onAddToCart,
  cartItems = [],
  onUpdateCartQty,
  onNavigate,
  initialFarmerId = null
}) {
  // Master Stalls Directory Data (Comprehensive fallback network + real backend integration)
  const defaultStalls = [
    {
      id: 103,
      farmerId: 103,
      assignmentId: 1,
      stallCode: 'Sạp A-01',
      stallName: 'Sạp Rau Củ Hữu Cơ Ba Vì',
      farmName: 'Nông Trại Hữu Cơ Ba Vì',
      farmerName: 'Bác Ba Nông Dân Ba Vì',
      marketId: 101,
      marketName: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      marketCity: 'Hà Nội',
      marketAddress: '12 Núi Trúc, P. Giảng Võ, Ba Đình, Hà Nội',
      operatingDays: 'Thứ Bảy & Chủ Nhật',
      operatingHours: '06:00 - 11:30',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
      farmAddress: 'Xã Vân Hòa, Huyện Ba Vì, Hà Nội',
      experienceYears: '12 năm làm nông',
      rating: 4.9,
      reviewCount: 48,
      specialty: 'Rau',
      specialtyName: 'Rau Lá Hữu Cơ',
      specialtyTags: ['Cải bó xôi', 'Rau muống sạch', 'Mồng tơi', 'Cải ngọt'],
      certification: 'VietGAP',
      certifications: ['Chứng nhận VietGAP 2024', 'Nguồn nước suối ngầm Ba Vì kiểm định', 'Không chất bảo quản'],
      bio: 'Nhà vườn chúng tôi chuyên canh tác rau cải bó xôi, rau muống nước ngọt và các loại rau ăn lá hoàn toàn tự nhiên dưới chân núi Ba Vì. Rau được tưới bằng nước suối nguồn trong lành, thu hoạch lúc 4h-5h sáng sớm rồi chở thẳng tới các phiên chợ để bạn nhận rau tươi ngon nhất.',
      productsCount: 12
    },
    {
      id: 104,
      farmerId: 104,
      assignmentId: 2,
      stallCode: 'Sạp A-02',
      stallName: 'Sạp Cà Chua & Dâu Mộc Châu',
      farmName: 'Vườn Rau Sinh Thái Mộc Châu',
      farmerName: 'Cô Mộc Châu Xanh',
      marketId: 101,
      marketName: 'Phiên Chợ Xanh Nông Sản Ba Đình',
      marketCity: 'Hà Nội',
      marketAddress: '12 Núi Trúc, P. Giảng Võ, Ba Đình, Hà Nội',
      operatingDays: 'Thứ Bảy & Chủ Nhật',
      operatingHours: '06:30 - 11:30',
      avatarUrl: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      farmAddress: 'Tiểu khu Pa Khen, TT. Nông trường Mộc Châu, Sơn La',
      experienceYears: '8 năm làm nông',
      rating: 4.8,
      reviewCount: 38,
      specialty: 'Củ',
      specialtyName: 'Củ & Quả Tươi Sạch',
      specialtyTags: ['Cà chua Cherry', 'Dưa chuột bao tử', 'Cà rốt tím', 'Ớt chuông mini'],
      certification: 'Organic',
      certifications: ['Hữu cơ vi sinh', 'Thu hoạch trong ngày', 'Canh tác khí hậu cao nguyên'],
      bio: 'Chuyên canh cà chua cherry bi socola ngọt giòn và dâu tây giống Nhật trên cao nguyên Mộc Châu mát mẻ quanh năm. Thu hoạch sáng sớm và vận chuyển trong thùng xốp bảo ôn xuống chợ phiên Hà Nội.',
      productsCount: 9
    },
    {
      id: 105,
      farmerId: 105,
      assignmentId: 3,
      stallCode: 'Sạp D-02',
      stallName: 'Sạp Nấm & Thảo Dược Tây Bắc',
      farmName: 'HTX Dược Liệu & Nấm Sạch Sa Pa',
      farmerName: 'Chị Lan Sa Pa Xanh',
      marketId: 104,
      marketName: 'Hội Chợ Nông Sản Vùng Miền Tây Hồ',
      marketCity: 'Hà Nội',
      marketAddress: '614 Lạc Long Quân, P. Nhật Tân, Tây Hồ, Hà Nội',
      operatingDays: 'Chủ Nhật hàng tuần',
      operatingHours: '06:30 - 11:30',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
      farmAddress: 'Bản Tả Phìn, Thị xã Sa Pa, Lào Cai',
      experienceYears: '15 năm bản địa',
      rating: 4.9,
      reviewCount: 56,
      specialty: 'Nấm',
      specialtyName: 'Nấm & Thảo Dược',
      specialtyTags: ['Nấm hương rừng', 'Nấm tuyết', 'Mật ong rừng', 'Thảo quả khô'],
      certification: 'OCOP',
      certifications: ['OCOP 4 sao tỉnh Lào Cai', '100% tự nhiên không chất bảo quản', 'Thu hái tự nhiên bền vững'],
      bio: 'Thu hái nấm hương rừng tự nhiên, thảo mộc quý và rau ôn đới đặc sản trên sườn núi Hoàng Liên Sơn. Quy trình sấy mộc và bảo quản không hóa chất.',
      productsCount: 8
    },
    {
      id: 106,
      farmerId: 106,
      assignmentId: 4,
      stallCode: 'Sạp C-05',
      stallName: 'Sạp Trái Cây & Nông Sản Đà Lạt',
      farmName: 'Nông Sản Sạch Đà Lạt Farm',
      farmerName: 'Anh Tuấn Đà Lạt',
      marketId: 103,
      marketName: 'Phiên Chợ Hữu Cơ Thảo Điền EcoMarket',
      marketCity: 'TP. Hồ Chí Minh',
      marketAddress: '28 Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
      operatingDays: 'Thứ Bảy & Chủ Nhật',
      operatingHours: '07:00 - 12:00',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
      farmAddress: 'Thôn Đa Quý, Xã Xuân Thọ, TP. Đà Lạt, Lâm Đồng',
      experienceYears: '10 năm làm nông',
      rating: 4.9,
      reviewCount: 52,
      specialty: 'Trái Cây',
      specialtyName: 'Trái Cây Bản Địa & Ôn Đới',
      specialtyTags: ['Dâu tây Hana', 'Bông Atiso tươi', 'Phúc bồn tử', 'Xà lách thủy canh'],
      certification: 'VietGAP',
      certifications: ['VietGAP 2024', 'GlobalGAP rau củ', 'Đóng gói màng thở bảo quản tự nhiên'],
      bio: 'Nhà kính công nghệ cao tại Đà Lạt, kiểm soát nhiệt độ và độ ẩm hoàn toàn tự nhiên. Nông sản được thu hái rạng sáng, bảo quản lạnh chuyển về phiên chợ Thảo Điền.',
      productsCount: 15
    },
    {
      id: 107,
      farmerId: 107,
      assignmentId: 5,
      stallCode: 'Sạp B-03',
      stallName: 'Sạp Đặc Sản Trái Cây Miền Bắc',
      farmName: 'HTX Vải & Cây Ăn Trái Hải Dương',
      farmerName: 'Bác Hoàng Thanh Hà',
      marketId: 104,
      marketName: 'Hội Chợ Nông Sản Vùng Miền Tây Hồ',
      marketCity: 'Hà Nội',
      marketAddress: '614 Lạc Long Quân, P. Nhật Tân, Tây Hồ, Hà Nội',
      operatingDays: 'Chủ Nhật hàng tuần',
      operatingHours: '06:30 - 11:30',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1200&q=80',
      farmAddress: 'Xã Thanh Thủy, Huyện Thanh Hà, Hải Dương',
      experienceYears: '20 năm nhà vườn',
      rating: 4.8,
      reviewCount: 34,
      specialty: 'Trái Cây',
      specialtyName: 'Trái Cây Bản Địa',
      specialtyTags: ['Vải thiều Thanh Hà', 'Nhãn cùi Hưng Yên', 'Bưởi tiến vua', 'Ổi Thanh Hà'],
      certification: 'VietGAP',
      certifications: ['VietGAP quả tươi', 'Chỉ dẫn địa lý quốc gia', 'Thu hái đúng độ chín cây'],
      bio: 'Vườn cây ăn trái truyền thống ba đời tại ven sông Thái Bình. Quả được chăm sóc theo hướng hữu cơ, hái rạng sáng để giữ nguyên vị ngọt đậm đà thơm ngát.',
      productsCount: 7
    },
    {
      id: 108,
      farmerId: 108,
      assignmentId: 6,
      stallCode: 'Sạp E-04',
      stallName: 'Sạp Trái Cây & Bánh Men Thủ Công',
      farmName: 'Vườn Trái Cây Sinh Thái Miền Tây',
      farmerName: 'Chú Năm Miền Tây',
      marketId: 103,
      marketName: 'Phiên Chợ Hữu Cơ Thảo Điền EcoMarket',
      marketCity: 'TP. Hồ Chí Minh',
      marketAddress: '28 Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
      operatingDays: 'Thứ Bảy & Chủ Nhật',
      operatingHours: '07:00 - 12:00',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
      farmAddress: 'Cù lao Tân Phong, Huyện Cai Lậy, Tiền Giang',
      experienceYears: '14 năm canh tác thuận tự nhiên',
      rating: 4.9,
      reviewCount: 45,
      specialty: 'Trái Cây',
      specialtyName: 'Trái Cây & Bánh Thủ Công',
      specialtyTags: ['Bưởi da xanh', 'Xoài cát Hòa Lộc', 'Mãng cầu xiêm', 'Bánh mì men chua'],
      certification: 'Organic',
      certifications: ['Hữu cơ vi sinh', 'Đạt chuẩn OCOP Bến Tre', 'Không chất bảo quản'],
      bio: 'Vườn sinh thái ngập phù sa sông Tiền. Trái cây chín cây tự nhiên, không nhúng thuốc, ngọt lịm thanh mát.',
      productsCount: 11
    }
  ];

  const [stalls, setStalls] = useState(defaultStalls);
  const [marketsList, setMarketsList] = useState([]);
  
  // Navigation / View State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [selectedStall, setSelectedStall] = useState(defaultStalls[0]);

  // Filters State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedCert, setSelectedCert] = useState('all');
  const [sortBy, setSortBy] = useState('rating_desc');

  // Detail View State
  const [stallProducts, setStallProducts] = useState([]);
  const [stallReviews, setStallReviews] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Load Markets List on Mount
  useEffect(() => {
    marketService.getMarkets().then((m) => {
      if (Array.isArray(m)) setMarketsList(m);
    }).catch(() => {});
  }, []);

  // Server-Side Stalls Search & Filter (No client-side search)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const liveStalls = await marketService.getStalls({
          search: searchKeyword.trim(),
          marketId: selectedMarketId !== 'all' ? selectedMarketId : ''
        });

        if (isMounted && Array.isArray(liveStalls) && liveStalls.length > 0) {
          const mapped = liveStalls.map((f, idx) => ({
            id: f.assignmentId || (f.marketId * 100 + f.farmerId),
            farmerId: f.farmerId,
            assignmentId: f.assignmentId || idx + 1,
            stallCode: f.stallNumber || `Sạp ${String.fromCharCode(65 + idx)}-0${idx + 1}`,
            stallName: f.stallName || `Sạp Nông Sản ${f.farmerName || 'Bản Địa'}`,
            farmName: f.stallName || `Nông Trại ${f.farmerName || 'Sạch'}`,
            farmerName: f.farmerName || 'Nhà Vườn Thành Viên',
            marketId: f.marketId,
            marketName: f.marketName || 'Phiên Chợ Nông Sản',
            marketCity: f.farmAddress && (f.farmAddress.includes('Hồ Chí Minh') || f.farmAddress.includes('Thủ Đức')) ? 'TP. Hồ Chí Minh' : 'Hà Nội',
            marketAddress: f.farmAddress || '',
            operatingDays: 'Thứ 7 & Chủ Nhật',
            operatingHours: '06:00 - 11:30',
            avatarUrl: f.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
            coverUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
            farmAddress: f.farmAddress || '',
            experienceYears: '10+ năm làm nông',
            rating: 4.9,
            reviewCount: 30 + (f.farmerId % 10) * 5,
            specialty: 'Rau',
            specialtyName: 'Nông Sản Tươi Sạch',
            specialtyTags: ['Nông sản sạch', 'Thu hoạch sáng sớm', 'VietGAP'],
            certification: 'VietGAP',
            certifications: ['Chứng nhận VietGAP', 'Kiểm định an toàn thực phẩm', 'Canh tác sinh thái'],
            bio: f.bio || 'Chuyên canh nông sản sạch chất lượng cao, phục vụ khách hàng đặt trước tại phiên chợ sáng.',
            productsCount: 8
          }));

          setStalls(mapped);
          if (!initialFarmerId && mapped.length > 0) {
            setSelectedStall(mapped[0]);
          }
        } else if (isMounted && (!searchKeyword.trim() && selectedMarketId === 'all')) {
          setStalls(defaultStalls);
        } else if (isMounted) {
          setStalls([]);
        }
      } catch (err) {
        console.warn('Failed to load live stalls from backend:', err);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchKeyword, selectedMarketId]);

  // Handle Initial Farmer Id if passed
  useEffect(() => {
    if (initialFarmerId) {
      const found = stalls.find((s) => s.farmerId === initialFarmerId || s.id === initialFarmerId);
      if (found) {
        setSelectedStall(found);
        setViewMode('detail');
      }
    }
  }, [initialFarmerId, stalls]);

  // Load Detail Products and Reviews when entering Detail Mode
  useEffect(() => {
    if (viewMode !== 'detail' || !selectedStall) return;

    let isMounted = true;
    async function loadStallDetail() {
      setDetailLoading(true);
      try {
        const normStall = (selectedStall.stallCode || '').toLowerCase().replace(/[\s\-_:]+/g, '');
        const [prods, revs, isFav] = await Promise.all([
          productService.getProducts({ 
            farmerId: selectedStall.farmerId,
            marketId: selectedStall.marketId 
          }),
          farmerService.getFarmerReviews(selectedStall.farmerId),
          customerService.checkFavorite('FARMER', selectedStall.farmerId)
        ]);

        if (isMounted) {
          let stallProds = Array.isArray(prods) ? prods : [];
          if (normStall) {
            const filteredByStall = stallProds.filter(p => {
              if (!p.stallNumber) return true;
              const pNorm = p.stallNumber.toLowerCase().replace(/[\s\-_:]+/g, '');
              return pNorm === normStall;
            });
            if (filteredByStall.length > 0 || selectedStall.marketId) {
              stallProds = filteredByStall;
            }
          }
          // Only fallback if this stall has no market assigned at all
          if (stallProds.length === 0 && !selectedStall.marketId) {
            const fallbackProds = await productService.getProducts({ farmerId: selectedStall.farmerId });
            if (Array.isArray(fallbackProds) && fallbackProds.length > 0) {
              stallProds = fallbackProds;
            }
          }
          setStallProducts(stallProds);
          setStallReviews(Array.isArray(revs) ? revs : []);
          setIsFavorited(Boolean(isFav));
        }
      } catch (err) {
        console.warn('Failed to load detail for stall', err);
      } finally {
        if (isMounted) setDetailLoading(false);
      }
    }

    loadStallDetail();
    return () => {
      isMounted = false;
    };
  }, [viewMode, selectedStall]);

  // Toggle Favorite for stall
  const handleToggleFavorite = async () => {
    if (!selectedStall) return;
    setFavLoading(true);
    try {
      if (isFavorited) {
        await customerService.removeFavorite('FARMER', selectedStall.farmerId);
        setIsFavorited(false);
      } else {
        await customerService.addFavorite('FARMER', selectedStall.farmerId);
        setIsFavorited(true);
      }
    } catch (err) {
      console.warn('Error toggling favorite:', err);
    } finally {
      setFavLoading(false);
    }
  };

  // Stalls are searched and filtered by market entirely on backend server
  const filteredStalls = stalls.filter((stall) => {
    const matchesCity = selectedCity === 'all' ||
      (selectedCity === 'hanoi' && (stall.marketCity || '').includes('Hà Nội')) ||
      (selectedCity === 'hcm' && (stall.marketCity || '').includes('Hồ Chí Minh'));

    const matchesSpecialty = selectedSpecialty === 'all' ||
      stall.specialty === selectedSpecialty;

    const matchesCert = selectedCert === 'all' ||
      (selectedCert === 'vietgap' && stall.certification === 'VietGAP') ||
      (selectedCert === 'organic' && stall.certification === 'Organic') ||
      (selectedCert === 'ocop' && stall.certification === 'OCOP');

    return matchesCity && matchesSpecialty && matchesCert;
  });

  // Sort Stalls
  const sortedStalls = [...filteredStalls].sort((a, b) => {
    if (sortBy === 'rating_desc') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'prods_desc') {
      return (b.productsCount || 0) - (a.productsCount || 0);
    }
    if (sortBy === 'code_asc') {
      return a.stallCode.localeCompare(b.stallCode);
    }
    if (sortBy === 'name_asc') {
      return a.farmName.localeCompare(b.farmName);
    }
    return 0;
  });

  const getCartQty = (prodId) => {
    const found = cartItems.find((item) => item.id === prodId || item.productId === prodId);
    return found ? found.quantity : 0;
  };

  const handleOpenDetail = (stall) => {
    setSelectedStall(stall);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedMarketId('all');
    setSelectedCity('all');
    setSelectedSpecialty('all');
    setSelectedCert('all');
    setSortBy('rating_desc');
  };

  // ==========================================================
  // RENDER: DETAIL VIEW
  // ==========================================================
  if (viewMode === 'detail' && selectedStall) {
    return (
      <div className="ml-stalls-page">
        {/* Back Button Bar */}
        <div className="ml-container" style={{ paddingTop: '24px' }}>
          <div className="ml-stall-detail-back-bar">
            <button
              type="button"
              className="ml-back-to-list-btn"
              onClick={handleBackToList}
            >
              ← Quay lại danh sách gian hàng
            </button>
          </div>

          {/* Banner Header */}
          <div className="ml-stall-detail-banner">
            <img src={selectedStall.coverUrl} alt={selectedStall.farmName} className="ml-stall-banner-img" />
            <div className="ml-stall-banner-overlay">
              <div className="ml-stall-banner-info">
                <img src={selectedStall.avatarUrl} alt={selectedStall.farmerName} className="ml-stall-banner-avatar" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Badge variant="organic" size="sm">{selectedStall.stallCode}</Badge>
                    <Badge variant="neutral" size="sm">{selectedStall.certification}</Badge>
                  </div>
                  <h1 className="ml-stall-banner-title">{selectedStall.farmName}</h1>
                  <div className="ml-stall-banner-sub">
                    Chủ sạp: <strong>{selectedStall.farmerName}</strong> • {selectedStall.experienceYears}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Two Column Grid */}
          <div className="ml-stall-detail-grid">
            {/* Sidebar Info */}
            <aside className="ml-stall-sidebar-card">
              <div>
                <button
                  type="button"
                  className={`ml-fav-btn-full ${isFavorited ? 'active' : ''}`}
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                >
                  <span>{isFavorited ? '❤️' : '🤍'}</span>
                  <span>{isFavorited ? 'Đã lưu sạp yêu thích' : 'Lưu sạp này'}</span>
                </button>
              </div>

              <div>
                <h4 className="ml-sidebar-title">🎪 Thông tin sạp tại chợ</h4>
                <div className="ml-sidebar-meta-list">
                  <div className="ml-sidebar-meta-item">
                    <span className="ml-sidebar-meta-icon">📍</span>
                    <div>
                      <strong>{selectedStall.marketName}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{selectedStall.marketAddress}</div>
                    </div>
                  </div>

                  <div className="ml-sidebar-meta-item">
                    <span className="ml-sidebar-meta-icon">🏷️</span>
                    <div>
                      Vị trí sạp: <strong>{selectedStall.stallCode}</strong>
                    </div>
                  </div>

                  <div className="ml-sidebar-meta-item">
                    <span className="ml-sidebar-meta-icon">⏰</span>
                    <div>
                      Lịch họp: <strong>{selectedStall.operatingDays}</strong> ({selectedStall.operatingHours})
                    </div>
                  </div>

                  <div className="ml-sidebar-meta-item">
                    <span className="ml-sidebar-meta-icon">🏡</span>
                    <div>
                      Nhà vườn tại: <strong>{selectedStall.farmAddress}</strong>
                    </div>
                  </div>

                  <div className="ml-sidebar-meta-item">
                    <span className="ml-sidebar-meta-icon">⭐</span>
                    <div>
                      Đánh giá: <strong>{selectedStall.rating} / 5.0</strong> ({selectedStall.reviewCount} đánh giá)
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="ml-sidebar-title">🌿 Tiêu chuẩn & Cam kết</h4>
                <div className="ml-certs-chips-list">
                  {selectedStall.certifications && selectedStall.certifications.map((c, i) => (
                    <span key={i} className="ml-cert-chip">
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content: Bio, Products, Reviews */}
            <main className="ml-stall-main-content">
              {/* About & Farming Philosophy */}
              <div className="ml-detail-section-card">
                <h3 className="ml-detail-section-title">Về Nhà Vườn & Phương Pháp Canh Tác</h3>
                <p className="ml-detail-bio-text">{selectedStall.bio}</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>Chuyên canh:</span>
                  {selectedStall.specialtyTags && selectedStall.specialtyTags.map((t, idx) => (
                    <span key={idx} className="ml-stall-spec-tag">{t}</span>
                  ))}
                </div>
              </div>

              {/* Products Catalog */}
              <div className="ml-detail-section-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 className="ml-detail-section-title" style={{ marginBottom: '4px' }}>
                      Nông Sản Mở Bán ({stallProducts.length})
                    </h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)' }}>
                      Đặt trước để sạp hái tươi và đóng gói phần riêng cho bạn nhận tại chợ sáng.
                    </p>
                  </div>
                </div>

                {detailLoading ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Đang tải nông sản của sạp...
                  </div>
                ) : stallProducts.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🥬</div>
                    <h4>Sạp chưa có sản phẩm nào mở bán cho phiên tới</h4>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Hãy quay lại sau khi nhà vườn cập nhật lịch hái mới.</p>
                  </div>
                ) : (
                  <div className="ml-detail-products-grid">
                    {stallProducts.map((prod) => (
                      <ProductCard
                        key={prod.id || prod.productId}
                        product={prod}
                        cartQuantity={getCartQty(prod.id || prod.productId)}
                        onAddToCart={onAddToCart}
                        onUpdateQty={onUpdateCartQty}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="ml-detail-section-card">
                <h3 className="ml-detail-section-title" style={{ marginBottom: '16px' }}>
                  Đánh Giá Từ Khách Đi Chợ ({stallReviews.length})
                </h3>

                <div className="ml-detail-reviews-list">
                  {stallReviews.map((rev, i) => (
                    <div key={rev.reviewId || rev.id || i} className="ml-detail-review-card">
                      <div className="ml-review-head">
                        <div className="ml-reviewer-info">
                          <div className="ml-reviewer-avatar-circle">
                            {(rev.customerName || 'K').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="ml-reviewer-name-txt">{rev.customerName || 'Khách hàng MarketLink'}</div>
                            <div className="ml-review-date-txt">{rev.createdAt ? String(rev.createdAt).replace('T', ' ').substring(0, 10) : 'Gần đây'}</div>
                          </div>
                        </div>
                        <div className="ml-review-stars-txt">
                          {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                        </div>
                      </div>
                      <p className="ml-review-comment-txt">{rev.comment}</p>
                      {rev.replyComment && (
                        <div className="ml-review-reply-box">
                          <strong>Phản hồi từ chủ sạp:</strong> {rev.replyComment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Back Button */}
              <div style={{ textAlign: 'center', paddingTop: '12px' }}>
                <Button variant="outline" size="md" onClick={handleBackToList}>
                  ← Quay lại danh sách gian hàng
                </Button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER: LIST VIEW (DEFAULT)
  // ==========================================================
  return (
    <div className="ml-stalls-page">
      {/* 1. Hero Section */}
      <section className="ml-stalls-hero">
        <div className="ml-container">
          <div className="ml-stalls-hero-content">
            <div className="ml-stalls-hero-badge">
              <span>🏡</span>
              <span>Gian Hàng Nông Dân Bản Địa</span>
            </div>

            <h1 className="ml-stalls-hero-title">
              Khám Phá Các Gian Hàng Tại Phiên Chợ Sáng
            </h1>

            <p className="ml-stalls-hero-desc">
              Kết nối trực tiếp từng sạp rau, trái cây, nấm sạch của các nông hộ tâm huyết. Xem sạp hoạt động ở chợ nào, đặt trước nông sản hái sớm và đến nhận hàng tận tay vào sáng cuối tuần.
            </p>

            <div className="ml-stalls-stats-strip">
              <div className="ml-stalls-stat-pill">
                <span>🎪</span>
                <span><span className="num">{stalls.length}</span> Gian hàng mở bán</span>
              </div>
              <div className="ml-stalls-stat-pill">
                <span>📍</span>
                <span><span className="num">4+</span> Phiên chợ liên kết</span>
              </div>
              <div className="ml-stalls-stat-pill">
                <span>🛡️</span>
                <span><span className="num">100%</span> Chuẩn VietGAP & Hữu cơ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="ml-container">
        {/* 2. Filter & Search Control Panel */}
        <div className="ml-stalls-filter-card">
          {/* Row 1: Search, Market Selector, City Selector, Cert Selector */}
          <div className="ml-stalls-filter-row-top">
            {/* Search Input */}
            <div className="ml-filter-input-wrap">
              <span className="ml-filter-icon">🔍</span>
              <input
                type="text"
                className="ml-filter-input"
                placeholder="Tìm tên sạp, nông dân, rau củ (cải bó xôi, dâu tây, A-01)..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              {searchKeyword && (
                <button
                  type="button"
                  className="ml-filter-clear-btn"
                  onClick={() => setSearchKeyword('')}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Market Filter */}
            <div className="ml-filter-select-wrap">
              <span className="ml-filter-icon">🎪</span>
              <select
                className="ml-filter-select"
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(e.target.value)}
              >
                <option value="all">Tất cả phiên chợ</option>
                {marketsList && marketsList.length > 0 ? (
                  marketsList.map((m) => (
                    <option key={m.marketId || m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Ba Đình">Phiên Chợ Xanh Ba Đình</option>
                    <option value="Thảo Điền">Phiên Chợ Hữu Cơ Thảo Điền</option>
                    <option value="Tây Hồ">Hội Chợ Nông Sản Tây Hồ</option>
                    <option value="Ecopark">Chợ Nông Sản Ecopark</option>
                  </>
                )}
              </select>
            </div>

            {/* City Filter */}
            <div className="ml-filter-select-wrap">
              <span className="ml-filter-icon">📍</span>
              <select
                className="ml-filter-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="all">Tất cả khu vực</option>
                <option value="hanoi">Hà Nội (Ba Đình, Tây Hồ)</option>
                <option value="hcm">TP. Hồ Chí Minh (Thảo Điền)</option>
              </select>
            </div>

            {/* Certification Filter */}
            <div className="ml-filter-select-wrap">
              <span className="ml-filter-icon">🛡️</span>
              <select
                className="ml-filter-select"
                value={selectedCert}
                onChange={(e) => setSelectedCert(e.target.value)}
              >
                <option value="all">Tất cả chứng nhận</option>
                <option value="vietgap">Chuẩn VietGAP</option>
                <option value="organic">Hữu cơ (Organic)</option>
                <option value="ocop">Đặc sản OCOP</option>
              </select>
            </div>
          </div>

          {/* Quick Search Chips */}
          <div className="ml-quick-search-chips">
            <span className="ml-quick-search-label">💡 Gợi ý nhanh:</span>
            {POPULAR_STALL_KEYWORDS.map((kw, idx) => (
              <button
                key={idx}
                type="button"
                className={`ml-quick-search-tag ${searchKeyword === kw ? 'active' : ''}`}
                onClick={() => setSearchKeyword(searchKeyword === kw ? '' : kw)}
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Row 2: Specialty Chips & Sort By */}
          <div className="ml-stalls-filter-row-bottom">
            <div className="ml-stalls-chip-tabs">
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-muted)', marginRight: '4px' }}>
                Chuyên canh:
              </span>
              <button
                type="button"
                className={`ml-stalls-tab ${selectedSpecialty === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty('all')}
              >
                🌿 Tất cả ({stalls.length})
              </button>
              <button
                type="button"
                className={`ml-stalls-tab ${selectedSpecialty === 'Rau' ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty('Rau')}
              >
                🥬 Rau Lá Hữu Cơ
              </button>
              <button
                type="button"
                className={`ml-stalls-tab ${selectedSpecialty === 'Củ' ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty('Củ')}
              >
                🥕 Củ & Quả Tươi
              </button>
              <button
                type="button"
                className={`ml-stalls-tab ${selectedSpecialty === 'Trái Cây' ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty('Trái Cây')}
              >
                🍓 Trái Cây Bản Địa
              </button>
              <button
                type="button"
                className={`ml-stalls-tab ${selectedSpecialty === 'Nấm' ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty('Nấm')}
              >
                🍄 Nấm & Thảo Dược
              </button>
            </div>

            <div className="ml-stalls-sort-box">
              <span>Sắp xếp:</span>
              <select
                className="ml-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating_desc">⭐ Đánh giá cao nhất</option>
                <option value="prods_desc">📦 Nhiều sản phẩm nhất</option>
                <option value="code_asc">🏷️ Mã sạp (A → Z)</option>
                <option value="name_asc">🏡 Tên nhà vườn (A → Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Summary Status */}
        {(searchKeyword.trim() !== '' || selectedMarketId !== 'all' || selectedCity !== 'all' || selectedSpecialty !== 'all' || selectedCert !== 'all') && (
          <div className="ml-stalls-status-bar">
            <span>
              Tìm thấy <strong>{sortedStalls.length}</strong> gian hàng phù hợp
              {searchKeyword && <> với từ khóa "<strong>{searchKeyword}</strong>"</>}
              {selectedMarketId !== 'all' && <> tại chợ <strong>{selectedMarketId}</strong></>}
              {selectedCity !== 'all' && <> khu vực <strong>{selectedCity === 'hanoi' ? 'Hà Nội' : 'TP. HCM'}</strong></>}
            </span>
            <button
              type="button"
              className="ml-stalls-reset-link"
              onClick={handleResetFilters}
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* 3. Stalls Grid */}
        <div className="ml-stalls-grid">
          {sortedStalls.map((stall) => (
            <div key={stall.id} className="ml-stall-card">
              {/* Card Cover & Avatar */}
              <div className="ml-stall-card-header">
                <img src={stall.coverUrl} alt={stall.farmName} className="ml-stall-card-cover" />
                <div className="ml-stall-cover-overlay"></div>
                <div className="ml-stall-badge-code">
                  <span>🎪</span>
                  <span>{stall.stallCode}</span>
                </div>
                <div className="ml-stall-badge-cert">
                  {stall.certification}
                </div>
                <div className="ml-stall-avatar-wrap">
                  <img src={stall.avatarUrl} alt={stall.farmerName} className="ml-stall-avatar-img" />
                </div>
              </div>

              {/* Card Body */}
              <div className="ml-stall-card-body">
                <div className="ml-stall-title-row">
                  <h3 className="ml-stall-farm-name">{stall.farmName}</h3>
                  <div className="ml-stall-rating">
                    <span>⭐</span>
                    <span>{stall.rating}</span>
                  </div>
                </div>

                <div className="ml-stall-farmer-name">
                  Chủ sạp: <strong>{stall.farmerName}</strong> ({stall.reviewCount} đánh giá)
                </div>

                {/* Market & Schedule Info Box */}
                <div className="ml-stall-meta-box">
                  <div className="ml-stall-meta-item">
                    <span className="ml-stall-meta-icon">📍</span>
                    <span>Tại: <strong>{stall.marketName}</strong></span>
                  </div>
                  <div className="ml-stall-meta-item">
                    <span className="ml-stall-meta-icon">⏰</span>
                    <span>{stall.operatingDays} ({stall.operatingHours})</span>
                  </div>
                </div>

                {/* Specialties Tags */}
                <div className="ml-stall-specialties-wrap">
                  {stall.specialtyTags && stall.specialtyTags.map((tag, idx) => (
                    <span key={idx} className="ml-stall-spec-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bio snippet */}
                <p className="ml-stall-bio-snip">{stall.bio}</p>

                {/* Actions */}
                <div className="ml-stall-card-actions">
                  <Button
                    variant="primary"
                    size="md"
                    className="ml-stall-btn-primary"
                    onClick={() => handleOpenDetail(stall)}
                  >
                    Xem chi tiết gian hàng →
                  </Button>
                  <div className="ml-stall-prods-badge" title="Số lượng sản phẩm mở bán">
                    {stall.productsCount} món
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State with Fallback Suggestions & Recommendations */}
        {sortedStalls.length === 0 && (
          <div className="ml-stalls-empty-container">
            <div className="ml-stalls-empty-card">
              <span className="ml-stalls-empty-icon">🎪</span>
              <div className="ml-stalls-empty-title">
                {searchKeyword ? `Không tìm thấy gian hàng khớp với "${searchKeyword}"` : 'Không có gian hàng nào khớp bộ lọc'}
              </div>
              <div className="ml-stalls-empty-desc">
                Bạn có thể thử bấm vào một trong các từ khóa phổ biến bên dưới hoặc xóa bớt tiêu chí lọc để xem thêm gian hàng.
              </div>

              {/* Suggestions chips */}
              <div className="ml-empty-suggestions-box">
                <span className="ml-empty-suggestions-label">Thử tìm kiếm với:</span>
                <div className="ml-empty-chips-list">
                  {POPULAR_STALL_KEYWORDS.map((kw, i) => (
                    <button
                      key={i}
                      type="button"
                      className="ml-empty-chip-btn"
                      onClick={() => {
                        setSearchKeyword(kw);
                        setSelectedMarketId('all');
                        setSelectedCity('all');
                        setSelectedSpecialty('all');
                        setSelectedCert('all');
                      }}
                    >
                      🔍 {kw}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button variant="primary" size="md" onClick={handleResetFilters}>
                  ↺ Xem tất cả gian hàng
                </Button>
              </div>
            </div>

            {/* Recommendations Section so screen is never blank */}
            <div className="ml-fallback-recommended-section">
              <div className="ml-fallback-header">
                <span className="ml-fallback-badge">⭐ ĐƯỢC ĐÁNH GIÁ CAO</span>
                <h3 className="ml-fallback-title">Gợi Ý Các Gian Hàng Nổi Bật Tại Chợ Phiên</h3>
                <p className="ml-fallback-sub">Các nhà vườn uy tín có nhiều nông sản tươi ngon sẵn sàng phục vụ bạn:</p>
              </div>

              <div className="ml-stalls-grid">
                {stalls.slice(0, 3).map((stall) => (
                  <div key={stall.id} className="ml-stall-card">
                    <div className="ml-stall-card-header">
                      <img src={stall.coverUrl} alt={stall.farmName} className="ml-stall-card-cover" />
                      <div className="ml-stall-cover-overlay"></div>
                      <div className="ml-stall-badge-code">
                        <span>🎪</span>
                        <span>{stall.stallCode}</span>
                      </div>
                      <div className="ml-stall-badge-cert">{stall.certification}</div>
                      <div className="ml-stall-avatar-wrap">
                        <img src={stall.avatarUrl} alt={stall.farmerName} className="ml-stall-avatar-img" />
                      </div>
                    </div>
                    <div className="ml-stall-card-body">
                      <div className="ml-stall-title-row">
                        <h3 className="ml-stall-farm-name">{stall.farmName}</h3>
                        <div className="ml-stall-rating">
                          <span>⭐</span>
                          <span>{stall.rating}</span>
                        </div>
                      </div>
                      <div className="ml-stall-farmer-name">Chủ sạp: <strong>{stall.farmerName}</strong></div>
                      <div className="ml-stall-meta-box">
                        <div className="ml-stall-meta-item">
                          <span className="ml-stall-meta-icon">📍</span>
                          <span>Tại: <strong>{stall.marketName}</strong></span>
                        </div>
                        <div className="ml-stall-meta-item">
                          <span className="ml-stall-meta-icon">⏰</span>
                          <span>{stall.operatingDays}</span>
                        </div>
                      </div>
                      <div className="ml-stall-card-actions" style={{ marginTop: 'auto' }}>
                        <Button
                          variant="primary"
                          size="md"
                          className="ml-stall-btn-primary"
                          onClick={() => handleOpenDetail(stall)}
                        >
                          Xem chi tiết gian hàng →
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
