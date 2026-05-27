'use client';
import { useState, useEffect, useRef } from 'react';

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

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" className="eye-btn" onClick={onToggle} tabIndex={-1}>
      {show ? '🙈' : '👁️'}
    </button>
  );
}

function LoadingSpinner() {
  return <div className="loading-spinner" />;
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
  const [depositMsg, setDepositMsg] = useState(null);
  const [depositCooldown, setDepositCooldown] = useState(0);

  const [curPass, setCurPass] = useState('');
  const [profileNewPass, setProfileNewPass] = useState('');
  const [profileConfirmPass, setProfileConfirmPass] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);

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
    if (!showSheet) { setSelectedCountry(null); setCountries([]); }
  }, [showSheet]);

  const startCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(OTP_DURATION);
  };

  const sendOtp = async (targetEmail, mode = 'register') => {
    if (!targetEmail) return;
    setBusy(true); setError('');
    const r = await authApi('request-otp', { email: targetEmail });
    setBusy(false);
    if (r.success) {
      setOtpMode(mode);
      setOtpCode('');
      setStep(mode === 'reset' ? 'forgot_otp' : 'register_otp');
      startCountdown();
    } else {
      setError(r.msg || 'Gagal mengirim OTP');
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setBusy(true); setError('');
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
      setError(r.msg || 'OTP salah atau sudah expired');
    }
  };

  const completeSetup = async () => {
    if (newPass.length < 6 || newPass !== confirmPass || !setupUser) return;
    setBusy(true); setError('');
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
      setError(r.msg || 'Gagal menyimpan pengaturan');
    }
  };

  const loginWithPassword = async () => {
    if (!identifier || !pwInput) return;
    setBusy(true); setError('');
    const r = await authApi('login-password', { identifier, password: pwInput });
    setBusy(false);
    if (r.success) {
      setUser(r.user);
      setBalance(r.user.balance);
      setUsername(r.user.username);
      setHasPassword(true);
      setStep('app');
    } else {
      setError(r.msg || 'Login gagal');
    }
  };

  const resetPassword = async () => {
    if (newPass.length < 6 || newPass !== confirmPass) return;
    setBusy(true); setError('');
    const r = await authApi('reset-password', { resetToken, newPassword: newPass });
    setBusy(false);
    if (r.success) {
      setUser(r.user);
      setBalance(r.user.balance);
      setUsername(r.user.username);
      setHasPassword(true);
      setStep('app');
    } else {
      setError(r.msg || 'Reset gagal, coba lagi');
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
      setError(r.msg || 'Gagal membeli nomor');
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
    setCreatingQris(true); setError(''); setDepositMsg(null);
    const r = await api('deposit_create', { amount: Number(depositAmount) });
    setCreatingQris(false);
    if (r.success) {
      setQrisData({ ...r.data, actual_amount: depositAmount });
      setDepositCooldown(120);
    } else {
      setError(r.msg || 'Gagal membuat QRIS. Cek nominal kembali.');
    }
  };

  const checkDeposit = async () => {
    if (!qrisData) return;
    setCheckingDeposit(true); setDepositMsg(null);
    const r = await api('deposit_status', { deposit_id: qrisData.id });
    setCheckingDeposit(false);
    if (r.success && r.status === 'paid') {
      setBalance(r.new_balance);
      setQrisData(null);
      setDepositAmount('');
      setDepositMsg({ type: 'success', text: 'Deposit berhasil masuk!' });
      setTimeout(() => setDepositMsg(null), 5000);
    } else {
      setDepositMsg({ type: 'error', text: 'Pembayaran belum terdeteksi. Silakan coba lagi.' });
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg(null);
    const r = await api('profile_update', { username });
    setSavingProfile(false);
    setProfileMsg({ type: r.success ? 'success' : 'error', text: r.msg });
    setTimeout(() => setProfileMsg(null), 3000);
  };

  const savePassword = async () => {
    if (profileNewPass.length < 6 || profileNewPass !== profileConfirmPass) return;
    setSavingPass(true); setProfileMsg(null);
    const r = await authApi('set-password', { currentPassword: curPass || undefined, newPassword: profileNewPass });
    setSavingPass(false);
    if (r.success) {
      setHasPassword(true);
      setCurPass(''); setProfileNewPass(''); setProfileConfirmPass('');
      setProfileMsg({ type: 'success', text: r.msg || 'Password berhasil disimpan' });
    } else {
      setProfileMsg({ type: 'error', text: r.msg });
    }
    setTimeout(() => setProfileMsg(null), 4000);
  };

  if (step === 'init') {
    return (
      <div className="auth-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (step === 'welcome') {
    return (
      <div className="auth-screen">
        <div className="auth-logo">
          <div className="auth-logo-badge"><div className="auth-logo-dot" /><span>Online</span></div>
          <h1>WALZ <span>NEXUS</span></h1>
          <p>Nomor Virtual Premium</p>
        </div>
        <div className="auth-card" style={{ padding: '40px 24px' }}>
          <button className="btn btn-primary" onClick={() => { setStep('register'); setError(''); }} style={{ height: 56, fontSize: '1rem' }}>
            📝 Registrasi Baru
          </button>
          <button className="btn btn-secondary" onClick={() => { setStep('login'); setError(''); }} style={{ height: 56, fontSize: '1rem', marginBottom: 0 }}>
            🔑 Login Akun
          </button>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Login Kembali 👋</div>
          <div className="auth-card-sub">Masukkan username/email dan password</div>
          {error && <div className="error-msg">⚠️ {error}</div>}
          <div className="input-field">
            <label>Username / Email</label>
            <input type="text" value={identifier} placeholder="nama@email.com atau username"
              onChange={e => { setIdentifier(e.target.value); setError(''); }} />
          </div>
          <div className="input-field">
            <label>Password</label>
            <div className="input-icon-wrap">
              <input type={showPw ? 'text' : 'password'} value={pwInput} placeholder="••••••••"
                onChange={e => { setPwInput(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && !busy && identifier && pwInput && loginWithPassword()} />
              <EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={loginWithPassword} disabled={!identifier || !pwInput || busy}>
            {busy ? <><LoadingSpinner /> Memproses...</> : '🔑 Masuk'}
          </button>
          <button className="btn-ghost" onClick={() => { setStep('forgot'); setError(''); }} style={{ color: 'var(--blue2)', marginBottom: 8 }}>
            Lupa Password?
          </button>
          <button className="btn-ghost" onClick={() => { setStep('welcome'); setError(''); setIdentifier(''); setPwInput(''); }}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  if (step === 'register') {
    return (
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Daftar Akun Baru 🚀</div>
          <div className="auth-card-sub">Masukkan email aktif untuk verifikasi</div>
          {error && <div className="error-msg">⚠️ {error}</div>}
          <div className="input-field">
            <label>Alamat Email</label>
            <input type="email" value={email} placeholder="nama@email.com"
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && !busy && email && sendOtp(email, 'register')} />
          </div>
          <button className="btn btn-primary" onClick={() => sendOtp(email, 'register')} disabled={!email || busy}>
            {busy ? <><LoadingSpinner /> Mengirim...</> : '✉️ Kirim Kode OTP'}
          </button>
          <button className="btn-ghost" onClick={() => { setStep('welcome'); setEmail(''); setError(''); }}>
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
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Verifikasi OTP 📬</div>
          <div className="otp-info">Kode dikirim ke <strong>{email}</strong></div>
          <div className={`timer-bar ${timerClass}`}>
            <span className="timer-label">{countdown > 0 ? 'Kode berlaku' : 'Kode expired'}</span>
            <span className={`timer-time ${timerClass}`}>{countdown > 0 ? formatTime(countdown) : '00:00'}</span>
          </div>
          {error && <div className="error-msg">⚠️ {error}</div>}
          <div className="input-field">
            <label>Kode OTP (6 digit)</label>
            <input type="text" inputMode="numeric" maxLength={6} value={otpCode} placeholder="••••••"
              style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center' }}
              onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && otpCode.length === 6 && !busy && verifyOtp()}
              disabled={countdown === 0} />
          </div>
          <button className="btn btn-primary" onClick={verifyOtp} disabled={otpCode.length !== 6 || busy || countdown === 0}>
            {busy ? <><LoadingSpinner /> Verifikasi...</> : '✅ Verifikasi OTP'}
          </button>
          <button className="btn btn-secondary" onClick={() => sendOtp(email, isReset ? 'reset' : 'register')} disabled={busy || countdown > 0}>
            {countdown > 0 ? `Kirim Ulang (${formatTime(countdown)})` : '🔄 Kirim Ulang OTP'}
          </button>
          <button className="btn-ghost" onClick={() => { setStep(isReset ? 'forgot' : 'register'); setOtpCode(''); setError(''); }}>
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
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Lengkapi Profil ✍️</div>
          <div className="auth-card-sub">Buat username dan password agar kedepannya bisa langsung login tanpa OTP.</div>
          {error && <div className="error-msg">⚠️ {error}</div>}
          <div className="input-field">
            <label>Username</label>
            <input type="text" value={setupUser} placeholder="Nama tanpa spasi" onChange={e => { setSetupUser(e.target.value.replace(/\s/g, '')); setError(''); }} />
          </div>
          <div className="input-field">
            <label>Password Baru</label>
            <div className="input-icon-wrap">
              <input type={showNewPw ? 'text' : 'password'} value={newPass} placeholder="Min. 6 karakter" onChange={e => { setNewPass(e.target.value); setError(''); }} />
              <EyeToggle show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
            </div>
          </div>
          <div className="input-field">
            <label>Konfirmasi Password</label>
            <div className="input-icon-wrap">
              <input type={showConfPw ? 'text' : 'password'} value={confirmPass} placeholder="Ulangi password" onChange={e => { setConfirmPass(e.target.value); setError(''); }} />
              <EyeToggle show={showConfPw} onToggle={() => setShowConfPw(v => !v)} />
            </div>
          </div>
          {confirmPass && !isMatch && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>❌ Password tidak cocok</p>}
          {confirmPass && isMatch && newPass.length >= 6 && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: 12 }}>✅ Password cocok</p>}
          <button className="btn btn-primary" onClick={completeSetup} disabled={!isValid || busy}>
            {busy ? <><LoadingSpinner /> Menyimpan...</> : '🚀 Mulai Gunakan Aplikasi'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'forgot') {
    return (
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Lupa Password 🔒</div>
          <div className="auth-card-sub">Kami akan mengirim kode OTP ke email kamu untuk proses reset.</div>
          {error && <div className="error-msg">⚠️ {error}</div>}
          <div className="input-field">
            <label>Email Terdaftar</label>
            <input type="email" value={email} placeholder="nama@email.com" onChange={e => { setEmail(e.target.value); setError(''); }} />
          </div>
          <button className="btn btn-primary" onClick={() => sendOtp(email, 'reset')} disabled={!email || busy}>
            {busy ? <><LoadingSpinner /> Mengirim...</> : '📩 Kirim OTP Reset'}
          </button>
          <button className="btn-ghost" onClick={() => { setStep('login'); setError(''); }}>
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
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Password Baru 🔐</div>
          <div className="auth-card-sub">Buat password baru untuk akun kamu</div>
          {error && <div className="error-msg">⚠️ {error}</div>}
          <div className="input-field">
            <label>Password Baru</label>
            <div className="input-icon-wrap">
              <input type={showNewPw ? 'text' : 'password'} value={newPass} placeholder="Min. 6 karakter" onChange={e => { setNewPass(e.target.value); setError(''); }} />
              <EyeToggle show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
            </div>
          </div>
          <div className="input-field">
            <label>Konfirmasi Password</label>
            <div className="input-icon-wrap">
              <input type={showConfPw ? 'text' : 'password'} value={confirmPass} placeholder="Ulangi password" onChange={e => { setConfirmPass(e.target.value); setError(''); }} />
              <EyeToggle show={showConfPw} onToggle={() => setShowConfPw(v => !v)} />
            </div>
          </div>
          {confirmPass && !isMatch && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>❌ Password tidak cocok</p>}
          {confirmPass && isMatch && newPass.length >= 6 && <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: 12 }}>✅ Password cocok</p>}
          <button className="btn btn-primary" onClick={resetPassword} disabled={!isValid || busy}>
            {busy ? <><LoadingSpinner /> Menyimpan...</> : '💾 Simpan Password'}
          </button>
        </div>
      </div>
    );
  }

  const filteredSvcs = services.filter(s => s.service_name?.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="app-header">
        <div className="header-row">
          <div className="header-brand">
            <div className="header-online"><div className="header-dot" /><span>Online</span></div>
            <div className="header-title">WALZ <span>NEXUS</span></div>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Ganti Tema">
            {theme === 'dark' ? '☀️' : '🌙'}
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
              <span className="search-icon">⌕</span>
              <input value={query} placeholder="Cari layanan..." onChange={e => setQuery(e.target.value)} />
            </div>
            {loadingSvcs ? (
              <div className="loading-grid">
                <LoadingSpinner />
                <p className="loading-text">Memuat layanan...</p>
              </div>
            ) : filteredSvcs.length === 0 ? (
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
          <div className="order-view">
            <div className="order-header">
              <button className="back-btn" onClick={() => setOrder(null)}>← Beli Lagi</button>
              <button className="back-btn" onClick={() => api('balance').then(r => r.success && setBalance(r.data.balance))}>🔄 Refresh Saldo</button>
            </div>
            <div className="order-card">
              <div className="number-block" onClick={() => navigator.clipboard.writeText(order.phone_number)}>
                <div className="number-block-svc">{order.service_name}</div>
                <div className="number-block-num">{order.phone_number}</div>
                <div className="number-block-copy">📋 Tap untuk salin</div>
                <div className="number-block-price">{fmt(order.price)}</div>
              </div>
              <div className="otp-block">
                {!order.otp_code ? (
                  <div className="otp-waiting">
                    <div className="otp-waiting-icon">📱</div>
                    <p>Menunggu SMS masuk...<br />Gunakan nomor di atas untuk verifikasi</p>
                    <button className="btn btn-primary" onClick={checkSms} disabled={checkingSms} style={{ width: '100%' }}>
                      {checkingSms ? <><LoadingSpinner /> Mengecek...</> : '🔄 Cek SMS'}
                    </button>
                  </div>
                ) : (
                  <div className="otp-received">
                    <div className="otp-received-label">✅ SMS Diterima</div>
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

        {tab === 'deposit' && (
          <div className="deposit-wrap">
            <div className="section-hd" style={{ marginBottom: 16 }}>
              <h2>Top Up Saldo</h2>
            </div>
            {depositMsg && (
              <div className={`profile-msg ${depositMsg.type}`}>
                {depositMsg.type === 'success' ? '✅' : '⚠️'} {depositMsg.text}
              </div>
            )}
            {!qrisData ? (
              <div className="deposit-card">
                <div className="input-field">
                  <label>Nominal Deposit</label>
                  <input type="number" value={depositAmount} placeholder="Contoh: 10000" onChange={e => { setDepositAmount(e.target.value); setError(''); }} />
                </div>
                <div className="deposit-amounts">
                  {[10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
                    <button key={amt} className={`amount-chip ${depositAmount == amt ? 'active' : ''}`} onClick={() => setDepositAmount(String(amt))}>
                      {fmt(amt).replace('Rp ', 'Rp')}
                    </button>
                  ))}
                </div>
                {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}
                <button className="btn btn-primary" onClick={createQris} disabled={!depositAmount || Number(depositAmount) <= 0 || creatingQris || depositCooldown > 0} style={{ marginTop: 12 }}>
                  {creatingQris ? <><LoadingSpinner /> Membuat QRIS...</> : depositCooldown > 0 ? `Tunggu ${formatTime(depositCooldown)}` : '📲 Buat QRIS Pembayaran'}
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
                <button className="btn btn-success" onClick={checkDeposit} disabled={checkingDeposit}>
                  {checkingDeposit ? <><LoadingSpinner /> Mengecek...</> : '✅ Cek Status Pembayaran'}
                </button>
                <button className="btn btn-danger" onClick={() => { setQrisData(null); setDepositAmount(''); setDepositMsg(null); }}>
                  ✖ Batalkan Transaksi
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

            {profileMsg && (
              <div className={`profile-msg ${profileMsg.type}`}>
                {profileMsg.type === 'success' ? '✅' : '❌'} {profileMsg.text}
              </div>
            )}

            <div className="profile-section">
              <div className="profile-section-title"><span>👤</span> Info Akun</div>
              <div className="profile-section-body">
                <div className="input-field">
                  <label>Username</label>
                  <input type="text" value={username} placeholder="Nama tampilan" onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} maxLength={30} />
                </div>
                <div className="input-field" style={{ marginBottom: 0 }}>
                  <label>Email</label>
                  <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <button className="btn btn-primary mt-16" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <><LoadingSpinner /> Menyimpan...</> : '💾 Simpan Profil'}
                </button>
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title"><span>🔐</span> {hasPassword ? 'Ganti Password' : 'Atur Password'}</div>
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
                {profileConfirmPass && profileNewPass !== profileConfirmPass && <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>❌ Password tidak cocok</p>}
                <button className="btn btn-primary" onClick={savePassword} disabled={savingPass || profileNewPass.length < 6 || profileNewPass !== profileConfirmPass || (hasPassword && !curPass)}>
                  {savingPass ? <><LoadingSpinner /> Menyimpan...</> : '🔐 Simpan Password'}
                </button>
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-body">
                <button className="btn btn-danger" onClick={logout} style={{ marginBottom: 0 }}>🚪 Keluar dari Akun</button>
              </div>
            </div>
            <div style={{ height: 16 }} />
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'virtual' ? 'active' : ''}`} onClick={() => { setTab('virtual'); setOrder(null); }}>
          <div className="nav-icon-wrap">📞</div>
          <span>Produk</span>
        </button>
        <button className={`nav-item ${tab === 'deposit' ? 'active' : ''}`} onClick={() => setTab('deposit')}>
          <div className="nav-icon-wrap">💳</div>
          <span>Top Up</span>
        </button>
        <button className={`nav-item ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          <div className="nav-icon-wrap">👤</div>
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
            <div>
              <div className="sheet-svc-name">{selectedSvc?.service_name}</div>
              <div className="sheet-title">Pilih Negara</div>
            </div>
          </div>
        </div>
        <div className="sheet-body">
          {loadingCountries ? (
            <div className="sheet-loading">
              <LoadingSpinner />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Memuat negara...</p>
            </div>
          ) : countries.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <span className="icon">🌐</span>
              <p>Tidak ada stok tersedia</p>
            </div>
          ) : (
            countries.map(c => {
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
            <button className="btn btn-primary" onClick={buyNumber} disabled={ordering}>
              {ordering ? <><LoadingSpinner /> Memproses...</> : `🛒 Beli Nomor ${getFlag(selectedCountry.name)} ${fmt(selectedCountry.available[0]?.price)}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
