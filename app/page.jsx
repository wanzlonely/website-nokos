'use client';
import { useState, useEffect, useRef, useMemo } from 'react';

const api = async (endpoint, payload = {}) => {
  const res = await fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, ...payload }),
    credentials: 'include',
  });
  return res.json();
};
const authApi = async (path, payload) => {
  const res = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return res.json();
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

function LoadingSpinner() {
  return <div className="loading-spinner" />;
}

const IconSun = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
const IconMoon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const IconEdit = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconLogin = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
const IconMail = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconSend = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconRefresh = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconCheckCircle = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconLock = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconSave = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconLogout = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconCart = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconCopy = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconQR = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconEye = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const SvgProduct = () => <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>;
const SvgPPOB = () => <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/></svg>;
const SvgTopUp = () => <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M2 10h20"/></svg>;
const SvgProfile = () => <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const IconCheck = () => <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>;
const IconCross = () => <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>;
const IconWarning = () => <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>;
const IconInfo = () => <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01"/></svg>;

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" className="eye-btn" onClick={onToggle} tabIndex={-1}>
      {show ? <IconEyeOff /> : <IconEye />}
    </button>
  );
}

export default function Page() {
  const [theme, setTheme] = useState('dark');
  const [step, setStep] = useState('init');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
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
  const [loadingSvcs, setLoadingSvcs] = useState(true);

  const [selectedSvc, setSelectedSvc] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [ordering, setOrdering] = useState(false);

  const [order, setOrder] = useState(null);
  const [checkingSms, setCheckingSms] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [qrisData, setQrisData] = useState(null);
  const [creatingQris, setCreatingQris] = useState(false);
  const [checkingDeposit, setCheckingDeposit] = useState(false);
  const [cancelingDeposit, setCancelingDeposit] = useState(false);
  const [depositCooldown, setDepositCooldown] = useState(0);

  const [curPass, setCurPass] = useState('');
  const [profileNewPass, setProfileNewPass] = useState('');
  const [profileConfirmPass, setProfileConfirmPass] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);

  const [ppobItems, setPpobItems] = useState([]);
  const [ppobLoading, setPpobLoading] = useState(false);
  const [ppobError, setPpobError] = useState('');
  const [ppobQuery, setPpobQuery] = useState('');

  const [modal, setModal] = useState({ show: false, type: 'info', title: '', msg: '', onConfirm: null });

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
    let active = true;
    api('balance').then(r => {
      if (!active) return;
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
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (step !== 'app') return;
    setLoadingSvcs(true);
    api('services').then(r => {
      if (r.success && Array.isArray(r.data)) {
        const base = r.data.map(s => ({ ...s, price: null, stock: null }));
        setServices(base);
        setLoadingSvcs(false);
      } else {
        setLoadingSvcs(false);
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
    if (depositCooldown <= 0) return;
    const cd = setInterval(() => {
      setDepositCooldown(prev => prev <= 1 ? 0 : prev - 1);
    }, 1000);
    return () => clearInterval(cd);
  }, [depositCooldown]);

  useEffect(() => {
    if (!showSheet) { 
      setSelectedCountry(null); 
      setCountries([]); 
      setCountryQuery(''); 
    }
  }, [showSheet]);

  const fetchPpob = async () => {
    setPpobLoading(true);
    setPpobError('');
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
      showModal('warning', 'Perhatian', 'Harap masukkan alamat email terlebih dahulu.');
      return;
    }
    setBusy(true);
    const check = await api('check_email', { email });
    if (!check.exists) {
      setBusy(false);
      showModal('warning', 'Tidak Terdaftar', 'Email ini belum terdaftar. Silakan buat akun baru terlebih dahulu.');
      return;
    }
    sendOtp(email, 'reset');
  };

  const sendOtp = async (targetEmail, mode = 'register') => {
    if (!targetEmail) return;
    setBusy(true);
    const r = await authApi('request-otp', { email: targetEmail });
    setBusy(false);
    if (r.success) {
      setOtpMode(mode);
      setOtpCode('');
      setStep(mode === 'reset' ? 'forgot_otp' : 'register_otp');
      startCountdown();
    } else {
      showModal('error', 'Gagal', r.msg || 'Gagal mengirim OTP ke email kamu.');
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setBusy(true);
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
      showModal('error', 'Gagal', r.msg || 'Kode OTP salah atau sudah expired.');
    }
  };

  const completeSetup = async () => {
    if (newPass.length < 6 || newPass !== confirmPass || !setupUser) return;
    setBusy(true);
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
      showModal('error', 'Gagal', r.msg || 'Gagal menyimpan pengaturan profil.');
    }
  };

  const loginWithPassword = async () => {
    if (!identifier || !pwInput || busy) return;
    setBusy(true);
    const r = await authApi('login-password', { identifier, password: pwInput });
    if (r.success) {
      setUser(r.user);
      setBalance(r.user.balance);
      setUsername(r.user.username);
      setHasPassword(true);
      setStep('app');
      setBusy(false);
    } else {
      setBusy(false);
      showModal('error', 'Akses Ditolak', r.msg || 'Username/Email atau password salah.');
    }
  };

  const resetPassword = async () => {
    if (newPass.length < 6 || newPass !== confirmPass) return;
    setBusy(true);
    const r = await authApi('reset-password', { resetToken, newPassword: newPass });
    setBusy(false);
    if (r.success) {
      setUser(r.user);
      setBalance(r.user.balance);
      setUsername(r.user.username);
      setHasPassword(true);
      setStep('app');
      showModal('success', 'Berhasil', 'Password baru berhasil disimpan.');
    } else {
      showModal('error', 'Gagal', r.msg || 'Proses reset password gagal, coba lagi nanti.');
    }
  };

  const logout = async () => {
    await api('logout');
    setUser(null); setBalance(0); setStep('welcome');
    setEmail(''); setIdentifier(''); setOrder(null); setServices([]);
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

  const buyNumber = async () => {
    if (!selectedSvc || !selectedCountry) return;
    const prov = selectedCountry.available[0];
    if (!prov) return;
    setOrdering(true);
    const r = await api('order_create', {
      number_id: selectedCountry.number_id,
      provider_id: prov.provider_id,
      service_id: selectedSvc.service_code,
    });
    setOrdering(false);
    if (r.success) {
      setOrder({ ...r.data, service_name: selectedSvc.service_name, service_img: selectedSvc.service_img });
      setShowSheet(false);
      api('balance').then(res => res.success && setBalance(res.data.balance));
    } else {
      if (r.msg && r.msg.toLowerCase().includes('tidak cukup')) {
        setShowSheet(false);
        showModal('warning', 'Saldo Tidak Cukup!', 'Saldo kamu kurang untuk transaksi ini. Silakan top up agar bisa bertransaksi dengan lancar.', () => setTab('deposit'));
      } else {
        showModal('error', 'Gagal Membeli', r.msg || 'Gagal terhubung ke server.');
      }
    }
  };

  const checkSms = async () => {
    if (!order) return;
    setCheckingSms(true);
    const r = await api('order_status', { order_id: order.order_id });
    setCheckingSms(false);
    if (r.success && r.data?.otp_code) {
      setOrder(prev => ({ ...prev, otp_code: r.data.otp_code, otp_msg: r.data.otp_msg }));
    }
  };

  const createQris = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setCreatingQris(true);
    const r = await api('deposit_create', { amount: Number(depositAmount) });
    setCreatingQris(false);
    if (r.success && r.data) {
      const actualAmt = r.data.amount || r.data.total || depositAmount;
      setQrisData({ ...r.data, actual_amount: actualAmt });
      setDepositCooldown(120);
    } else {
      showModal('error', 'Gagal', r.msg || 'Gagal membuat QRIS. Silakan cek kembali nominal.');
    }
  };

  const checkDeposit = async () => {
    if (!qrisData) return;
    setCheckingDeposit(true);
    const r = await api('deposit_status', { deposit_id: qrisData.id });
    setCheckingDeposit(false);
    if (r.success && r.status === 'paid') {
      setBalance(r.new_balance);
      setQrisData(null);
      setDepositAmount('');
      showModal('success', 'Pembayaran Masuk', 'Deposit berhasil ditambahkan ke saldo kamu!');
    } else {
      showModal('warning', 'Menunggu', 'Pembayaran belum terdeteksi. Silakan coba lagi beberapa saat.');
    }
  };

  const cancelDeposit = async () => {
    if (!qrisData) return;
    setCancelingDeposit(true);
    await api('deposit_cancel', { deposit_id: qrisData.id });
    setCancelingDeposit(false);
    setQrisData(null); 
    setDepositAmount(''); 
    showModal('success', 'Dibatalkan', 'Transaksi pembayaran berhasil dibatalkan.');
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    const r = await api('profile_update', { username });
    setSavingProfile(false);
    if (r.success) {
      showModal('success', 'Tersimpan', r.msg);
    } else {
      showModal('error', 'Gagal', r.msg);
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
      showModal('success', 'Berhasil', r.msg || 'Password baru berhasil disimpan');
    } else {
      showModal('error', 'Gagal', r.msg);
    }
  };

  const filteredSvcs = useMemo(() => {
    return services.filter(s => s.service_name?.toLowerCase().includes(query.toLowerCase()));
  }, [services, query]);

  const filteredCountries = useMemo(() => {
    return countries.filter(c => c.name.toLowerCase().includes(countryQuery.toLowerCase()));
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
          <div className="status-badge"><span className="status-dot"></span> SISTEM ONLINE</div>
          <h1 className="logo-title">WALZ<br/><span>NEXUS</span></h1>
          <p className="logo-subtitle">Layanan Digital Premium</p>
        </div>
        
        <div className="welcome-card">
          <button className="btn btn-primary" onClick={() => setStep('register')} style={{ height: 60, fontSize: '1.05rem', borderRadius: 'var(--r-full)' }}>
            <IconEdit /> Buat Akun Baru
          </button>
          <button className="btn btn-secondary" onClick={() => setStep('login')} style={{ height: 60, fontSize: '1.05rem', marginBottom: 0, borderRadius: 'var(--r-full)' }}>
            <IconLogin /> Masuk ke Akun
          </button>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="auth-screen welcome-bg">
        <div className="auth-logo-small"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Login Kembali 👋</div>
          <div className="auth-card-sub">Masukkan username/email dan password kamu</div>
          <div className="input-field">
            <label>Username / Email</label>
            <input type="text" value={identifier} placeholder="nama@email.com atau username" onChange={e => setIdentifier(e.target.value)} />
          </div>
          <div className="input-field">
            <label>Password</label>
            <div className="input-icon-wrap">
              <input type={showPw ? 'text' : 'password'} value={pwInput} placeholder="••••••••"
                onChange={e => setPwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !busy && identifier && pwInput && loginWithPassword()} />
              <EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={loginWithPassword} disabled={!identifier || !pwInput || busy} style={{ height: 54, borderRadius: 'var(--r-full)', marginTop: 8 }}>
            {busy ? <><LoadingSpinner /> Memproses...</> : <><IconLogin /> Masuk Sekarang</>}
          </button>
          <button className="btn-ghost" onClick={() => setStep('forgot')} style={{ color: 'var(--blue2)', marginBottom: 8 }}>
            Lupa Password?
          </button>
          <button className="btn-ghost" onClick={() => { setStep('welcome'); setIdentifier(''); setPwInput(''); }}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  if (step === 'register') {
    return (
      <div className="auth-screen welcome-bg">
        <div className="auth-logo-small"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Daftar Akun Baru</div>
          <div className="auth-card-sub">Masukkan email aktif untuk menerima kode verifikasi</div>
          <div className="input-field">
            <label>Alamat Email</label>
            <input type="email" value={email} placeholder="nama@email.com"
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !busy && email && sendOtp(email, 'register')} />
          </div>
          <button className="btn btn-primary" onClick={() => sendOtp(email, 'register')} disabled={!email || busy} style={{ height: 54, borderRadius: 'var(--r-full)', marginTop: 8 }}>
            {busy ? <><LoadingSpinner /> Mengirim...</> : <><IconMail /> Kirim Kode OTP</>}
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
        <div className="auth-logo-small"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Verifikasi OTP</div>
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
            {busy ? <><LoadingSpinner /> Verifikasi...</> : <><IconCheckCircle /> Verifikasi OTP</>}
          </button>
          <button className="btn btn-secondary" onClick={() => sendOtp(email, isReset ? 'reset' : 'register')} disabled={busy || countdown > 0} style={{ borderRadius: 'var(--r-full)' }}>
            {countdown > 0 ? `Kirim Ulang (${formatTime(countdown)})` : <><IconRefresh /> Kirim Ulang OTP</>}
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
        <div className="auth-logo-small"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Lengkapi Profil</div>
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
          {confirmPass && !isMatch && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>Password tidak cocok</p>}
          {confirmPass && isMatch && newPass.length >= 6 && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: 12 }}>Password cocok</p>}
          <button className="btn btn-primary" onClick={completeSetup} disabled={!isValid || busy} style={{ height: 54, borderRadius: 'var(--r-full)' }}>
            {busy ? <><LoadingSpinner /> Menyimpan...</> : 'Mulai Gunakan Aplikasi'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'forgot') {
    return (
      <div className="auth-screen welcome-bg">
        <div className="auth-logo-small"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Lupa Password</div>
          <div className="auth-card-sub">Masukkan email akun kamu yang pernah terdaftar untuk reset password.</div>
          <div className="input-field">
            <label>Email Terdaftar</label>
            <input type="email" value={email} placeholder="nama@email.com" onChange={e => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleForgotCheck} disabled={!email || busy} style={{ borderRadius: 'var(--r-full)' }}>
            {busy ? <><LoadingSpinner /> Memeriksa...</> : <><IconSend /> Lanjutkan</>}
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
        <div className="auth-logo-small"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Password Baru</div>
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
          {confirmPass && !isMatch && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>Password tidak cocok</p>}
          {confirmPass && isMatch && newPass.length >= 6 && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: 12 }}>Password cocok</p>}
          <button className="btn btn-primary" onClick={resetPassword} disabled={!isValid || busy} style={{ borderRadius: 'var(--r-full)' }}>
            {busy ? <><LoadingSpinner /> Menyimpan...</> : <><IconSave /> Simpan Password</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-header">
        <div className="header-row">
          <div className="header-brand">
            <div className="header-online"><div className="header-dot" /><span>Online</span></div>
            <div className="header-title">WALZ <span>NEXUS</span></div>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Ganti Tema">
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
        </div>
        <div className="balance-card">
          <div>
            <div className="balance-label">Saldo Kamu</div>
            <div className="balance-amount">{fmt(balance)}</div>
            <div className="balance-email">{username || user?.email}</div>
          </div>
          <button className="btn-topup" onClick={() => setTab('deposit')}>+ Top Up</button>
        </div>
      </div>

      <div className="tab-content">
        {tab === 'virtual' && !order && (
          <div style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
            <div className="section-hd">
              <h2>Layanan Virtual</h2>
              {!loadingSvcs && <span className="count">{filteredSvcs.length} layanan</span>}
            </div>
            <div className="search-wrap">
              <span className="search-icon"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <input value={query} placeholder="Cari layanan..." onChange={e => setQuery(e.target.value)} />
            </div>
            {loadingSvcs ? (
              <div className="loading-grid">
                <LoadingSpinner />
                <p className="loading-text">Memuat layanan...</p>
              </div>
            ) : filteredSvcs.length === 0 ? (
              <div className="empty-state">
                <span className="icon"><svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
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
          <div className="order-view">
            <div className="order-header">
              <button className="back-btn" onClick={() => setOrder(null)}>← Beli Lagi</button>
              <button className="back-btn" onClick={() => api('balance').then(r => r.success && setBalance(r.data.balance))}><IconRefresh /> Refresh Saldo</button>
            </div>
            <div className="order-card">
              <div className="number-block" onClick={() => navigator.clipboard.writeText(order.phone_number)}>
                <div className="number-block-svc">{order.service_name}</div>
                <div className="number-block-num">{order.phone_number}</div>
                <div className="number-block-copy"><IconCopy /> Tap untuk salin</div>
                <div className="number-block-price">{fmt(order.price)}</div>
              </div>
              <div className="otp-block">
                {!order.otp_code ? (
                  <div className="otp-waiting">
                    <div className="otp-waiting-icon">
                      <svg fill="none" stroke="var(--blue2)" strokeWidth="2" viewBox="0 0 24 24" width="32"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    </div>
                    <p>Menunggu SMS masuk...<br />Gunakan nomor di atas untuk verifikasi</p>
                    <button className="btn btn-primary" onClick={checkSms} disabled={checkingSms} style={{ width: '100%', borderRadius: 'var(--r-full)' }}>
                      {checkingSms ? <><LoadingSpinner /> Mengecek...</> : <><IconRefresh /> Cek SMS</>}
                    </button>
                  </div>
                ) : (
                  <div className="otp-received">
                    <div className="otp-received-label"><IconCheckCircle /> SMS Diterima</div>
                    <div className="otp-code-box">
                      <div className="otp-code-val">{order.otp_code}</div>
                    </div>
                    <div className="otp-msg-text">{order.otp_msg}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'ppob' && (
          <div style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
            <div className="section-hd">
              <h2>PPOB & TOP UP GAME</h2>
              {!ppobLoading && !ppobError && <span className="count">{filteredPpob.length} produk</span>}
            </div>
            
            {ppobError ? (
               <div className="empty-state" style={{ padding: '60px 0' }}>
                 <div className="modal-icon text-amber" style={{ animation: 'none' }}>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="60" height="60"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                 </div>
                 <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, marginTop: 16 }}>Sistem Maintenance</h3>
                 <p style={{ textAlign: 'center', padding: '0 20px' }}>{ppobError}<br/>Silakan coba lagi nanti.</p>
                 <button className="btn btn-secondary mt-16" onClick={fetchPpob} style={{ width: 'auto', borderRadius: 'var(--r-full)' }}><IconRefresh /> Cek Kembali</button>
               </div>
            ) : (
              <>
                <div className="search-wrap">
                  <span className="search-icon"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                  <input value={ppobQuery} placeholder="Cari nama atau brand produk..." onChange={e => setPpobQuery(e.target.value)} />
                </div>
                {ppobLoading ? (
                  <div className="loading-grid">
                    <LoadingSpinner />
                    <p className="loading-text">Memuat produk PPOB...</p>
                  </div>
                ) : filteredPpob.length === 0 ? (
                  <div className="empty-state">
                    <span className="icon"><svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
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
          <div className="deposit-wrap">
            <div className="section-hd" style={{ marginBottom: 16 }}>
              <h2>Top Up Saldo</h2>
            </div>
            {!qrisData ? (
              <div className="deposit-card">
                <div className="input-field">
                  <label>Nominal Deposit</label>
                  <input type="number" value={depositAmount} placeholder="Contoh: 10000" onChange={e => setDepositAmount(e.target.value)} />
                </div>
                <div className="deposit-amounts">
                  {[10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
                    <button key={amt} className={`amount-chip ${depositAmount == amt ? 'active' : ''}`} onClick={() => setDepositAmount(String(amt))}>
                      {fmt(amt).replace('Rp ', 'Rp')}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={createQris} disabled={!depositAmount || Number(depositAmount) <= 0 || creatingQris || depositCooldown > 0} style={{ marginTop: 12, borderRadius: 'var(--r-full)' }}>
                  {creatingQris ? <><LoadingSpinner /> Membuat QRIS...</> : depositCooldown > 0 ? `Tunggu ${formatTime(depositCooldown)}` : <><IconQR /> Buat QRIS Pembayaran</>}
                </button>
              </div>
            ) : (
              <div className="deposit-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Scan QRIS untuk Bayar
                </div>
                <div className="qris-card">
                  <img src={qrisData.qr_image || qrisData.qr_url} alt="QRIS" />
                </div>
                <div className="qris-amount">{fmt(qrisData.actual_amount)}</div>
                <button className="btn btn-success" onClick={checkDeposit} disabled={checkingDeposit} style={{ borderRadius: 'var(--r-full)' }}>
                  {checkingDeposit ? <><LoadingSpinner /> Mengecek...</> : <><IconCheckCircle /> Cek Status Pembayaran</>}
                </button>
                <button className="btn btn-danger" onClick={cancelDeposit} disabled={cancelingDeposit} style={{ borderRadius: 'var(--r-full)' }}>
                  {cancelingDeposit ? <><LoadingSpinner /> Membatalkan...</> : <><IconCross /> Batalkan Transaksi</>}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="profile-wrap">
            <div className="profile-avatar-row">
              <div className="profile-avatar">
                {username ? username[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="profile-name">{username || 'Pengguna'}</div>
              <div className="profile-email">{user?.email}</div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <span style={{ display: 'inline-flex', alignItems: 'center' }}><SvgProfile /></span> Info Akun
              </div>
              <div className="profile-section-body">
                <div className="input-field">
                  <label>Username</label>
                  <input type="text" value={username} placeholder="Nama unik tampilan" onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} maxLength={30} />
                </div>
                <div className="input-field" style={{ marginBottom: 0 }}>
                  <label>Email</label>
                  <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <button className="btn btn-primary mt-16" onClick={saveProfile} disabled={savingProfile} style={{ borderRadius: 'var(--r-full)' }}>
                  {savingProfile ? <><LoadingSpinner /> Menyimpan...</> : <><IconSave /> Simpan Profil</>}
                </button>
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <IconLock />
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
                    <input type={showNewPass ? 'text' : 'password'} value={profileConfirmPass} placeholder="Ulangi password baru" onChange={e => setProfileConfirmPass(e.target.value)} />
                  </div>
                </div>
                {profileConfirmPass && profileNewPass !== profileConfirmPass && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>Password tidak cocok</p>}
                <button className="btn btn-primary" onClick={savePassword} disabled={savingPass || profileNewPass.length < 6 || profileNewPass !== profileConfirmPass || (hasPassword && !curPass)} style={{ borderRadius: 'var(--r-full)' }}>
                  {savingPass ? <><LoadingSpinner /> Menyimpan...</> : <><IconLock /> Simpan Password</>}
                </button>
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-body">
                <button className="btn btn-danger" onClick={logout} style={{ marginBottom: 0, borderRadius: 'var(--r-full)' }}>
                  <IconLogout /> Keluar dari Akun
                </button>
              </div>
            </div>
            <div style={{ height: 16 }} />
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
              <div className="sheet-title">Pilih Negara</div>
            </div>
          </div>
          <div className="sheet-search">
             <input type="text" placeholder="Cari negara (Contoh: Indonesia)" value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} />
          </div>
        </div>
        <div className="sheet-body">
          {loadingCountries ? (
            <div className="sheet-loading">
              <LoadingSpinner />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Memuat negara...</p>
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <span className="icon"><svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <p>Tidak ada stok untuk pencarian tersebut</p>
            </div>
          ) : (
            filteredCountries.map(c => {
              const cheapest = c.available[0];
              const totalStock = c.available.length;
              const isSelected = selectedCountry?.number_id === c.number_id;
              return (
                <div key={c.number_id || c.name} className={`country-item ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedCountry(c)}>
                  <span className="country-flag">{getFlag(c.name)}</span>
                  <span className="country-name">{c.name}</span>
                  <div className="country-right">
                    <div className="country-price">{fmt(cheapest?.price)}</div>
                    <div className={`country-stock ${totalStock > 3 ? 'text-green' : totalStock > 0 ? 'text-amber' : 'text-red'}`}>
                      {totalStock > 0 ? `${totalStock} tersedia` : 'Habis'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {selectedCountry && (
          <div className="sheet-footer">
            <button className="btn btn-primary" onClick={buyNumber} disabled={ordering} style={{ borderRadius: 'var(--r-full)' }}>
              {ordering ? <><LoadingSpinner /> Memproses...</> : <><IconCart /> Beli Nomor {getFlag(selectedCountry.name)} {fmt(selectedCountry.available[0]?.price)}</>}
            </button>
          </div>
        )}
      </div>

      <div className={`modal-overlay ${modal.show ? 'open' : ''}`}>
        <div className={`modal-content ${modal.show ? 'popIn' : ''}`}>
          <div className={`modal-svg-wrap ${modal.type}`}>
            {modal.type === 'success' && <IconCheck />}
            {modal.type === 'error' && <IconCross />}
            {modal.type === 'warning' && <IconWarning />}
            {modal.type === 'info' && <IconInfo />}
          </div>
          <h3>{modal.title}</h3>
          <p>{modal.msg}</p>
          <div className="modal-actions">
            {modal.onConfirm && <button className="btn btn-secondary" onClick={closeModal} style={{ borderRadius: 'var(--r-full)' }}>Batal</button>}
            <button className="btn btn-primary" onClick={() => { if(modal.onConfirm) modal.onConfirm(); closeModal(); }} style={{ borderRadius: 'var(--r-full)', marginBottom: 0 }}>
              {modal.onConfirm ? 'Lanjutkan' : 'Tutup'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
