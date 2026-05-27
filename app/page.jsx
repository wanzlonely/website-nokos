'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── API helpers ─── */
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

/* ─── Utils ─── */
const fmt = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const OTP_DURATION = 300;

const FLAGS = {
  indonesia: '🇮🇩', malaysia: '🇲🇾', 'united states': '🇺🇸', usa: '🇺🇸',
  india: '🇮🇳', philippines: '🇵🇭', vietnam: '🇻🇳', thailand: '🇹🇭',
  singapore: '🇸🇬', myanmar: '🇲🇲', cambodia: '🇰🇭', laos: '🇱🇦',
  brazil: '🇧🇷', mexico: '🇲🇽', russia: '🇷🇺', china: '🇨🇳',
  'united kingdom': '🇬🇧', france: '🇫🇷', germany: '🇩🇪', turkey: '🇹🇷',
  nigeria: '🇳🇬', ghana: '🇬🇭', kenya: '🇰🇪', pakistan: '🇵🇰',
  bangladesh: '🇧🇩', egypt: '🇪🇬', ukraine: '🇺🇦', poland: '🇵🇱',
  'south africa': '🇿🇦', colombia: '🇨🇴', argentina: '🇦🇷', peru: '🇵🇪',
  ethiopia: '🇪🇹', tanzania: '🇹🇿', netherlands: '🇳🇱', spain: '🇪🇸',
};
const getFlag = name => FLAGS[name?.toLowerCase()] || '🌐';

const formatTime = secs => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/* ─── Small UI components ─── */
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

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function Page() {
  /* ─ Auth ─ */
  const [step, setStep] = useState('init');
  // init | login | otp | pw_login | forgot | forgot_otp | set_new_pass | app
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pwInput, setPwInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpMode, setOtpMode] = useState('login'); // 'login' | 'forgot'
  const timerRef = useRef(null);

  /* ─ App ─ */
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [hasPassword, setHasPassword] = useState(false);
  const [tab, setTab] = useState('virtual');

  /* ─ Services ─ */
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [loadingSvcs, setLoadingSvcs] = useState(true);

  /* ─ Country modal ─ */
  const [selectedSvc, setSelectedSvc] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [ordering, setOrdering] = useState(false);

  /* ─ Order ─ */
  const [order, setOrder] = useState(null);
  const [checkingSms, setCheckingSms] = useState(false);

  /* ─ Deposit ─ */
  const [depositAmount, setDepositAmount] = useState('');
  const [qrisData, setQrisData] = useState(null);
  const [creatingQris, setCreatingQris] = useState(false);

  /* ─ Profile ─ */
  const [username, setUsername] = useState('');
  const [curPass, setCurPass] = useState('');
  const [profileNewPass, setProfileNewPass] = useState('');
  const [profileConfirmPass, setProfileConfirmPass] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  /* ─ UI ─ */
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);

  /* ──────────────────── EFFECTS ──────────────────── */

  // Check existing session
  useEffect(() => {
    api('balance').then(r => {
      if (r.success) {
        setUser({ email: r.data.email });
        setBalance(r.data.balance);
        setHasPassword(r.data.hasPassword);
        setUsername(r.data.username || '');
        setStep('app');
      } else {
        setStep('login');
      }
    });
  }, []);

  // Load services
  useEffect(() => {
    if (step !== 'app') return;
    setLoadingSvcs(true);
    api('services').then(r => {
      if (r.success && Array.isArray(r.data)) {
        const base = r.data.map(s => ({ ...s, price: null, stock: null }));
        setServices(base);
        setLoadingSvcs(false);
        // Load price/stock for Indonesia by default (for preview)
        base.forEach(async svc => {
          const rc = await api('countries', { service_id: svc.service_code });
          if (!rc.data) return;
          const indo = rc.data.find(c => c.name?.toLowerCase().includes('indonesia')) || rc.data[0];
          const available = indo?.pricelist?.filter(p => p.available) || [];
          const price = available[0]?.price || null;
          const stock = available.reduce((sum, p) => sum + (p.available ? 1 : 0), 0);
          setServices(prev => prev.map(s =>
            s.service_code === svc.service_code ? { ...s, price, stock } : s
          ));
        });
      } else {
        setLoadingSvcs(false);
      }
    });
  }, [step]);

  // Countdown timer
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

  // Close sheet on back
  useEffect(() => {
    if (!showSheet) { setSelectedCountry(null); setCountries([]); }
  }, [showSheet]);

  /* ──────────────────── AUTH ACTIONS ──────────────────── */

  const startCountdown = () => {
    clearInterval(timerRef.current);
    setCountdown(OTP_DURATION);
  };

  const sendOtp = async (targetEmail, mode = 'login') => {
    if (!targetEmail) return;
    setBusy(true); setError('');
    const r = await authApi('request-otp', { email: targetEmail });
    setBusy(false);
    if (r.success) {
      setOtpMode(mode);
      setOtpCode('');
      setStep(mode === 'forgot' ? 'forgot_otp' : 'otp');
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
      if (otpMode === 'forgot') {
        setResetToken(r.resetToken);
        setNewPass(''); setConfirmPass('');
        setStep('set_new_pass');
      } else {
        setUser(r.user);
        setBalance(r.user.balance);
        setStep('app');
        api('balance').then(res => {
          if (res.success) {
            setHasPassword(res.data.hasPassword);
            setUsername(res.data.username || '');
          }
        });
      }
    } else {
      setError(r.msg || 'OTP salah atau sudah expired');
    }
  };

  const loginWithPassword = async () => {
    if (!pwInput) return;
    setBusy(true); setError('');
    const r = await authApi('login-password', { email, password: pwInput });
    setBusy(false);
    if (r.success) {
      setUser(r.user);
      setBalance(r.user.balance);
      setStep('app');
      api('balance').then(res => {
        if (res.success) { setHasPassword(res.data.hasPassword); setUsername(res.data.username || ''); }
      });
    } else {
      setError(r.msg || 'Login gagal');
    }
  };

  const resetPassword = async () => {
    if (newPass.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (newPass !== confirmPass) { setError('Password tidak cocok'); return; }
    setBusy(true); setError('');
    const r = await authApi('reset-password', { resetToken, newPassword: newPass });
    setBusy(false);
    if (r.success) {
      setUser(r.user);
      setBalance(r.user.balance);
      setHasPassword(true);
      setStep('app');
    } else {
      setError(r.msg || 'Reset gagal, coba lagi');
    }
  };

  const logout = async () => {
    await api('logout');
    setUser(null); setBalance(0); setStep('login');
    setEmail(''); setOrder(null); setServices([]);
  };

  /* ──────────────────── SERVICE / COUNTRY ACTIONS ──────────────────── */

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
          // Indonesia first
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

  /* ──────────────────── DEPOSIT ──────────────────── */

  const createQris = async () => {
    if (!depositAmount || Number(depositAmount) < 10000) { setError('Minimal deposit Rp 10.000'); return; }
    setCreatingQris(true); setError('');
    const r = await api('deposit_create', { amount: Number(depositAmount) });
    setCreatingQris(false);
    if (r.success) setQrisData(r.data);
    else setError(r.msg || 'Gagal membuat QRIS');
  };

  const checkDeposit = async () => {
    const r = await api('balance');
    if (r.success) { setBalance(r.data.balance); setQrisData(null); setDepositAmount(''); }
  };

  /* ──────────────────── PROFILE ──────────────────── */

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg(null);
    const r = await api('profile_update', { username });
    setSavingProfile(false);
    setProfileMsg({ type: r.success ? 'success' : 'error', text: r.msg });
    setTimeout(() => setProfileMsg(null), 3000);
  };

  const savePassword = async () => {
    if (profileNewPass.length < 6) { setProfileMsg({ type: 'error', text: 'Password minimal 6 karakter' }); return; }
    if (profileNewPass !== profileConfirmPass) { setProfileMsg({ type: 'error', text: 'Password tidak cocok' }); return; }
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

  /* ──────────────────── RENDER ──────────────────── */

  /* Init screen */
  if (step === 'init') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <LoadingSpinner />
          <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  /* ─── Login Screen ─── */
  if (step === 'login') {
    return (
      <div className="auth-screen">
        <div className="auth-logo">
          <div className="auth-logo-badge">
            <div className="auth-logo-dot" />
            <span>Online</span>
          </div>
          <h1>WALZ <span>NEXUS</span></h1>
          <p>Nomor Virtual Premium</p>
        </div>

        <div className="auth-card">
          <div className="auth-card-title">Selamat Datang 👋</div>
          <div className="auth-card-sub">Masukkan email kamu untuk lanjut</div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <div className="input-field">
            <label>Email</label>
            <input
              type="email" value={email} placeholder="nama@email.com"
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && !busy && email && sendOtp(email)}
            />
          </div>

          <button className="btn btn-primary" onClick={() => sendOtp(email)} disabled={!email || busy}>
            {busy ? <><LoadingSpinner /> Mengirim...</> : '✉️ Kirim OTP ke Email'}
          </button>

          {/* Password login divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" /><span>atau</span><div className="auth-divider-line" />
          </div>

          <button className="btn btn-secondary" onClick={() => { setError(''); setStep('pw_login'); }} disabled={!email}>
            🔑 Masuk dengan Password
          </button>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-4)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Belum punya akun? Kirim OTP untuk daftar otomatis.
          </p>
        </div>
      </div>
    );
  }

  /* ─── OTP Screen ─── */
  if (step === 'otp') {
    const timerClass = countdown > 60 ? '' : countdown > 0 ? 'warning' : 'expired';
    return (
      <div className="auth-screen">
        <div className="auth-logo">
          <h1>WALZ <span>NEXUS</span></h1>
        </div>
        <div className="auth-card">
          <div className="auth-card-title">Cek Email Kamu 📬</div>
          <div className="otp-info">
            Kode OTP dikirim ke <strong>{email}</strong>
          </div>

          <div className={`timer-bar ${timerClass}`}>
            <span className="timer-label">{countdown > 0 ? 'Kode berlaku' : 'Kode expired'}</span>
            <span className={`timer-time ${timerClass}`}>
              {countdown > 0 ? formatTime(countdown) : '00:00'}
            </span>
          </div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <div className="input-field">
            <label>Kode OTP (6 digit)</label>
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={otpCode} placeholder="••••••"
              style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center' }}
              onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && otpCode.length === 6 && !busy && verifyOtp()}
              disabled={countdown === 0}
            />
          </div>

          <button className="btn btn-primary" onClick={verifyOtp}
            disabled={otpCode.length !== 6 || busy || countdown === 0}>
            {busy ? <><LoadingSpinner /> Verifikasi...</> : '✅ Verifikasi'}
          </button>

          <button className="btn btn-secondary" onClick={() => sendOtp(email)}
            disabled={busy || countdown > 0}>
            {busy ? 'Mengirim...' : countdown > 0 ? `Kirim Ulang (${formatTime(countdown)})` : '🔄 Kirim Ulang OTP'}
          </button>

          <button className="btn-ghost" onClick={() => { setStep('login'); setOtpCode(''); setError(''); }}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  /* ─── Password Login Screen ─── */
  if (step === 'pw_login') {
    return (
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Masuk dengan Password 🔑</div>
          <div className="auth-card-sub">{email}</div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <div className="input-field">
            <label>Password</label>
            <div className="input-icon-wrap">
              <input
                type={showPw ? 'text' : 'password'} value={pwInput} placeholder="••••••••"
                onChange={e => { setPwInput(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && !busy && pwInput && loginWithPassword()}
              />
              <EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
            </div>
          </div>

          <button className="btn btn-primary" onClick={loginWithPassword} disabled={!pwInput || busy}>
            {busy ? <><LoadingSpinner /> Masuk...</> : '🔑 Masuk'}
          </button>

          <button className="btn btn-ghost" onClick={() => { setStep('forgot'); setError(''); }}
            style={{ color: 'var(--blue2)', marginBottom: 8 }}>
            Lupa password? Reset via OTP
          </button>

          <button className="btn-ghost" onClick={() => { setStep('login'); setPwInput(''); setError(''); }}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  /* ─── Forgot Password - Send OTP ─── */
  if (step === 'forgot') {
    return (
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Reset Password 🔒</div>
          <div className="auth-card-sub">
            Kami akan kirim kode OTP ke <strong>{email}</strong> untuk mereset password kamu.
          </div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <button className="btn btn-primary" onClick={() => sendOtp(email, 'forgot')} disabled={busy}>
            {busy ? <><LoadingSpinner /> Mengirim...</> : '📩 Kirim OTP Reset'}
          </button>

          <button className="btn-ghost" onClick={() => { setStep('pw_login'); setError(''); }}>
            ← Batal
          </button>
        </div>
      </div>
    );
  }

  /* ─── Forgot OTP verify ─── */
  if (step === 'forgot_otp') {
    const timerClass = countdown > 60 ? '' : countdown > 0 ? 'warning' : 'expired';
    return (
      <div className="auth-screen">
        <div className="auth-logo"><h1>WALZ <span>NEXUS</span></h1></div>
        <div className="auth-card">
          <div className="auth-card-title">Verifikasi OTP 📬</div>
          <div className="otp-info">Kode OTP dikirim ke <strong>{email}</strong></div>

          <div className={`timer-bar ${timerClass}`}>
            <span className="timer-label">{countdown > 0 ? 'Kode berlaku' : 'Kode expired'}</span>
            <span className={`timer-time ${timerClass}`}>
              {countdown > 0 ? formatTime(countdown) : '00:00'}
            </span>
          </div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <div className="input-field">
            <label>Kode OTP</label>
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={otpCode} placeholder="••••••"
              style={{ fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center' }}
              onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              disabled={countdown === 0}
            />
          </div>

          <button className="btn btn-primary" onClick={verifyOtp}
            disabled={otpCode.length !== 6 || busy || countdown === 0}>
            {busy ? <><LoadingSpinner /> Memverifikasi...</> : 'Verifikasi'}
          </button>

          <button className="btn btn-secondary" onClick={() => sendOtp(email, 'forgot')}
            disabled={busy || countdown > 0}>
            {countdown > 0 ? `Kirim Ulang (${formatTime(countdown)})` : '🔄 Kirim Ulang'}
          </button>

          <button className="btn-ghost" onClick={() => { setStep('forgot'); setOtpCode(''); setError(''); }}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  /* ─── Set New Password (after reset OTP) ─── */
  if (step === 'set_new_pass') {
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
              <input type={showNewPw ? 'text' : 'password'} value={newPass} placeholder="Min. 6 karakter"
                onChange={e => { setNewPass(e.target.value); setError(''); }} />
              <EyeToggle show={showNewPw} onToggle={() => setShowNewPw(v => !v)} />
            </div>
          </div>

          <div className="input-field">
            <label>Konfirmasi Password</label>
            <div className="input-icon-wrap">
              <input type={showConfPw ? 'text' : 'password'} value={confirmPass} placeholder="Ulangi password"
                onChange={e => { setConfirmPass(e.target.value); setError(''); }} />
              <EyeToggle show={showConfPw} onToggle={() => setShowConfPw(v => !v)} />
            </div>
          </div>

          {confirmPass && newPass !== confirmPass && (
            <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>❌ Password tidak cocok</p>
          )}
          {confirmPass && newPass === confirmPass && newPass.length >= 6 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginBottom: 12 }}>✅ Password cocok</p>
          )}

          <button className="btn btn-primary" onClick={resetPassword}
            disabled={newPass.length < 6 || newPass !== confirmPass || busy}>
            {busy ? <><LoadingSpinner /> Menyimpan...</> : '💾 Simpan Password'}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════
     APP (main interface)
  ═══════════════════════════════════ */
  const filteredSvcs = services.filter(s =>
    s.service_name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="app-header">
        <div className="header-row">
          <div className="header-brand">
            <div className="header-online">
              <div className="header-dot" /><span>Online</span>
            </div>
            <div className="header-title">WALZ <span>NEXUS</span></div>
          </div>
          <button
            className={`header-avatar ${tab === 'profile' ? 'active' : ''}`}
            onClick={() => setTab('profile')}
            title="Profil"
          >
            👤
          </button>
        </div>

        <div className="balance-card">
          <div>
            <div className="balance-label">Saldo Kamu</div>
            <div className="balance-amount">{fmt(balance)}</div>
            <div className="balance-email">{user?.email}</div>
          </div>
          <button className="btn-topup" onClick={() => setTab('deposit')}>
            + Top Up
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">

        {/* ── VIRTUAL NUMBER TAB ── */}
        {tab === 'virtual' && !order && (
          <div style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
            <div className="section-hd">
              <h2>Layanan Virtual</h2>
              {!loadingSvcs && <span className="count">{filteredSvcs.length} layanan</span>}
            </div>

            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                value={query} placeholder="Cari layanan..."
                onChange={e => setQuery(e.target.value)}
              />
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
                  <button
                    key={s.service_code}
                    className="svc-card"
                    style={{ animationDelay: `${i * 0.03}s` }}
                    onClick={() => openService(s)}
                  >
                    <div className="svc-icon-wrap">
                      <img src={s.service_img} alt={s.service_name} className="svc-icon"
                        onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="svc-name">{s.service_name}</div>
                    <div className="svc-price">{s.price ? fmt(s.price) : '...'}</div>
                    <div className={`svc-stock ${s.stock > 0 ? 'text-green' : s.stock === null ? 'text-muted' : 'text-red'}`}>
                      {s.stock === null ? '...' : s.stock > 0 ? `${s.stock} tersedia` : 'Habis'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDER VIEW ── */}
        {tab === 'virtual' && order && (
          <div className="order-view">
            <div className="order-header">
              <button className="back-btn" onClick={() => setOrder(null)}>
                ← Beli Lagi
              </button>
              <button className="back-btn" onClick={() => {
                api('balance').then(r => r.success && setBalance(r.data.balance));
              }}>
                🔄 Refresh Saldo
              </button>
            </div>

            <div className="order-card">
              <div className="number-block" onClick={() => {
                navigator.clipboard.writeText(order.phone_number);
              }}>
                <div className="number-block-svc">
                  {order.service_name}
                </div>
                <div className="number-block-num">{order.phone_number}</div>
                <div className="number-block-copy">📋 Tap untuk salin</div>
                <div className="number-block-price">{fmt(order.price)}</div>
              </div>

              <div className="otp-block">
                {!order.otp_code ? (
                  <div className="otp-waiting">
                    <div className="otp-waiting-icon">📱</div>
                    <p>Menunggu SMS masuk...<br />Gunakan nomor di atas untuk verifikasi</p>
                    <button className="btn btn-primary" onClick={checkSms}
                      disabled={checkingSms} style={{ width: '100%' }}>
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

        {/* ── DEPOSIT TAB ── */}
        {tab === 'deposit' && (
          <div className="deposit-wrap">
            <div className="section-hd" style={{ marginBottom: 16 }}>
              <h2>Top Up Saldo</h2>
            </div>

            {!qrisData ? (
              <div className="deposit-card">
                <div className="input-field">
                  <label>Nominal Deposit</label>
                  <input
                    type="number" value={depositAmount} placeholder="Contoh: 50000"
                    onChange={e => { setDepositAmount(e.target.value); setError(''); }}
                  />
                </div>

                <div className="deposit-amounts">
                  {[20000, 50000, 100000, 200000, 500000, 1000000].map(amt => (
                    <button
                      key={amt}
                      className={`amount-chip ${depositAmount == amt ? 'active' : ''}`}
                      onClick={() => setDepositAmount(String(amt))}
                    >
                      {fmt(amt).replace('Rp ', 'Rp')}
                    </button>
                  ))}
                </div>

                {error && <div className="error-msg">{error}</div>}

                <button className="btn btn-primary" onClick={createQris}
                  disabled={!depositAmount || creatingQris}>
                  {creatingQris ? <><LoadingSpinner /> Membuat QRIS...</> : '📲 Buat QRIS'}
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
                <div className="qris-amount">{fmt(qrisData.amount)}</div>
                <button className="btn btn-success" onClick={checkDeposit}>
                  ✅ Cek Saldo
                </button>
                <button className="btn btn-secondary" onClick={() => { setQrisData(null); setDepositAmount(''); }}>
                  ← Kembali
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
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

            {/* Info Akun */}
            <div className="profile-section">
              <div className="profile-section-title">
                <span>👤</span> Info Akun
              </div>
              <div className="profile-section-body">
                <div className="input-field">
                  <label>Username</label>
                  <input
                    type="text" value={username} placeholder="Nama tampilan"
                    onChange={e => setUsername(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className="input-field" style={{ marginBottom: 0 }}>
                  <label>Email</label>
                  <input type="email" value={user?.email || ''} disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <button className="btn btn-primary mt-16" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <><LoadingSpinner /> Menyimpan...</> : '💾 Simpan Profil'}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="profile-section">
              <div className="profile-section-title">
                <span>🔐</span> {hasPassword ? 'Ganti Password' : 'Atur Password'}
              </div>
              <div className="profile-section-body">
                {!hasPassword && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.6, background: 'var(--blue-soft)', padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-blue)' }}>
                    💡 Atur password agar bisa login tanpa OTP di lain waktu
                  </div>
                )}

                {hasPassword && (
                  <div className="input-field">
                    <label>Password Saat Ini</label>
                    <div className="input-icon-wrap">
                      <input
                        type={showCurPass ? 'text' : 'password'}
                        value={curPass} placeholder="••••••••"
                        onChange={e => setCurPass(e.target.value)}
                      />
                      <EyeToggle show={showCurPass} onToggle={() => setShowCurPass(v => !v)} />
                    </div>
                  </div>
                )}

                <div className="input-field">
                  <label>Password Baru</label>
                  <div className="input-icon-wrap">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={profileNewPass} placeholder="Min. 6 karakter"
                      onChange={e => setProfileNewPass(e.target.value)}
                    />
                    <EyeToggle show={showNewPass} onToggle={() => setShowNewPass(v => !v)} />
                  </div>
                </div>

                <div className="input-field">
                  <label>Konfirmasi Password</label>
                  <div className="input-icon-wrap">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={profileConfirmPass} placeholder="Ulangi password baru"
                      onChange={e => setProfileConfirmPass(e.target.value)}
                    />
                  </div>
                </div>

                {profileConfirmPass && profileNewPass !== profileConfirmPass && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--red)', marginBottom: 12 }}>❌ Password tidak cocok</p>
                )}

                <button className="btn btn-primary" onClick={savePassword}
                  disabled={savingPass || profileNewPass.length < 6 || profileNewPass !== profileConfirmPass || (hasPassword && !curPass)}>
                  {savingPass ? <><LoadingSpinner /> Menyimpan...</> : '🔐 Simpan Password'}
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="profile-section">
              <div className="profile-section-body">
                <button className="btn btn-danger" onClick={logout}>
                  🚪 Keluar dari Akun
                </button>
              </div>
            </div>

            <div style={{ height: 8 }} />
          </div>
        )}

      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'virtual' ? 'active' : ''}`}
          onClick={() => { setTab('virtual'); setOrder(null); }}>
          <div className="nav-icon-wrap">📞</div>
          <span>Nomor OTP</span>
        </button>
        <button className={`nav-item ${tab === 'deposit' ? 'active' : ''}`}
          onClick={() => setTab('deposit')}>
          <div className="nav-icon-wrap">💳</div>
          <span>Top Up</span>
        </button>
        <button className={`nav-item ${tab === 'profile' ? 'active' : ''}`}
          onClick={() => setTab('profile')}>
          <div className="nav-icon-wrap">👤</div>
          <span>Profil</span>
        </button>
      </nav>

      {/* ── COUNTRY BOTTOM SHEET ── */}
      <div
        className={`sheet-overlay ${showSheet ? 'open' : ''}`}
        onClick={() => setShowSheet(false)}
      />

      <div className={`bottom-sheet ${showSheet ? 'open' : ''}`}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-svc-row">
            <div className="sheet-svc-icon">
              {selectedSvc?.service_img && (
                <img src={selectedSvc.service_img} alt="" />
              )}
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
                <div
                  key={c.number_id || c.name}
                  className={`country-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCountry(c)}
                >
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
              {ordering
                ? <><LoadingSpinner /> Memproses...</>
                : `🛒 Beli Nomor ${getFlag(selectedCountry.name)} ${fmt(selectedCountry.available[0]?.price)}`
              }
            </button>
          </div>
        )}
      </div>
    </>
  );
}
