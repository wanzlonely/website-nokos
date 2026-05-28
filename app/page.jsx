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
  if(!ts) return '-';
  const n = Number(ts);
  if(isNaN(n)) return '-';
  const d = new Date(n);
  if(isNaN(d.getTime())) return '-';
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
  return `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2,'0')}.${d.getMinutes().toString().padStart(2,'0')} WIB`;
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
    <rect x="5" y="2" width="14" height="20" rx="3" fill="currentColor" fillOpacity="0.15"/>
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
  </svg>
);
const SvgPPOB = () => (
  <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
    <rect x="2" y="6" width="20" height="12" rx="4" fill="currentColor" fillOpacity="0.15"/>
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 12h4m-2-2v4m8-2h.01M16 10h.01"/>
  </svg>
);
const SvgTopUp = () => (
  <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
    <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" fillOpacity="0.15"/>
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 14h3M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
  </svg>
);
const SvgProfile = () => (
  <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
    <circle cx="12" cy="8" r="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2"/>
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
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
  const slug = name ? name.toLowerCase().replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'') : '';
  const imgUrl = slug && name !== 'any' ? `https://assets.cindigital.id/operators/${slug}.png` : null;
  return (
    <div className="operator-icon-placeholder">
      {imgUrl && !imgFailed ? (
        <img src={imgUrl} alt={name} style={{ width:'100%', height:'100%', objectFit:'contain', padding:'3px' }} onError={() => setImgFailed(true)} />
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
        } catch (error) {}
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
        } catch (error) {}
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
        } catch (error) {}
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
    } catch(e) {
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
    } catch(e) {
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
    } catch(e) {
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
    if(r.success) {
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
    if(r.success && (r.status === 'paid' || r.data?.status === 'paid' || r.data?.status === 'success' || r.status === 'success')) {
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
    if(r.success) {
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
              src="https://i.postimg.cc/Z5FsJPm8/file-00000000282871f78dd0749d93f64068.png"
              alt="WALZ SHOP"
              className="walz-hero-img"
              onError={e => { e.target.style.display='none'; }}
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
                {toast.type === 'info' && <span style={{fontSize: '18px'}}>ℹ️</span>}
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
              src="https://i.postimg.cc/Z5FsJPm8/file-00000000282871f78dd0749d93f64068.png"
              alt="WALZ SHOP"
              className="header-logo-img-circle"
              onError={e => { e.target.style.display='none'; }}
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
              <input type={showPw ? 'text' : 'password'} value={pwInput} placeholder="••••••••"
                onChange={e => setPwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !busy && email && pwInput && loginWithPassword()} />
              <EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={loginWithPassword} disabled={!email || !pwInput || busy} style={{ height: 54, borderRadius: 'var(--r-full)', marginTop: 8 }}>
            {busy ? <><LoadingSpinner style={{width:18, height:18}} /> Memproses...</> : '🔑 Masuk Sekarang'}
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
                {toast.type === 'info' && <span style={{fontSize: '18px'}}>ℹ️</span>}
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
              src="https://i.postimg.cc/Z5FsJPm8/file-00000000282871f78dd0749d93f64068.png"
              alt="WALZ SHOP"
              className="header-logo-img-circle"
              onError={e => { e.target.style.display='none'; }}
            />
            <div className="header-logo-ring" />
          </div>
          <div className="auth-logo-text">WALZ <span>SHOP</span></div>
        </div>
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
            {busy ? <><LoadingSpinner style={{width:18, height:18}} /> Mengirim...</> : '✉️ Kirim Kode OTP'}
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
                {toast.type === 'info' && <span style={{fontSize: '18px'}}>ℹ️</span>}
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
              src="https://i.postimg.cc/Z5FsJPm8/file-00000000282871f78dd0749d93f64068.png"
              alt="WALZ SHOP"
              className="header-logo-img-circle"
              onError={e => { e.target.style.display='none'; }}
            />
            <div className="header-logo-ring" />
          </div>
          <div className="auth-logo-text">WALZ <span>SHOP</span></div>
        </div>
        <div className="auth-card">
          <div className="auth-card-title">Verifikasi OTP 📬</div>
          <div className="otp-info">Kode dikirim ke <strong>{email}</strong></div>
          <div className={`timer-bar ${timerClass}`}>
            <span className="timer-label">{countdown > 0 ? 'Kode berlaku' : '