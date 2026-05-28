'use client';
import { useState, useEffect, useRef, useMemo } from 'react';

const api = async (endpoint, payload = {}) => {
  try {
    const res = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, ...payload }),
      credentials: 'include',
    });
    return res.json();
  } catch (e) {
    return { success: false, msg: 'Koneksi gagal' };
  }
};
const authApi = async (path, payload) => {
  try {
    const res = await fetch(`/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    return res.json();
  } catch (e) {
    return { success: false, msg: 'Koneksi gagal' };
  }
};

const fmt = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const OTP_DURATION = 300;
const FLAGS = {
  indonesia: '🇮🇩', malaysia: '🇲🇾', 'united states': '🇺🇸', usa: '🇺🇸',
  india: '🇮🇳', philippines: '🇵🇭', vietnam: '🇻🇳', thailand: '🇹🇭',
  singapore: '🇸🇬', myanmar: '🇲🇲', cambodia: '🇰🇭', laos: '🇱🇦',
  brazil: '🇧🇷', mexico: '🇲🇽', russia: '🇷🇺', china: '🇨🇳',
  'united kingdom': '🇬🇧', uk: '🇬🇧', france: '🇫🇷', germany: '🇩🇪',
  turkey: '🇹🇷', nigeria: '🇳🇬', ghana: '🇬🇭', kenya: '🇰🇪',
  pakistan: '🇵🇰', bangladesh: '🇧🇩', egypt: '🇪🇬', ukraine: '🇺🇦',
  poland: '🇵🇱', 'south africa': '🇿🇦', colombia: '🇨🇴', argentina: '🇦🇷',
  peru: '🇵🇪', ethiopia: '🇪🇹', tanzania: '🇹🇿', netherlands: '🇳🇱',
  spain: '🇪🇸', afghanistan: '🇦🇫', albania: '🇦🇱', algeria: '🇩🇿',
  andorra: '🇦🇩', angola: '🇦🇴', 'antigua and barbuda': '🇦🇬', armenia: '🇦🇲',
  australia: '🇦🇺', austria: '🇦🇹', azerbaijan: '🇦🇿', bahamas: '🇧🇸',
  bahrain: '🇧🇭', barbados: '🇧🇧', belarus: '🇧🇾', belgium: '🇧🇪',
  belize: '🇧🇿', benin: '🇧🇯', bhutan: '🇧🇹', bolivia: '🇧🇴',
  'bosnia and herzegovina': '🇧🇦', botswana: '🇧🇼', brunei: '🇧🇳', bulgaria: '🇧🇬',
  'burkina faso': '🇧🇫', burundi: '🇧🇮', 'cabo verde': '🇨🇻', 'cape verde': '🇨🇻',
  cameroon: '🇨🇲', canada: '🇨🇦', 'central african republic': '🇨🇫', chad: '🇹🇩',
  chile: '🇨🇱', comoros: '🇰🇲', congo: '🇨🇬', 'costa rica': '🇨🇷',
  croatia: '🇭🇷', cuba: '🇨🇺', cyprus: '🇨🇾', czechia: '🇨🇿',
  'czech republic': '🇨🇿', denmark: '🇩🇰', djibouti: '🇩🇯', dominica: '🇩🇲',
  'dominican republic': '🇩🇴', 'democratic republic of the congo': '🇨🇩', ecuador: '🇪🇨', 'el salvador': '🇸🇻',
  'equatorial guinea': '🇬🇶', eritrea: '🇪🇷', estonia: '🇪🇪', eswatini: '🇸🇿',
  fiji: '🇫🇯', finland: '🇫🇮', gabon: '🇬🇦', gambia: '🇬🇲',
  georgia: '🇬🇪', greece: '🇬🇷', grenada: '🇬🇩', guatemala: '🇬🇹',
  guinea: '🇬🇳', 'guinea-bissau': '🇬🇼', guyana: '🇬🇾', haiti: '🇭🇹',
  honduras: '🇭🇳', hungary: '🇭🇺', iceland: '🇮🇸', iran: '🇮🇷',
  iraq: '🇮🇶', ireland: '🇮🇪', israel: '🇮🇱', italy: '🇮🇹',
  'ivory coast': '🇨🇮', "cote d'ivoire": '🇨🇮', jamaica: '🇯🇲', japan: '🇯🇵',
  jordan: '🇯🇴', kazakhstan: '🇰🇿', kiribati: '🇰🇮', kuwait: '🇰🇼',
  kyrgyzstan: '🇰🇬', latvia: '🇱🇻', lebanon: '🇱🇧', lesotho: '🇱🇸',
  liberia: '🇱🇷', libya: '🇱🇾', liechtenstein: '🇱🇮', lithuania: '🇱🇹',
  luxembourg: '🇱🇺', madagascar: '🇲🇬', malawi: '🇲🇼', maldives: '🇲🇻',
  mali: '🇲🇱', malta: '🇲🇹', 'marshall islands': '🇲🇭', mauritania: '🇲🇷',
  mauritius: '🇲🇺', micronesia: '🇫🇲', moldova: '🇲🇩', monaco: '🇲🇨',
  mongolia: '🇲🇳', montenegro: '🇲🇪', morocco: '🇲🇦', mozambique: '🇲🇿',
  namibia: '🇳🇦', nauru: '🇳🇷', nepal: '🇳🇵', 'new zealand': '🇳🇿',
  nicaragua: '🇳🇮', niger: '🇳🇪', 'north korea': '🇰🇵', 'north macedonia': '🇲🇰',
  norway: '🇳🇴', oman: '🇴🇲', palau: '🇵🇼', palestine: '🇵🇸',
  panama: '🇵🇦', 'papua new guinea': '🇵🇬', paraguay: '🇵🇾', portugal: '🇵🇹',
  qatar: '🇶🇦', romania: '🇷🇴', rwanda: '🇷🇼', 'saint kitts and nevis': '🇰🇳',
  'saint lucia': '🇱🇨', 'saint vincent and the grenadines': '🇻🇨', samoa: '🇼🇸', 'san marino': '🇸🇲',
  'sao tome and principe': '🇸🇹', 'saudi arabia': '🇸🇦', senegal: '🇸🇳', serbia: '🇷🇸',
  seychelles: '🇸🇨', 'sierra leone': '🇸🇱', slovakia: '🇸🇰', slovenia: '🇸🇮',
  'solomon islands': '🇸🇧', somalia: '🇸🇴', 'south korea': '🇰🇷', korea: '🇰🇷',
  'south sudan': '🇸🇸', 'sri lanka': '🇱🇰', sudan: '🇸🇩', suriname: '🇸🇷',
  sweden: '🇸🇪', switzerland: '🇨🇭', syria: '🇸🇾', taiwan: '🇹🇼',
  tajikistan: '🇹🇯', 'timor-leste': '🇹🇱', 'east timor': '🇹🇱', togo: '🇹🇬',
  tonga: '🇹🇴', 'trinidad and tobago': '🇹🇹', tunisia: '🇹🇳', turkmenistan: '🇹🇲',
  tuvalu: '🇹🇻', uganda: '🇺🇬', 'united arab emirates': '🇦🇪', uae: '🇦🇪',
  uruguay: '🇺🇾', uzbekistan: '🇺🇿', vanuatu: '🇻🇺', 'vatican city': '🇻🇦',
  vatican: '🇻🇦', venezuela: '🇻🇪', yemen: '🇾🇪', zambia: '🇿🇲',
  zimbabwe: '🇿🇼',
};
const getFlag = name => FLAGS[name?.toLowerCase()] || '🌐';

const formatTime = secs => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const formatReceiptDate = (ts) => {
  if (!ts) return '-';
  const n = Number(ts);
  if (isNaN(n)) return '-';
  const d = new Date(n);
  if (isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}.${d.getMinutes().toString().padStart(2, '0')} WIB`;
};

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" className="eye-btn" onClick={onToggle} tabIndex={-1}>
      {show ? '🐵' : '🙈'}
    </button>
  );
}

function LoadingSpinner({ style }) {
  return <div className="loading-spinner" style={style} />;
}

const SvgProduct = () => (
  <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
    <rect x="5" y="2" width="14" height="20" rx="3" fill="currentColor" fillOpacity="0.15" />
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);
const SvgPPOB = () => (
  <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
    <rect x="2" y="6" width="20" height="12" rx="4" fill="currentColor" fillOpacity="0.15" />
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 12h4m-2-2v4m8-2h.01M16 10h.01" />
  </svg>
);
const SvgTopUp = () => (
  <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
    <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 14h3M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
  </svg>
);
const SvgProfile = () => (
  <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
    <circle cx="12" cy="8" r="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
  </svg>
);
const SvgSun = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
);
const SvgMoon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
);
const SvgBell = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

function OperatorIcon({ name }) {
  const [imgFailed, setImgFailed] = useState(false);
  const slug = name ? name.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') : '';
  const imgUrl = slug && name !== 'any' ? `https://assets.cindigital.id/operators/${slug}.png` : null;
  return (
    <div className="operator-icon-placeholder">
      {imgUrl && !imgFailed ? (
        <img src={imgUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} onError={() => setImgFailed(true)} />
      ) : (
        <span style={{ fontSize: name === 'any' ? '1.2rem' : '0.95rem', fontWeight: 900, color: 'var(--blue2)', letterSpacing: '-0.5px' }}>
          {name === 'any' ? '✦' : (name?.[0]?.toUpperCase() || '?')}
        </span>
      )}
    </div>
  );
}

const IconCheck = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
);
const IconCross = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
);
const IconWarning = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
);
const IconClock = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

export default function Page() {
  const [theme, setTheme] = useState('dark');
  const [step, setStep] = useState('init');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pwInput, setPwInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [setupUser, setSetupUser] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpMode, setOtpMode] = useState('register');
  const timerRef = useRef(null);

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [hasPassword, setHasPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [tab, setTab] = useState('virtual');

  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [countryQuery, setCountryQuery] = useState('');

  const [selectedSvc, setSelectedSvc] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const [expandedCountry, setExpandedCountry] = useState(null);
  const [orderingProv, setOrderingProv] = useState(null);

  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [operators, setOperators] = useState([]);
  const [selectedOrderContext, setSelectedOrderContext] = useState(null);

  const [order, setOrder] = useState(null);
  const [orderExpiry, setOrderExpiry] = useState(0);
  const [cancelCooldown, setCancelCooldown] = useState(0);
  const [cancelingOrder, setCancelingOrder] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [qrisData, setQrisData] = useState(null);
  const [creatingQris, setCreatingQris] = useState(false);
  const [cancelingDeposit, setCancelingDeposit] = useState(false);

  const [curPass, setCurPass] = useState('');
  const [profileNewPass, setProfileNewPass] = useState('');
  const [profileConfirmPass, setProfileConfirmPass] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showProfileConfPass, setShowProfileConfPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);

  const [ppobItems, setPpobItems] = useState([]);
  const [ppobError, setPpobError] = useState('');
  const [ppobQuery, setPpobQuery] = useState('');
  const [ppobLoading, setPpobLoading] = useState(false);

  const [loadingSvcs, setLoadingSvcs] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingOperators, setLoadingOperators] = useState(false);

  const [historyItems, setHistoryItems] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [depositCountdown, setDepositCountdown] = useState(0);
  const [qrisCountdown, setQrisCountdown] = useState(0);

  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ show: false, type: 'info', title: '', msg: '', onConfirm: null });
  const [cancelNotif, setCancelNotif] = useState(null);
  const [paymentSuccessNotif, setPaymentSuccessNotif] = useState(null);
  const [hasNewActivity, setHasNewActivity] = useState(false);

  const tabRef = useRef(tab);
  const lastHistoryIdRef = useRef(null);

  const showToast = (type, title, msg) => {
    setToast({ type, title, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const showCancelNotif = (amount, subtitle = 'Transaksi telah dibatalkan') => {
    setCancelNotif({ amount, subtitle });
    setTimeout(() => setCancelNotif(null), 2800);
  };

  const showPaymentSuccessNotif = (amount, subtitle = 'Saldo berhasil masuk ke akun kamu!') => {
    setPaymentSuccessNotif({ amount, subtitle });
    setTimeout(() => setPaymentSuccessNotif(null), 5500);
  };

  const showModal = (type, title, msg, onConfirm = null) => {
    setModal({ show: true, type, title, msg, onConfirm });
  };
  const closeModal = () => setModal(prev => ({ ...prev, show: false }));

  useEffect(() => {
    const savedTheme = localStorage.getItem('walz_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const n = theme === 'dark' ? 'light' : 'dark';
    setTheme(n);
    localStorage.setItem('walz_theme', n);
    document.documentElement.setAttribute('data-theme', n);
  };

  useEffect(() => {
    api('balance').then(r => {
      if (r.success) {
        setUser({ email: r.data.email });
        setBalance(r.data.balance);
        setHasPassword(r.data.hasPassword);
        setUsername(r.data.username || '');
        setStep('app');
      } else {
        setStep('welcome');
      }
    });
  }, []);

  useEffect(() => {
    if (step !== 'app') return;
    setLoadingSvcs(true);
    api('services').then(r => {
      setLoadingSvcs(false);
      if (r.success && Array.isArray(r.data)) {
        const base = r.data.map(s => ({ ...s, price: null, stock: null }));
        setServices(base);
      }
    });
  }, [step]);

  useEffect(() => {
    if (step !== 'app' || services.length === 0) return;
    let isSubscribed = true;
    const loadStocks = async () => {
      const queue = services.filter(s => s.stock === null);
      for (let i = 0; i < queue.length; i += 3) {
        if (!isSubscribed) break;
        const batch = queue.slice(i, i + 3);
        await Promise.all(batch.map(async (svc) => {
          const rc = await api('countries', { service_id: svc.service_code });
          if (rc.data && Array.isArray(rc.data)) {
            let totalStock = 0;
            let minPrice = Infinity;
            rc.data.forEach(c => {
              const avail = c.pricelist?.filter(p => p.available) || [];
              avail.forEach(p => {
                totalStock += 1;
                if (p.price < minPrice) minPrice = p.price;
              });
            });
            setServices(prev => prev.map(s =>
              s.service_code === svc.service_code
                ? { ...s, stock: totalStock, price: minPrice === Infinity ? null : minPrice }
                : s
            ));
          } else {
            setServices(prev => prev.map(s => s.service_code === svc.service_code ? { ...s, stock: 0 } : s));
          }
        }));
        await new Promise(res => setTimeout(res, 600));
      }
    };
    loadStocks();
    return () => { isSubscribed = false; };
  }, [step, services.length]);

  useEffect(() => {
    if (countdown <= 0) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [countdown]);

  useEffect(() => {
    const t = setInterval(() => {
      setOrderExpiry(prev => prev > 0 ? prev - 1 : 0);
      setCancelCooldown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { tabRef.current = tab; }, [tab]);

  const fetchHistory = async (showLoader = false) => {
    if (showLoader) setLoadingHistory(true);
    const r = await api('history');
    if (showLoader) setLoadingHistory(false);
    if (r.success && Array.isArray(r.data)) {
      const latestId = r.data[0]?.id || null;
      if (lastHistoryIdRef.current !== null && latestId !== lastHistoryIdRef.current && tabRef.current !== 'activity') {
        setHasNewActivity(true);
      }
      if (latestId) lastHistoryIdRef.current = latestId;
      setHistoryItems(r.data);
    }
  };

  useEffect(() => {
    if (!selectedHistoryItem || selectedHistoryItem.itemType !== 'deposit' ||
      (selectedHistoryItem.status !== 'pending' && selectedHistoryItem.status !== 'waiting')) {
      setDepositCountdown(0);
      return;
    }
    const expiredAt = selectedHistoryItem.expired_at
      ? Number(selectedHistoryItem.expired_at)
      : Number(selectedHistoryItem.timestamp) + 20 * 60 * 1000;
    const update = () => setDepositCountdown(Math.max(0, Math.floor((expiredAt - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [selectedHistoryItem?.id, selectedHistoryItem?.status]);

  useEffect(() => {
    if (!qrisData?.expired_at) { setQrisCountdown(0); return; }
    const update = () => setQrisCountdown(Math.max(0, Math.floor((Number(qrisData.expired_at) - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [qrisData?.id]);

  const downloadQrisImage = async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `qris-payment-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast('success', 'Berhasil', 'Gambar QRIS berhasil diunduh');
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  useEffect(() => {
    let interval;
    if (tab === 'activity') {
      fetchHistory(false);
      interval = setInterval(() => fetchHistory(false), 5000);
    }
    return () => clearInterval(interval);
  }, [tab]);

  useEffect(() => {
    if (selectedHistoryItem) {
      const updated = historyItems.find(h => h.id === selectedHistoryItem.id);
      if (updated && updated.status !== selectedHistoryItem.status) {
        setSelectedHistoryItem(updated);
        api('balance').then(res => res.success && setBalance(res.data.balance));
      }
    }
  }, [historyItems]);

  useEffect(() => {
    let interval;
    if (selectedHistoryItem && selectedHistoryItem.itemType === 'deposit' && (selectedHistoryItem.status === 'pending' || selectedHistoryItem.status === 'waiting')) {
      interval = setInterval(async () => {
        try {
          const r = await api('deposit_status', { deposit_id: selectedHistoryItem.id });
          const newStatus = r.status || r.data?.status;
          if (r.success && (newStatus === 'paid' || newStatus === 'success' || newStatus === 'completed')) {
            const creditAmt = selectedHistoryItem?.diterima || selectedHistoryItem?.base_amount || selectedHistoryItem?.amount || 0;
            setHistoryItems(prev => prev.map(h => h.id === selectedHistoryItem.id ? { ...h, status: 'success' } : h));
            setSelectedHistoryItem(prev => prev ? { ...prev, status: 'success' } : prev);
            fetchHistory();
            api('balance').then(res => res.success && setBalance(res.data.balance));
            showPaymentSuccessNotif(creditAmt, 'Pembayaran telah diterima!');
          } else if (r.success && (newStatus === 'cancel' || newStatus === 'canceled')) {
            fetchHistory();
          }
        } catch (error) { }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedHistoryItem]);

  useEffect(() => {
    let interval;
    if (qrisData) {
      interval = setInterval(async () => {
        try {
          const r = await api('deposit_status', { deposit_id: qrisData.id });
          const newStatus = r.status || r.data?.status;
          if (r.success && (newStatus === 'paid' || newStatus === 'success' || newStatus === 'completed')) {
            const creditAmt = qrisData.credit_amount || qrisData.actual_amount || 0;
            setBalance(r.new_balance || r.data?.balance || balance);
            setQrisData(null);
            setDepositAmount('');
            showPaymentSuccessNotif(creditAmt, 'Deposit berhasil masuk ke akun kamu!');
            api('balance').then(res => res.success && setBalance(res.data.balance));
          }
        } catch (error) { }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [qrisData]);

  useEffect(() => {
    let interval;
    if (order && !order.otp_code) {
      interval = setInterval(async () => {
        try {
          const r = await api('order_status', { order_id: order.order_id });
          if (r.success && r.data?.otp_code) {
            setOrder(prev => ({ ...prev, otp_code: r.data.otp_code, otp_msg: r.data.otp_msg }));
            showToast('success', 'SMS Masuk!', 'Kode OTP berhasil diterima.');
            api('balance').then(res => res.success && setBalance(res.data.balance));
          } else if (r.success && r.data?.status === 'cancel') {
            setOrder(null);
            showToast('warning', 'Dibatalkan', 'Pesanan telah dibatalkan.');
          }
        } catch (error) { }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [order]);

  useEffect(() => {
    if (!showSheet) {
      setExpandedCountry(null);
      setCountries([]);
      setCountryQuery('');
    }
  }, [showSheet]);

  const fetchPpob = async () => {
    setPpobError('');
    setPpobLoading(true);
    const r = await api('h2h_products');
    setPpobLoading(false);
    if (r.success && Array.isArray(r.data)) {
      setPpobItems(r.data);
    } else {
      setPpobError(r.msg || 'Sistem Sedang Maintenance');
    }
  };

  useEffect(() => {
    if (tab === 'ppob' && ppobItems.length === 0 && !ppobError) {
      fetchPpob();
    }
  }, [tab]);

  const startCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(OTP_DURATION);
  };

  const handleForgotCheck = async () => {
    if (!email) {
      showToast('warning', 'Perhatian', 'Harap masukkan alamat email terlebih dahulu.');
      return;
    }
    setBusy(true);
    try {
      const check = await api('check_email', { email });
      if (!check.exists) {
        setBusy(false);
        showToast('error', 'Belum Terdaftar', 'Email ini belum terdaftar di sistem kami.');
        return;
      }
      sendOtp(email, 'reset');
    } catch (e) {
      setBusy(false);
      showToast('error', 'Error', 'Gagal memproses permintaan.');
    }
  };

  const sendOtp = async (targetEmail, mode = 'register') => {
    if (!targetEmail) return;
    setBusy(true);
    try {
      const r = await authApi('request-otp', { email: targetEmail });
      setBusy(false);
      if (r.success) {
        setOtpMode(mode);
        setOtpCode('');
        setStep(mode === 'reset' ? 'forgot_otp' : 'register_otp');
        startCountdown();
      } else {
        showToast('error', 'Gagal', r.msg || 'Gagal mengirim OTP ke email kamu.');
      }
    } catch (e) {
      setBusy(false);
      showToast('error', 'Error', 'Gagal terhubung ke server.');
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setBusy(true);
    try {
      const r = await authApi('verify-otp', { email, code: otpCode, mode: otpMode });
      setBusy(false);
      if (r.success) {
        if (otpMode === 'reset') {
          setResetToken(r.resetToken);
          setNewPass(''); setConfirmPass('');
          setStep('reset_pw');
        } else {
          if (r.needsSetup) {
            setStep('register_setup');
          } else {
            setUser(r.user);
            setBalance(r.user.balance);
            setUsername(r.user.username);
            setHasPassword(true);
            setStep('app');
          }
        }
      } else {
        showToast('error', 'Verifikasi Gagal', r.msg || 'Kode OTP salah atau sudah expired.');
      }
    } catch (e) {
      setBusy(false);
      showToast('error', 'Error', 'Kesalahan koneksi verifikasi OTP.');
    }
  };

  const completeSetup = async () => {
    if (newPass.length < 6 || newPass !== confirmPass || !setupUser) return;
    setBusy(true);
    try {
      const r = await authApi('set-password', { newPassword: newPass, setupMode: true, username: setupUser });
      setBusy(false);
      if (r.success) {
        api('balance').then(res => {
          if (res.success) {
            setUser({ email: res.data.email });
            setBalance(res.data.balance);
            setUsername(res.data.username);
            setHasPassword(true);
            setStep('app');
          }
        });
      } else {
        showToast('error', 'Gagal', r.msg || 'Gagal menyimpan pengaturan profil.');
      }
    } catch (e) {
      setBusy(false);
      showToast('error', 'Error', 'Terjadi kesalahan sistem.');
    }
  };

  const loginWithPassword = async () => {
    if (!email || !pwInput) return;
    setBusy(true);
    try {
      const r = await authApi('login-password', { email, password: pwInput });
      setBusy(false);
      if (r.success) {
        setUser(r.user);
        setBalance(r.user.balance);
        setUsername(r.user.username);
        setHasPassword(true);
        setStep('app');
      } else {
        if (r.msg.toLowerCase().includes('belum terdaftar')) {
          showToast('error', 'Belum Terdaftar', r.msg);
        } else {
          showToast('error', 'Login Gagal', r.msg);
        }
      }
    } catch (e) {
      setBusy(false);
      showToast('error', 'Error Sistem', 'Gagal terhubung ke server saat login.');
    }
  };

  const resetPassword = async () => {
    if (newPass.length < 6 || newPass !== confirmPass) return;
    setBusy(true);
    try {
      const r = await authApi('reset-password', { resetToken, newPassword: newPass });
      setBusy(false);
      if (r.success) {
        setUser(r.user);
        setBalance(r.user.balance);
        setUsername(r.user.username);
        setHasPassword(true);
        setStep('app');
        showToast('success', 'Berhasil', 'Password baru berhasil disimpan.');
      } else {
        showToast('error', 'Gagal', r.msg || 'Proses reset password gagal, coba lagi nanti.');
      }
    } catch (e) {
      setBusy(false);
      showToast('error', 'Error', 'Gagal melakukan reset password.');
    }
  };

  const logout = async () => {
    await api('logout');
    setUser(null); setBalance(0); setStep('welcome');
    setEmail(''); setOtpCode(''); setPwInput(''); setOrder(null); setServices([]);
  };

  const openService = async svc => {
    setSelectedSvc(svc);
    setShowSheet(true);
    setLoadingCountries(true);
    const r = await api('countries', { service_id: svc.service_code });
    setLoadingCountries(false);
    if (r.success && Array.isArray(r.data)) {
      const filtered = r.data
        .map(c => ({
          ...c,
          available: c.pricelist?.filter(p => p.available) || [],
        }))
        .filter(c => c.available.length > 0)
        .sort((a, b) => {
          const ai = a.name?.toLowerCase().includes('indonesia') ? 0 : 1;
          const bi = b.name?.toLowerCase().includes('indonesia') ? 0 : 1;
          return ai - bi || a.available[0].price - b.available[0].price;
        });
      setCountries(filtered);
    }
  };

  const handleOrderClick = async (country, provider) => {
    setSelectedOrderContext({ country, provider });
    setShowOperatorModal(true);
    setOperators([]);
    setLoadingOperators(true);
    try {
      const r = await api('operators', { country: country.name, provider_id: provider.provider_id });
      setLoadingOperators(false);
      if (r.success && Array.isArray(r.data) && r.data.length > 0) {
        const seen = new Set();
        const deduped = r.data.filter(op => {
          const key = op.name?.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setOperators(deduped);
      } else {
        setOperators([{ id: 'any', name: 'any' }]);
      }
    } catch (e) {
      setLoadingOperators(false);
      setOperators([{ id: 'any', name: 'any' }]);
    }
  };

  const confirmOrder = async (operatorObj) => {
    const operatorName = operatorObj.name;
    setShowOperatorModal(false);
    setOrderingProv(selectedOrderContext.provider.provider_id);
    showToast('info', 'Memproses', 'Membuat pesanan...');

    try {
      const r = await api('order_create', {
        number_id: selectedOrderContext.country.number_id,
        provider_id: selectedOrderContext.provider.provider_id,
        service_id: selectedSvc.service_code,
        service_name: selectedSvc.service_name,
        service_img: selectedSvc.service_img,
        operator_id: operatorName
      });
      setOrderingProv(null);
      if (r.success) {
        setOrder({ ...r.data, service_name: selectedSvc.service_name, service_img: selectedSvc.service_img, operator: operatorName, country: selectedOrderContext.country.name });
        setOrderExpiry(1200);
        setCancelCooldown(180);
        setShowSheet(false);
        api('balance').then(res => res.success && setBalance(res.data.balance));
      } else {
        const isInsufficient =
          r.error_code === 'INSUFFICIENT_BALANCE' ||
          (r.msg && r.msg.toLowerCase().includes('tidak cukup'));
        if (isInsufficient) {
          setShowSheet(false);
          const required = r.required ? Number(r.required) : null;
          const kekurangan = required ? Math.max(0, required - balance) : null;
          const detailMsg = kekurangan && kekurangan > 0
            ? `Saldo kamu ${fmt(balance)}, butuh ${fmt(required)}. Kekurangan ${fmt(kekurangan)}. Top up sekarang yuk!`
            : 'Saldo kamu kurang untuk membeli nomor ini. Yuk top up dulu agar bisa bertransaksi dengan lancar.';
          showModal('warning', 'Saldo Tidak Cukup!', detailMsg, () => setTab('deposit'));
        } else {
          showToast('error', 'Pesanan Gagal', r.msg || 'Stock penyedia habis, tunggu beberapa saat.');
        }
      }
    } catch (e) {
      setOrderingProv(null);
      showToast('error', 'Error', 'Koneksi ke server gagal.');
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    const orderPrice = order.price;
    setCancelingOrder(true);
    const r = await api('order_cancel', { order_id: order.order_id });
    setCancelingOrder(false);
    if (r.success) {
      setOrder(null);
      showCancelNotif(orderPrice, 'Saldo telah dikembalikan ke akun kamu');
      api('balance').then(res => res.success && setBalance(res.data.balance));
    } else {
      showToast('error', 'Gagal Batal', r.msg || 'Terjadi kesalahan saat membatalkan.');
    }
  };

  const cancelHistoryOrder = async (orderId, orderPrice) => {
    setBusy(true);
    const r = await api('order_cancel', { order_id: orderId });
    setBusy(false);
    if (r.success) {
      setSelectedHistoryItem(null);
      showCancelNotif(orderPrice, 'Saldo telah dikembalikan ke akun kamu');
      fetchHistory();
      api('balance').then(res => res.success && setBalance(res.data.balance));
    } else {
      showToast('error', 'Gagal Batal', r.msg || 'Terjadi kesalahan saat membatalkan.');
    }
  };

  const createQris = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setCreatingQris(true);
    try {
      const r = await api('deposit_create', { amount: Number(depositAmount) });
      setCreatingQris(false);
      if (r.success && r.data) {
        const totalAmt = Number(r.data.total || r.data.amount || depositAmount);
        const creditAmt = Number(r.data.diterima || r.data.amount || depositAmount);
        const feeAmt = Number(r.data.fee || (totalAmt - creditAmt) || 0);
        const expiredAt = r.data.expired_at
          ? (isNaN(Number(r.data.expired_at)) ? new Date(r.data.expired_at).getTime() : Number(r.data.expired_at))
          : Date.now() + 20 * 60 * 1000;
        setQrisData({ ...r.data, actual_amount: totalAmt, credit_amount: creditAmt, fee_amount: feeAmt, expired_at: expiredAt });
      } else {
        showToast('error', 'Gagal', r.msg || 'Gagal membuat QRIS. Silakan cek kembali.');
      }
    } catch (e) {
      setCreatingQris(false);
      showToast('error', 'Error', 'Terjadi kesalahan jaringan.');
    }
  };

  const checkHistoryDeposit = async (depId) => {
    setBusy(true);
    const r = await api('deposit_status', { deposit_id: depId });
    setBusy(false);
    if (r.success && (r.status === 'paid' || r.data?.status === 'paid' || r.data?.status === 'success' || r.status === 'success')) {
      const creditAmt = selectedHistoryItem?.diterima || selectedHistoryItem?.base_amount || selectedHistoryItem?.amount || 0;
      setHistoryItems(prev => prev.map(h => h.id === depId ? { ...h, status: 'success' } : h));
      setSelectedHistoryItem(prev => prev ? { ...prev, status: 'success' } : prev);
      showPaymentSuccessNotif(creditAmt, 'Saldo berhasil masuk ke akun kamu!');
      fetchHistory();
      api('balance').then(res => res.success && setBalance(res.data.balance));
    } else {
      showToast('warning', 'Pending', 'Pembayaran belum masuk.');
    }
  };

  const cancelHistoryDeposit = async (depId, depAmount) => {
    setBusy(true);
    const r = await api('deposit_cancel', { deposit_id: depId });
    setBusy(false);
    if (r.success) {
      setSelectedHistoryItem(null);
      showCancelNotif(depAmount, 'Deposit telah dibatalkan');
      fetchHistory();
    } else {
      showToast('error', 'Gagal Batal', 'Gagal membatalkan transaksi.');
    }
  };

  const checkQrisPayment = async () => {
    if (!qrisData?.id) return;
    setBusy(true);
    const r = await api('deposit_status', { deposit_id: qrisData.id });
    setBusy(false);
    const paid = r.success && (r.status === 'paid' || r.data?.status === 'paid' || r.data?.status === 'success' || r.status === 'success');
    if (paid) {
      const creditAmt = qrisData.credit_amount || qrisData.actual_amount || 0;
      setBalance(r.new_balance || balance);
      setQrisData(null);
      setDepositAmount('');
      showPaymentSuccessNotif(creditAmt, 'Deposit berhasil masuk ke akun kamu!');
      api('balance').then(res => res.success && setBalance(res.data.balance));
      fetchHistory();
    } else {
      showToast('warning', 'Belum Masuk', 'Pembayaran belum terdeteksi. Pastikan sudah transfer.');
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    const r = await api('profile_update', { username });
    setSavingProfile(false);
    if (r.success) {
      showToast('success', 'Berhasil', r.msg);
    } else {
      showToast('error', 'Gagal', r.msg);
    }
  };

  const savePassword = async () => {
    if (profileNewPass.length < 6 || profileNewPass !== profileConfirmPass) return;
    setSavingPass(true);
    const r = await authApi('set-password', { currentPassword: curPass || undefined, newPassword: profileNewPass });
    setSavingPass(false);
    if (r.success) {
      setHasPassword(true);
      setCurPass(''); setProfileNewPass(''); setProfileConfirmPass('');
      showToast('success', 'Berhasil', r.msg || 'Password berhasil disimpan');
    } else {
      showToast('error', 'Gagal', r.msg);
    }
  };

  const filteredSvcs = useMemo(() => {
    return services.filter(s => s.service_name?.toLowerCase().includes(query.toLowerCase()));
  }, [services, query]);

  const filteredCountries = useMemo(() => {
    return countries.filter(c => c.name?.toLowerCase().includes(countryQuery.toLowerCase()));
  }, [countries, countryQuery]);

  const filteredPpob = useMemo(() => {
    return ppobItems.filter(p => p.name?.toLowerCase().includes(ppobQuery.toLowerCase()) || p.brand?.toLowerCase().includes(ppobQuery.toLowerCase()));
  }, [ppobItems, ppobQuery]);

  if (step === 'init') {
    return (
      <div className="auth-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (step === 'welcome') {
    return (
      <div className="auth-screen welcome-bg">
        <div className="welcome-wrapper floating">
          <div className="auth-logo-badge"><div className="auth-logo-dot" /><span>SISTEM ONLINE</span></div>
          <div className="walz-hero-logo">
            <img
              src="https://i.postimg.cc/Hx9QWWc3/walzshop-keren-light-97949c29.jpg"
              alt="WALZ SHOP"
              className="walz-hero-img"
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          <p className="logo-subtitle">LAYANAN DIGITAL PREMIUM</p>
        </div>

        <div className="welcome-card">
          <button className="btn btn-primary" onClick={() => setStep('register')} style={{ height: 60, fontSize: '1.05rem', borderRadius: 'var(--r-full)' }}>
            📝 Buat Akun Baru
          </button>
          <button className="btn btn-secondary" onClick={() => setStep('login')} style={{ height: 60, fontSize: '1.05rem', marginBottom: 0, borderRadius: 'var(--r-full)' }}>
            🔑 Masuk ke Akun
          </button>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="auth-screen welcome-bg">
        <div className="toast-container">
          {toast && (
            <div className="toast">
              <div className={`toast-icon ${toast.type}`}>
                {toast.type === 'error' && <IconCross />}
                {toast.type === 'success' && <IconCheck />}
                {toast.type === 'info' && <span style={{ fontSize: '18px' }}>ℹ️</span>}
                {toast.type === 'warning' && <IconWarning />}
              </div>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-msg">{toast.msg}</div>
              </div>
            </div>
          )}
        </div>

        <div className="auth-logo-circle-wrapper">
          <div className="header-logo-circle">
            <img
              src="https://i.postimg.cc/44h7sbq4/walzshop-chrome-light-95c938cb.jpg"
              alt="WALZ SHOP"
              className="header-logo-img-circle"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="header-logo-ring" />
          </div>
          <div className="auth-logo-text">WALZ <span>SHOP</span></div>
        </div>

        <div className="auth-card">
          <div className="auth-card-title">Login Kembali 👋</div>
          <div className="auth-card-sub">Masukkan email dan password akun kamu</div>
          <div className="input-field">
            <label>Alamat Email</label>
            <input type="email" value={email} placeholder="nama@email.com" onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="input-field">
            <label>Password</label>
            <div className="input-icon-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwInput}
                placeholder="••••••••"
                onChange={e => setPwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !busy && email && pwInput && loginWithPassword()}
              />
              <EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={loginWithPassword}
            disabled={!email || !pwInput || busy}
            style={{ height: 54, borderRadius: 'var(--r-full)', marginTop: 8 }}
          >
            {busy ? <><LoadingSpinner style={{ width: 18, height: 18 }} /> Memproses...</> : '🔑 Masuk Sekarang'}
          </button>
          <button className="btn-ghost" onClick={() => setStep('forgot')} style={{ color: 'var(--blue2)', marginBottom: 8 }}>
            Lupa Password?
          </button>
          <button className="btn-ghost" onClick={() => { setStep('welcome'); setEmail(''); setPwInput(''); }}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  if (step === 'register') {
    return (
      <div className="auth-screen welcome-bg">
        <div className="toast-container">
          {toast && (
            <div className="toast">
              <div className={`toast-icon ${toast.type}`}>
                {toast.type === 'error' && <IconCross />}
                {toast.type === 'success' && <IconCheck />}
                {toast.type === 'info' && <span style={{ fontSize: '18px' }}>ℹ️</span>}
                {toast.type === 'warning' && <IconWarning />}
              </div>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-msg">{toast.msg}</div>
              </div>
            </div>
          )}
        </div>
        <div className="auth-logo-small"><img src="https://i.postimg.cc/Hx9QWWc3/walzshop-keren-light-97949c29.jpg" alt="WALZ SHOP" className="auth-logo-img" onError={e => { e.target.style.display = 'none'; }} /></div>
        <div className="auth-card">
          <div className="auth-card-title">Daftar Akun Baru 🚀</div>
          <div className="auth-card-sub">Masukkan email aktif untuk menerima kode verifikasi</div>
          <div className="input-field">
            <label>Alamat Email</label>
            <input type="email" value={email} placeholder="nama@email.com"
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !busy && email && sendOtp(email, 'register')} />
          </div>
          <button className="btn btn-primary" onClick={() => sendOtp(email, 'register')} disabled={!email || busy} style={{ height: 54, borderRadius: 'var(--r-full)', marginTop: 8 }}>
            {busy ? <><LoadingSpinner style={{ width: 18, height: 18 }} /> Mengirim...</> : '✉️ Kirim Kode OTP'}
          </button>
          <button className="btn-ghost" onClick={() => { setStep('welcome'); setEmail(''); }}>
            ← Batal
          </button>
        </div>
      </div>
    );
  }

  if (step === 'register_otp' || step === 'forgot_otp') {
    const isReset = step === 'forgot_otp';
    const timerClass = countdown > 60 ? '' : countdown > 0 ? 'warning' : 'expired';
    return (
      <div className="auth-screen welcome-bg">
        <div className="toast-container">
          {toast && (
            <div className="toast">
              <div className={`toast-icon ${toast.type}`}>
                {toast.type === 'error' && <IconCross />}
                {toast.type === 'success' && <IconCheck />}
                {toast.type === 'info' && <span style={{ fontSize: '18px' }}>ℹ️</span>}
                {toast.type === 'warning' && <IconWarning />}
              </div>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-msg">{toast.msg}</div>
              </div>
            </div>
          )}
        </div>
        <div className="auth-logo-small"><img src="https://i.postimg.cc/Hx9QWWc3/walzshop-keren-light-97949c29.jpg" alt="WALZ SHOP" className="auth-logo-img" onError={e => { e.target.style.display = 'none'; }} /></div>
        <div className="auth-card">
          <div className="auth-card-title">Verifikasi OTP 📬</div>
          <div className="otp-info">Kode dikirim ke <strong>{email}</strong></div>
          <div className={`timer-bar ${timerClass}`}>
            <span className="timer-label">{countdown > 0 ? 'Kode berlaku' : 'Kode expired'}</span>
            <span className={`timer-time ${timerClass}`}>{countdown > 0 ? formatTime(countdown) : '00:00'}</span>
          </div>
          <div className="input-field">
            <label>Kode OTP (6 digit)</label>
            <input type="text" inputMode="numeric" maxLength={6} value={otpCode} placeholder="••••••"
              style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center' }}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && otpCode.length === 6 && !busy && verifyOtp()}
              disabled={countdown === 0} />
          </div>
          <button className="btn btn-primary" onClick={verifyOtp} disabled={otpCode.length !== 6 || busy || countdown === 0} style={{ borderRadius: 'var(--r-full)' }}>
            {busy ? <><LoadingSpinner style={{ width: 18, height: 18 }} /> Verifikasi...</> : '✅ Verifikasi OTP'}
          </button>
          <button className="btn btn-secondary" onClick={() => sendOtp(email, isReset ? 'reset' : 'register')} disabled={busy || countdown > 0} style={{ borderRadius: 'var(--r-full)' }}>
            {countdown > 0 ? `Kirim Ulang (${formatTime(countdown)})` : '🔄 Kirim Ulang OTP'}
          </button>
          <button className="btn-ghost" onClick={() => { setStep(isReset ? 'forgot' : 'register'); setOtpCode(''); }}>
            ← Ganti Email
          </button>
        </div>
      </div>
    );
  }

  if (step === 'register_setup') {
    const isMatch = newPass === confirmPass;
    const isValid = setupUser.length > 2 && newPass.length >= 6 && isMatch;
    return (
      <div className="auth-screen welcome-bg">
        <div className="toast-container">
          {toast && (
            <div className="toast">
              <div className={`toast-icon ${toast.type}`}>
                {toast.type === 'error' && <IconCross />}
                {toast.type === 'success' && <IconCheck />}
                {toast.type === 'info' && <span style={{ fontSize: '18px' }}>ℹ️</span>}
                {toast.type === 'warning' && <IconWarning />}
              </div>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-msg">{toast.msg}</div>
              </div>
            </div>
          )}
        </div>
        <div className="auth-logo-small"><img src="https://i.postimg.cc/Hx9QWWc3/walzshop-keren-light-97949c29.jpg" alt="WALZ SHOP" className="auth-logo-img" onError={e => { e.target.style.display = 'none'; }} /></div>
        <div className="auth-card">
          <div className="auth-card-title">Lengkapi Profil ✍️</div>
          <div className="auth-card-sub">Buat username unik dan password agar kedepannya bisa langsung login tanpa OTP.</div>
          <div className="input-field">
            <label>Username</label>
            <input type="text" value={setupUser} placeholder="Nama unik tanpa spasi" onChange={e => setSetupUser(e.target.value.replace(/\s/g, ''))} />
          </div>
          <div className="input-field">
            <label>Password Baru</label>
            <div className="input-icon-wrap">
              <input type={showNewPw ? 'text' : 'password'} value={newPass} placeholder="Min. 6 karakter" onChange={e => setNewPass(e.target.value)} />
              <EyeToggle show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
            </div>
          </div>
          <div className="input-field">
            <label>Konfirmasi Password</label>
            <div className="input-icon-wrap">
              <input type={showConfPw ? 'text' : 'password'} value={confirmPass} placeholder="Ulangi password" onChange={e => setConfirmPass(e.target.value)} />
              <EyeToggle show={showConfPw} onToggle={() => setShowConfPw(v => !v)} />
            </div>
          </div>
          {confirmPass && !isMatch && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>❌ Password tidak cocok</p>}
          {confirmPass && isMatch && newPass.length >= 6 && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: 12 }}>✅ Password cocok</p>}
          <button className="btn btn-primary" onClick={completeSetup} disabled={!isValid || busy} style={{ height: 54, borderRadius: 'var(--r-full)' }}>
            {busy ? <><LoadingSpinner style={{ width: 18, height: 18 }} /> Menyimpan...</> : '🚀 Mulai Gunakan Aplikasi'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'forgot') {
    return (
      <div className="auth-screen welcome-bg">
        <div className="toast-container">
          {toast && (
            <div className="toast">
              <div className={`toast-icon ${toast.type}`}>
                {toast.type === 'error' && <IconCross />}
                {toast.type === 'success' && <IconCheck />}
                {toast.type === 'info' && <span style={{ fontSize: '18px' }}>ℹ️</span>}
                {toast.type === 'warning' && <IconWarning />}
              </div>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-msg">{toast.msg}</div>
              </div>
            </div>
          )}
        </div>
        <div className="auth-logo-small"><img src="https://i.postimg.cc/Hx9QWWc3/walzshop-keren-light-97949c29.jpg" alt="WALZ SHOP" className="auth-logo-img" onError={e => { e.target.style.display = 'none'; }} /></div>
        <div className="auth-card">
          <div className="auth-card-title">Lupa Password 🔒</div>
          <div className="auth-card-sub">Masukkan email akun kamu yang pernah terdaftar untuk reset password.</div>
          <div className="input-field">
            <label>Email Terdaftar</label>
            <input type="email" value={email} placeholder="nama@email.com" onChange={e => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleForgotCheck} disabled={!email || busy} style={{ borderRadius: 'var(--r-full)' }}>
            {busy ? <><LoadingSpinner style={{ width: 18, height: 18 }} /> Memeriksa...</> : '📩 Lanjutkan'}
          </button>
          <button className="btn-ghost" onClick={() => setStep('login')}>
            ← Batal
          </button>
        </div>
      </div>
    );
  }

  if (step === 'reset_pw') {
    const isMatch = newPass === confirmPass;
    const isValid = newPass.length >= 6 && isMatch;
    return (
      <div className="auth-screen welcome-bg">
        <div className="toast-container">
          {toast && (
            <div className="toast">
              <div className={`toast-icon ${toast.type}`}>
                {toast.type === 'error' && <IconCross />}
                {toast.type === 'success' && <IconCheck />}
                {toast.type === 'info' && <span style={{ fontSize: '18px' }}>ℹ️</span>}
                {toast.type === 'warning' && <IconWarning />}
              </div>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-msg">{toast.msg}</div>
              </div>
            </div>
          )}
        </div>
        <div className="auth-logo-small"><img src="https://i.postimg.cc/Hx9QWWc3/walzshop-keren-light-97949c29.jpg" alt="WALZ SHOP" className="auth-logo-img" onError={e => { e.target.style.display = 'none'; }} /></div>
        <div className="auth-card">
          <div className="auth-card-title">Password Baru 🔐</div>
          <div className="auth-card-sub">Buat password baru untuk akun kamu</div>
          <div className="input-field">
            <label>Password Baru</label>
            <div className="input-icon-wrap">
              <input type={showNewPw ? 'text' : 'password'} value={newPass} placeholder="Min. 6 karakter" onChange={e => setNewPass(e.target.value)} />
              <EyeToggle show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
            </div>
          </div>
          <div className="input-field">
            <label>Konfirmasi Password</label>
            <div className="input-icon-wrap">
              <input type={showConfPw ? 'text' : 'password'} value={confirmPass} placeholder="Ulangi password" onChange={e => setConfirmPass(e.target.value)} />
              <EyeToggle show={showConfPw} onToggle={() => setShowConfPw(v => !v)} />
            </div>
          </div>
          {confirmPass && !isMatch && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>❌ Password tidak cocok</p>}
          {confirmPass && isMatch && newPass.length >= 6 && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: 12 }}>✅ Password cocok</p>}
          <button className="btn btn-primary" onClick={resetPassword} disabled={!isValid || busy} style={{ borderRadius: 'var(--r-full)' }}>
            {busy ? <><LoadingSpinner style={{ width: 18, height: 18 }} /> Menyimpan...</> : '💾 Simpan Password'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {cancelNotif && (
        <div className="cancel-notif-overlay" onClick={() => setCancelNotif(null)}>
          <div className="cancel-notif-card">
            <div className="cancel-notif-ripple" />
            <div className="cancel-notif-ripple delay" />
            <div className="cancel-notif-icon">
              <IconCross />
            </div>
            <div className="cancel-notif-title">Transaksi Dibatalkan</div>
            <div className="cancel-notif-subtitle">{cancelNotif.subtitle}</div>
            {cancelNotif.amount > 0 && (
              <div className="cancel-notif-amount">{fmt(cancelNotif.amount)}</div>
            )}
          </div>
        </div>
      )}

      {paymentSuccessNotif && (
        <div className="success-notif-overlay" onClick={() => setPaymentSuccessNotif(null)}>
          <div className="success-confetti-wrap">
            {[...Array(28)].map((_, i) => {
              const colors = ['#00e87a', '#4f8cff', '#ffb340', '#ff4060', '#00d4ff', '#a78bfa', '#f472b6', '#fb923c', '#34d399', '#60a5fa'];
              const color = colors[i % colors.length];
              const left = ((i * 3.7 + 1.5) % 97) + 1.5;
              const delay = (i * 0.09) % 2.1;
              const duration = 1.3 + (i % 6) * 0.22;
              const size = 6 + (i % 7) * 2;
              const isCircle = i % 4 !== 0;
              const isSquare = i % 4 === 0;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: '-24px',
                    width: isSquare ? size : isCircle ? size * 0.7 : size,
                    height: isSquare ? size * 0.55 : isCircle ? size * 0.7 : size * 0.45,
                    background: color,
                    borderRadius: isCircle ? '50%' : '3px',
                    animation: `confettiFall ${duration}s ${delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                    transform: `rotate(${(i * 53) % 360}deg)`,
                    opacity: 0.92,
                    boxShadow: `0 0 6px ${color}88`,
                  }}
                />
              );
            })}
          </div>
          <div className="success-notif-card" onClick={e => e.stopPropagation()}>
            <div className="success-notif-ripple" />
            <div className="success-notif-ripple delay1" />
            <div className="success-notif-ripple delay2" />
            <div className="success-notif-icon">
              <IconCheck />
            </div>
            <div className="success-notif-emoji">🎉</div>
            <div className="success-notif-title">Pembayaran Berhasil!</div>
            <div className="success-notif-subtitle">{paymentSuccessNotif.subtitle}</div>
            {paymentSuccessNotif.amount > 0 && (
              <div className="success-notif-amount">+{fmt(paymentSuccessNotif.amount)}</div>
            )}
            <div className="success-notif-tap">Ketuk di mana saja untuk menutup</div>
          </div>
        </div>
      )}
      <div className="toast-container">
        {toast && (
          <div className="toast">
            <div className={`toast-icon ${toast.type}`}>
              {toast.type === 'error' && <IconCross />}
              {toast.type === 'success' && <IconCheck />}
              {toast.type === 'info' && <span style={{ fontSize: '18px' }}>ℹ️</span>}
              {toast.type === 'warning' && <IconWarning />}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-msg">{toast.msg}</div>
            </div>
          </div>
        )}
      </div>

      <div className="app-header">
        <div className="header-row">
          <div className="header-brand">
            <div className="header-logo-wrap">
              <div className="header-logo-circle">
                <img
                  src="https://i.postimg.cc/44h7sbq4/walzshop-chrome-light-95c938cb.jpg"
                  alt="WALZ SHOP"
                  className="header-logo-img-circle"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="header-logo-ring" />
              </div>
              <div className="header-brand-text">WALZ <span>SHOP</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="theme-toggle" onClick={() => { setTab('activity'); setHasNewActivity(false); }} title="Riwayat">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SvgBell />
                {hasNewActivity && <div className="notif-dot" />}
              </div>
            </button>
            <button className="theme-toggle" onClick={toggleTheme} title="Ganti Tema">
              {theme === 'dark' ? <SvgSun /> : <SvgMoon />}
            </button>
          </div>
        </div>

        <div className="balance-card">
          <div className="balance-bg-shape"></div>
          <div className="balance-bg-shape2"></div>
          <div className="balance-content">
            <div className="balance-left">
              <div className="balance-label">Total Saldo <span className="balance-badge">Aktif</span></div>
              <div className="balance-amount">{fmt(balance)}</div>
              <div className="balance-user">
                <span className="user-icon">👤</span> {username || user?.email}
              </div>
            </div>
            <div className="balance-right">
              <button className="btn-topup-new" onClick={() => setTab('deposit')} style={{ whiteSpace: 'nowrap' }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="18"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Isi Saldo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="tab-content">
        {tab === 'virtual' && !order && (
          <div style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
            <div className="section-header-block">
              <h2>Layanan Virtual</h2>
              <span className="count">{services.length} layanan</span>
            </div>
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input value={query} placeholder="Cari layanan..." onChange={e => setQuery(e.target.value)} />
            </div>
            {filteredSvcs.length === 0 && !loadingSvcs ? (
              <div className="empty-state">
                <span className="icon">🔍</span>
                <p>Tidak ada layanan ditemukan</p>
              </div>
            ) : (
              <div className="service-grid">
                {filteredSvcs.map((s, i) => (
                  <button key={s.service_code} className="svc-card" style={{ animationDelay: `${(i % 15) * 0.03}s` }} onClick={() => openService(s)}>
                    <div className="svc-icon-wrap">
                      <img src={s.service_img} alt={s.service_name} className="svc-icon" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="svc-name">{s.service_name}</div>
                    <div className="svc-price">{s.price ? fmt(s.price) : '...'}</div>
                    <div className={`svc-stock ${s.stock > 0 ? 'text-green' : s.stock === null ? 'text-muted' : 'text-red'}`}>
                      {s.stock === null ? '...' : s.stock > 0 ? `${s.stock} total stok` : 'Habis'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'virtual' && order && (
          <div className="active-order-wrap">
            <div className="ao-header">
              <div className="ao-title">Pesanan Pending</div>
              <button className="ao-refresh" onClick={() => api('balance').then(r => r.success && setBalance(r.data.balance))}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
            <div className="ao-body">
              <div className="ao-row">
                <div className="ao-num-wrap" onClick={() => { navigator.clipboard.writeText(order.phone_number); showToast('success', 'Tersalin', 'Nomor disalin ke clipboard'); }}>
                  {getFlag(order.country)} {order.phone_number}
                  <svg width="18" height="18" fill="none" stroke="var(--text-3)" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ao-timer">{formatTime(orderExpiry)}</div>
              </div>
              <div className="ao-row">
                <div className="ao-prov-wrap">
                  <span style={{ fontSize: '1.2rem' }}>📡</span> {order.operator || 'Any'}
                </div>
                <div className="ao-price">{fmt(order.price)}</div>
              </div>

              <div className="ao-status-box">
                <div className="ao-status-top">
                  <div className="ao-svc-name">
                    <img src={order.service_img} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
                    {order.service_name}
                  </div>
                  {order.otp_code ? (
                    <div className="ao-status-text" style={{ color: 'var(--green)' }}>Selesai <IconCheck /></div>
                  ) : (
                    <div className="ao-status-text">Menunggu <IconClock /></div>
                  )}
                </div>

                {order.otp_code ? (
                  <div style={{ background: 'var(--green-soft)', padding: '16px', borderRadius: '12px', marginTop: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: 900, color: 'var(--green)', letterSpacing: '4px', textAlign: 'center' }}>{order.otp_code}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', textAlign: 'center', marginTop: '4px', fontWeight: 600 }}>{order.otp_msg}</div>
                  </div>
                ) : (
                  <div className="ao-status-desc">
                    {cancelCooldown > 0 ? `Tunggu ${formatTime(cancelCooldown)} sebelum klik batal.` : 'Kamu sekarang bisa membatalkan pesanan ini.'}
                  </div>
                )}
              </div>

              <div className="ao-actions">
                <button className="ao-btn ao-btn-lagi" onClick={() => setOrder(null)}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Beli lagi
                </button>
                {!order.otp_code && (
                  <button className="ao-btn ao-btn-batal" disabled={cancelCooldown > 0 || cancelingOrder} onClick={cancelOrder}>
                    {cancelingOrder ? <LoadingSpinner style={{ width: 18, height: 18 }} /> : <><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> Batal</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'ppob' && (
          <div style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
            <div className="section-header-block">
              <h2>PPOB & TOP UP GAME</h2>
            </div>

            {ppobError ? (
              <div className="maintenance-box">
                <IconWarning />
                <h3>Sistem Maintenance</h3>
                <p>{ppobError}<br />Silakan coba lagi nanti.</p>
                <button className="btn btn-secondary" onClick={fetchPpob}>🔄 Cek Kembali</button>
              </div>
            ) : (
              <>
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input value={ppobQuery} placeholder="Cari nama atau brand produk..." onChange={e => setPpobQuery(e.target.value)} />
                </div>
                {filteredPpob.length === 0 && !ppobLoading ? (
                  <div className="empty-state">
                    <span className="icon">🔍</span>
                    <p>Tidak ada produk ditemukan</p>
                  </div>
                ) : (
                  <div className="service-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {filteredPpob.map((p, i) => (
                      <button key={p.code} className="svc-card" style={{ animationDelay: `${(i % 15) * 0.03}s`, alignItems: 'flex-start', textAlign: 'left', padding: '16px' }}>
                        <div className="svc-name" style={{ textAlign: 'left', fontSize: '0.82rem', marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: 8, textTransform: 'capitalize' }}>{p.brand} - {p.category}</div>
                        <div className="svc-price" style={{ fontSize: '0.9rem' }}>{fmt(p.price)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'deposit' && (
          <div className="deposit-wrap" style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
            <div className="section-header-block">
              <h2>Top Up Saldo</h2>
            </div>
            {!qrisData ? (
              <div className="deposit-card">
                <div className="input-field">
                  <label>Nominal Deposit</label>
                  <input type="number" value={depositAmount} placeholder="Contoh: 10000" onChange={e => setDepositAmount(e.target.value)} />
                </div>
                <div className="deposit-amounts">
                  {[2000, 5000, 10000, 20000, 50000, 100000].map(amt => (
                    <button key={amt} className={`amount-chip ${depositAmount == amt ? 'active' : ''}`} onClick={() => setDepositAmount(String(amt))}>
                      {fmt(amt).replace('Rp ', 'Rp')}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={createQris} disabled={!depositAmount || Number(depositAmount) < 2000 || creatingQris} style={{ marginTop: 12, borderRadius: 'var(--r-full)' }}>
                  {creatingQris ? <><LoadingSpinner style={{ width: 16, height: 16 }} /> Membuat QRIS...</> : '📲 Buat QRIS Pembayaran'}
                </button>
              </div>
            ) : (
              <div className="qris-topup-wrap">
                <div className="qris-blue-card">
                  {qrisCountdown > 0 ? (
                    <div className="qris-expiry-bar">
                      <div className="qris-expiry-info">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
                        <span>Batas Waktu Bayar</span>
                      </div>
                      <div className="qris-expiry-digits">
                        <span className="qris-digit-box">{String(Math.floor(qrisCountdown / 60)).padStart(2, '0')[0]}</span>
                        <span className="qris-digit-box">{String(Math.floor(qrisCountdown / 60)).padStart(2, '0')[1]}</span>
                        <span className="qris-digit-sep">:</span>
                        <span className="qris-digit-box">{String(qrisCountdown % 60).padStart(2, '0')[0]}</span>
                        <span className="qris-digit-box">{String(qrisCountdown % 60).padStart(2, '0')[1]}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="qris-expiry-bar qris-expiry-expired">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" /></svg>
                      <span>Waktu Pembayaran Habis</span>
                    </div>
                  )}
                  <div className="qris-blue-header-row">
                    <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 8px', fontWeight: 900, fontSize: '0.9rem' }}>QRIS</span>
                    <span style={{ fontWeight: 800, fontSize: '0.7rem', opacity: 0.9 }}>GPN ✦</span>
                  </div>
                  <div className="qris-blue-title">CINDIGITAL GROUP</div>
                  <div className="qris-blue-nmid">NMID: ID2025429755718</div>
                  <div className="qris-blue-qr-wrap">
                    <img src={qrisData.qr_image || qrisData.qr_url} alt="QRIS" onError={e => { e.target.style.opacity = '0.2'; }} />
                  </div>
                  <div className="qris-blue-total">
                    <span>Total Bayar</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>{qrisData.actual_amount.toLocaleString('id-ID')} IDR</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, padding: '12px 18px 0' }}>
                    <button className="btn qris-btn-cancel" onClick={async () => {
                      const depId = qrisData.id; const depAmt = qrisData.actual_amount || 0;
                      setQrisData(null); setDepositAmount('');
                      if (depId) { await api('deposit_cancel', { deposit_id: depId }); showCancelNotif(depAmt, 'Deposit telah dibatalkan'); }
                    }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      Batalkan
                    </button>
                    <button className="btn qris-btn-download" onClick={() => downloadQrisImage(qrisData.qr_image || qrisData.qr_url)}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh QRIS
                    </button>
                  </div>
                  <div className="qris-scan-hint" style={{ padding: '10px 18px 14px' }}>
                    Sistem memverifikasi pembayaran secara otomatis
                  </div>
                </div>

                <div className="qris-summary-card">
                  <div className="qris-summary-row">
                    <span>Saldo Masuk</span>
                    <span style={{ color: 'var(--green)', fontWeight: 900 }}>{qrisData.credit_amount.toLocaleString('id-ID')} IDR</span>
                  </div>
                  {qrisData.fee_amount > 0 && (
                    <div className="qris-summary-row">
                      <span>Biaya Admin</span>
                      <span style={{ color: 'var(--amber)' }}>{qrisData.fee_amount.toLocaleString('id-ID')} IDR</span>
                    </div>
                  )}
                  <div className="qris-summary-row qris-summary-total">
                    <span>Total Bayar</span>
                    <span>{qrisData.actual_amount.toLocaleString('id-ID')} IDR</span>
                  </div>
                  <button className="btn btn-primary qris-cek-btn" onClick={checkQrisPayment} disabled={busy}>
                    {busy ? <LoadingSpinner style={{ width: 15, height: 15 }} /> : (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {busy ? 'Mengecek...' : 'Cek Pembayaran'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="activity-wrap" style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
            <div className="section-header-block">
              <h2>Riwayat Aktivitas</h2>
            </div>
            {historyItems.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: 60 }}>
                <span className="icon" style={{ fontSize: '3rem' }}>📋</span>
                <p style={{ marginTop: 12, fontWeight: 600 }}>Belum ada transaksi</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 4 }}>Transaksi kamu akan muncul di sini</p>
              </div>
            ) : (
              <div className="history-list">
                {historyItems.map((item, i) => {
                  const isCompleted = item.status === 'completed' || item.status === 'success' || item.status === 'paid';
                  const isCanceled = item.status === 'canceled' || item.status === 'cancel';
                  const statusClass = isCompleted ? 'completed' : isCanceled ? 'canceled' : 'pending';
                  const statusLabel = isCompleted ? 'Berhasil' : isCanceled ? 'Batal' : 'Pending';

                  return (
                    <div key={i} className="history-card" style={{ animationDelay: `${(i % 15) * 0.03}s` }} onClick={() => setSelectedHistoryItem(item)}>
                      <div className="history-icon">
                        {item.itemType === 'order' ? <SvgProduct /> : <SvgTopUp />}
                      </div>
                      <div className="history-info">
                        <div className="history-title">
                          {item.itemType === 'order' ? `${item.service_name || 'Virtual Number'} - ${item.operator || 'Any'}` : `Deposit Saldo QRIS`}
                        </div>
                        <div className="history-date">
                          {formatReceiptDate(item.timestamp)}
                        </div>
                      </div>
                      <div className={`history-status ${statusClass}`}>
                        <div className="history-amt">
                          {item.itemType === 'deposit' ? '+' : '-'}{fmt(item.itemType === 'deposit' ? (item.diterima || item.base_amount || item.amount || item.price) : (item.amount || item.price))}
                        </div>
                        {item.itemType === 'deposit' && (item.total || item.amount) > (item.diterima || item.base_amount) && (
                          <div className="history-admin-fee">Bayar: {(item.total || item.amount || 0).toLocaleString('id-ID')} IDR</div>
                        )}
                        <span>{statusLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="profile-wrap" style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              borderRadius: 20,
              padding: '28px 20px 24px',
              margin: '0 0 20px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: '3px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 900, color: '#fff',
                margin: '0 auto 12px',
                backdropFilter: 'blur(4px)',
              }}>
                {username ? username[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {username || 'Pengguna'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                {user?.email}
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <SvgProfile />
                </span> Info Akun
              </div>
              <div className="profile-section-body">
                <div className="input-field">
                  <label>Username</label>
                  <input type="text" value={username} placeholder="Nama unik tampilan" onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} maxLength={30} />
                </div>
                <div className="input-field">
                  <label>Email</label>
                  <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.45, cursor: 'not-allowed' }} />
                </div>
                <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile} style={{ borderRadius: 'var(--r-full)', marginTop: 8 }}>
                  {savingProfile ? <><LoadingSpinner style={{ width: 16, height: 16 }} /> Menyimpan...</> : '💾 Simpan Profil'}
                </button>
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="18"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </span> {hasPassword ? 'Ganti Password' : 'Atur Password'}
              </div>
              <div className="profile-section-body">
                {hasPassword && (
                  <div className="input-field">
                    <label>Password Saat Ini</label>
                    <div className="input-icon-wrap">
                      <input type={showCurPass ? 'text' : 'password'} value={curPass} placeholder="••••••••" onChange={e => setCurPass(e.target.value)} />
                      <EyeToggle show={showCurPass} onToggle={() => setShowCurPass(v => !v)} />
                    </div>
                  </div>
                )}
                <div className="input-field">
                  <label>Password Baru</label>
                  <div className="input-icon-wrap">
                    <input type={showNewPass ? 'text' : 'password'} value={profileNewPass} placeholder="Min. 6 karakter" onChange={e => setProfileNewPass(e.target.value)} />
                    <EyeToggle show={showNewPass} onToggle={() => setShowNewPass(v => !v)} />
                  </div>
                </div>
                <div className="input-field">
                  <label>Konfirmasi Password</label>
                  <div className="input-icon-wrap">
                    <input type={showProfileConfPass ? 'text' : 'password'} value={profileConfirmPass} placeholder="Ulangi password baru" onChange={e => setProfileConfirmPass(e.target.value)} />
                    <EyeToggle show={showProfileConfPass} onToggle={() => setShowProfileConfPass(v => !v)} />
                  </div>
                </div>
                {profileConfirmPass && profileNewPass !== profileConfirmPass && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>❌ Password tidak cocok</p>}
                {profileConfirmPass && profileNewPass === profileConfirmPass && profileNewPass.length >= 6 && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: 12 }}>✅ Password cocok</p>}
                <button className="btn btn-primary" onClick={savePassword} disabled={savingPass || profileNewPass.length < 6 || profileNewPass !== profileConfirmPass || (hasPassword && !curPass)} style={{ borderRadius: 'var(--r-full)', marginTop: 8 }}>
                  {savingPass ? <><LoadingSpinner style={{ width: 16, height: 16 }} /> Menyimpan...</> : '🔐 Simpan Password'}
                </button>
              </div>
            </div>

            <div style={{ padding: '0 0 8px' }}>
              <button className="btn btn-danger" onClick={logout} style={{ marginBottom: 0, borderRadius: 'var(--r-full)', width: '100%' }}>🚪 Keluar dari Akun</button>
            </div>
            <div style={{ height: 24 }} />
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'virtual' ? 'active' : ''}`} onClick={() => { setTab('virtual'); setOrder(null); }}>
          <div className="nav-icon-wrap"><SvgProduct /></div>
          <span>Produk</span>
        </button>
        <button className={`nav-item ${tab === 'ppob' ? 'active' : ''}`} onClick={() => setTab('ppob')}>
          <div className="nav-icon-wrap"><SvgPPOB /></div>
          <span>PPOB</span>
        </button>
        <button className={`nav-item ${tab === 'deposit' ? 'active' : ''}`} onClick={() => setTab('deposit')}>
          <div className="nav-icon-wrap"><SvgTopUp /></div>
          <span>Top Up</span>
        </button>
        <button className={`nav-item ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          <div className="nav-icon-wrap"><SvgProfile /></div>
          <span>Profil</span>
        </button>
      </nav>

      {selectedHistoryItem && (
        <div className="receipt-overlay">
          <div className="receipt-nav">
            <div className="receipt-nav-back" onClick={() => setSelectedHistoryItem(null)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Kembali
            </div>
            <div style={{ flex: 1, textAlign: 'center', marginLeft: '-24px', fontWeight: 800 }}>Payment</div>
          </div>

          <div className={`receipt-header-bg ${selectedHistoryItem.status === 'completed' || selectedHistoryItem.status === 'success' || selectedHistoryItem.status === 'paid' ? 'completed' : selectedHistoryItem.status === 'canceled' || selectedHistoryItem.status === 'cancel' ? 'canceled' : 'pending'}`}>
            <div className="receipt-icon-circle">
              {selectedHistoryItem.status === 'completed' || selectedHistoryItem.status === 'success' || selectedHistoryItem.status === 'paid' ? <IconCheck /> : selectedHistoryItem.status === 'canceled' || selectedHistoryItem.status === 'cancel' ? <IconCross /> : <IconClock />}
            </div>
            <div className="receipt-status-text">
              {selectedHistoryItem.status === 'completed' || selectedHistoryItem.status === 'success' || selectedHistoryItem.status === 'paid' ? 'Transaksi Berhasil' : selectedHistoryItem.status === 'canceled' || selectedHistoryItem.status === 'cancel' ? 'Transaksi Dibatalkan' : 'Transaksi Pending'}
            </div>
            <div className="receipt-date-text">{formatReceiptDate(selectedHistoryItem.timestamp)}</div>
          </div>

          <div className="receipt-card">
            <div className="receipt-total-label">Total Transaksi</div>
            <div className="receipt-total-value">{(selectedHistoryItem.total || selectedHistoryItem.amount || selectedHistoryItem.price || 0).toLocaleString('id-ID')} IDR</div>

            {selectedHistoryItem.itemType === 'deposit' && (selectedHistoryItem.diterima || selectedHistoryItem.base_amount) && (selectedHistoryItem.total || selectedHistoryItem.amount) > (selectedHistoryItem.diterima || selectedHistoryItem.base_amount) && (
              <div className="receipt-saldo-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Saldo masuk&nbsp;<strong>{(selectedHistoryItem.diterima || selectedHistoryItem.base_amount || 0).toLocaleString('id-ID')} IDR</strong>
              </div>
            )}

            <div className="receipt-box">
              <div className="receipt-box-icon">
                {selectedHistoryItem.itemType === 'order' ? <SvgProduct /> : <SvgTopUp />}
              </div>
              <div className="receipt-box-info">
                <div className="receipt-box-title">{selectedHistoryItem.itemType === 'order' ? selectedHistoryItem.service_name : 'Deposit Saldo'}</div>
                <div className="receipt-box-sub">{selectedHistoryItem.itemType === 'order' ? `${selectedHistoryItem.country || ''} / ${selectedHistoryItem.operator || 'Any'}` : 'QRIS / DANA'}</div>
              </div>
            </div>

            <div className="receipt-row receipt-row-id">
              <div className="receipt-row-label">ID Reff</div>
              <div className="receipt-id-wrap">
                <span className="receipt-id-text">{selectedHistoryItem.id}</span>
                <button className="receipt-copy-btn" onClick={() => { navigator.clipboard.writeText(selectedHistoryItem.id); showToast('success', 'Tersalin', 'ID berhasil disalin'); }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Salin
                </button>
              </div>
            </div>
            <div className="receipt-row">
              <div className="receipt-row-label">Waktu transaksi</div>
              <div className="receipt-row-value">{formatReceiptDate(selectedHistoryItem.timestamp)}</div>
            </div>
            {selectedHistoryItem.itemType === 'order' && selectedHistoryItem.number && (
              <div className="receipt-row">
                <div className="receipt-row-label">Nomor Telp</div>
                <div className="receipt-row-value">{selectedHistoryItem.number}</div>
              </div>
            )}

            {selectedHistoryItem.itemType === 'deposit' && (selectedHistoryItem.status === 'pending' || selectedHistoryItem.status === 'waiting') && selectedHistoryItem.qr_image && (
              <div className="qris-blue-card">
                {depositCountdown > 0 && (
                  <div className="qris-expiry-bar">
                    <div className="qris-expiry-info">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
                      <span>Batas Waktu Bayar</span>
                    </div>
                    <div className="qris-expiry-digits">
                      <span className="qris-digit-box">{String(Math.floor(depositCountdown / 60)).padStart(2, '0')[0]}</span>
                      <span className="qris-digit-box">{String(Math.floor(depositCountdown / 60)).padStart(2, '0')[1]}</span>
                      <span className="qris-digit-sep">:</span>
                      <span className="qris-digit-box">{String(depositCountdown % 60).padStart(2, '0')[0]}</span>
                      <span className="qris-digit-box">{String(depositCountdown % 60).padStart(2, '0')[1]}</span>
                    </div>
                  </div>
                )}
                {depositCountdown === 0 && (
                  <div className="qris-expiry-bar qris-expiry-expired">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" /></svg>
                    <span>Waktu Pembayaran Habis</span>
                  </div>
                )}
                <div className="qris-blue-header-row">
                  <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 8px', fontSize: '0.9rem' }}>QRIS</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.9, letterSpacing: '0.05em' }}>GPN ✦</div>
                </div>
                <div className="qris-blue-title">CINDIGITAL GROUP</div>
                <div className="qris-blue-nmid">NMID: ID2025429755718</div>
                <div className="qris-blue-qr-wrap">
                  <img src={selectedHistoryItem.qr_image} alt="QRIS" />
                </div>
                <div className="qris-blue-total">
                  <span>Total Bayar</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>{(selectedHistoryItem.total || selectedHistoryItem.amount || 0).toLocaleString('id-ID')} IDR</span>
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '12px 18px 0' }}>
                  <button className="btn qris-btn-cancel" onClick={() => { const depId = selectedHistoryItem.id; const depAmt = selectedHistoryItem.total || selectedHistoryItem.amount || 0; setSelectedHistoryItem(null); cancelHistoryDeposit(depId, depAmt); }} disabled={busy}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Batalkan
                  </button>
                  <button className="btn qris-btn-download" onClick={() => downloadQrisImage(selectedHistoryItem.qr_image)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Unduh QRIS
                  </button>
                </div>
                <div className="qris-scan-hint" style={{ padding: '10px 18px 16px' }}>Sistem memverifikasi pembayaran secara otomatis</div>
              </div>
            )}

            <div className="receipt-divider"></div>

            <div className="receipt-row">
              <div className="receipt-row-label">Nominal</div>
              <div className="receipt-row-value">{(selectedHistoryItem.diterima || selectedHistoryItem.base_amount || selectedHistoryItem.price || 0).toLocaleString('id-ID')} IDR</div>
            </div>

            {selectedHistoryItem.itemType === 'deposit' && (
              <div className="receipt-row">
                <div className="receipt-row-label">Biaya Admin</div>
                <div className="receipt-row-value" style={{ color: (selectedHistoryItem.fee !== undefined ? selectedHistoryItem.fee : ((selectedHistoryItem.total || selectedHistoryItem.amount || 0) - (selectedHistoryItem.diterima || selectedHistoryItem.base_amount || 0))) > 0 ? 'var(--amber)' : 'var(--text)' }}>
                  {(selectedHistoryItem.fee !== undefined ? selectedHistoryItem.fee : ((selectedHistoryItem.total || selectedHistoryItem.amount || 0) - (selectedHistoryItem.diterima || selectedHistoryItem.base_amount || 0))).toLocaleString('id-ID')} IDR
                </div>
              </div>
            )}

            <div className="receipt-row" style={{ color: 'var(--blue2)', fontWeight: 800 }}>
              <div className="receipt-row-label" style={{ color: 'var(--blue2)' }}>Total Pembayaran</div>
              <div className="receipt-row-value">{(selectedHistoryItem.total || selectedHistoryItem.amount || selectedHistoryItem.price || 0).toLocaleString('id-ID')} IDR</div>
            </div>

            <div className="receipt-footer-text">
              Gateway pembayaran oleh <strong>RumahOTP</strong>
            </div>

            {selectedHistoryItem.itemType === 'order' && selectedHistoryItem.status === 'waiting' && (
              <div className="receipt-actions">
                <button className="btn btn-secondary" disabled={busy} onClick={() => {
                  showModal('warning', 'Batalkan Pesanan?', 'Saldo akan dikembalikan ke akun kamu secara otomatis.',
                    () => cancelHistoryOrder(selectedHistoryItem.id, Number(selectedHistoryItem.price)));
                }}>Batalkan</button>
                <button className="btn btn-primary" style={{ marginBottom: 0 }} disabled={busy} onClick={() => setSelectedHistoryItem(null)}>Tutup</button>
              </div>
            )}

            {selectedHistoryItem.itemType === 'deposit' && selectedHistoryItem.status === 'pending' && (
              <div className="receipt-actions" style={{ marginTop: 12 }}>
                <button className="btn btn-secondary" disabled={busy} onClick={() => checkHistoryDeposit(selectedHistoryItem.id)}>
                  {busy ? 'Mengecek...' : 'Cek Pembayaran'}
                </button>
                <button className="btn btn-primary" style={{ marginBottom: 0 }} onClick={() => setSelectedHistoryItem(null)}>Tutup</button>
              </div>
            )}

            {selectedHistoryItem.status !== 'pending' && selectedHistoryItem.status !== 'waiting' && (
              <div className="receipt-actions">
                <button className="btn btn-secondary" onClick={() => window.open('https://rumahotp.io', '_blank')}>Support</button>
                <button className="btn btn-primary" style={{ marginBottom: 0 }} onClick={() => setSelectedHistoryItem(null)}>Selesai</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`sheet-overlay ${showSheet ? 'open' : ''}`} onClick={() => setShowSheet(false)} />
      <div className={`bottom-sheet ${showSheet ? 'open' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-svc-row">
            <div className="sheet-svc-icon">
              {selectedSvc?.service_img && <img src={selectedSvc.service_img} alt="" />}
            </div>
            <div style={{ flex: 1 }}>
              <div className="sheet-svc-name">{selectedSvc?.service_name}</div>
              <div className="sheet-title">Pilih Server Negara</div>
            </div>
          </div>
          <div className="sheet-search">
            <input type="text" placeholder="Cari negara (Contoh: Indonesia)" value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} />
          </div>
        </div>
        <div className="sheet-body">
          {filteredCountries.length === 0 && !loadingCountries ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <span className="icon">🌐</span>
              <p>Tidak ada stok untuk pencarian tersebut</p>
            </div>
          ) : (
            filteredCountries.map(c => {
              const totalStock = c.available.length;
              const isExpanded = expandedCountry === c.number_id;

              return (
                <div key={c.number_id || c.name} className="country-wrapper">
                  <div className={`country-item ${isExpanded ? 'selected' : ''}`} onClick={() => setExpandedCountry(isExpanded ? null : c.number_id)}>
                    <span className="country-flag">{getFlag(c.name)}</span>
                    <span className="country-name">{c.name}</span>
                    <div className="country-right">
                      <div className="country-price">Mulai {fmt(c.available[0]?.price)}</div>
                      <div className={`country-stock ${totalStock > 3 ? 'text-green' : totalStock > 0 ? 'text-amber' : 'text-red'}`}>
                        {totalStock > 0 ? `${totalStock} server` : 'Habis'}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="provider-list">
                      {c.available.map(prov => (
                        <div key={prov.provider_id} className="provider-item">
                          <div className="provider-info">
                            <span className="provider-id">ID: {prov.provider_id}</span>
                            <span className="provider-price">{fmt(prov.price)}</span>
                          </div>
                          <button className="btn-order" disabled={loadingOperators} onClick={() => handleOrderClick(c, prov)}>
                            {loadingOperators && selectedOrderContext?.provider?.provider_id === prov.provider_id ? <LoadingSpinner style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Pilih'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {modal.show && (
        <div className="modal-overlay open" onClick={closeModal}>
          <div className="modal-content popIn" onClick={e => e.stopPropagation()} style={{ padding: '28px 24px' }}>
            <div className={`modal-svg-wrap ${modal.type}`}>
              {modal.type === 'warning' && <IconWarning />}
              {modal.type === 'error' && <IconCross />}
              {modal.type === 'success' && <IconCheck />}
              {modal.type === 'info' && <span style={{ fontSize: '1.4rem' }}>ℹ️</span>}
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: 8 }}>{modal.title}</h3>
            <p style={{ textAlign: 'center' }}>{modal.msg}</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Batal</button>
              {modal.onConfirm && (
                <button className="btn btn-primary" style={{ marginBottom: 0 }} onClick={() => { modal.onConfirm(); closeModal(); }}>Lanjutkan</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`modal-overlay ${showOperatorModal ? 'open' : ''}`} onClick={() => setShowOperatorModal(false)}>
        <div className={`modal-content ${showOperatorModal ? 'popIn' : ''}`} onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.15rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Pilih Operator</h3>
          {loadingOperators ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
              <LoadingSpinner />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Memuat daftar operator...</span>
            </div>
          ) : (
            <div className="operator-grid">
              {operators.map(op => (
                <button key={op.id || op.name} className="operator-card" onClick={() => confirmOrder(op)}>
                  <OperatorIcon name={op.name} />
                  <span>{op.name === 'any' ? 'Any / Semua' : op.name}</span>
                </button>
              ))}
            </div>
          )}
          <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%', height: 44, borderRadius: 'var(--r-full)' }} onClick={() => setShowOperatorModal(false)}>
            Batal
          </button>
        </div>
      </div>
    </>
  );
}