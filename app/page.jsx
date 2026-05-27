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

const OTP_DURATION = 300; // 5 menit dalam detik

export default function Page() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login');
  const [balance, setBalance] = useState(0);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [order, setOrder] = useState(null);
  const [deposit, setDeposit] = useState(null);
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState('virtual');
  const [loading, setLoading] = useState(true);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    api('balance').then(r => {
      if (r.success) {
        setUser({ email: r.data.email });
        setBalance(r.data.balance);
        setStep('app');
      }
    });
  }, []);

  useEffect(() => {
    if (step !== 'app') return;
    api('services').then(async r => {
      if (r.success && Array.isArray(r.data)) {
        const base = r.data.map(s => ({ ...s, price: null, stock: null }));
        setServices(base);
        setLoading(false);
        base.forEach(async svc => {
          const rc = await api('countries', { service_id: svc.service_code });
          const indo = rc.data?.find(c => c.name.toLowerCase().includes('indonesia')) || rc.data?.[0];
          const available = indo?.pricelist?.filter(p => p.available) || [];
          const price = available[0]?.price || 0;
          setServices(prev => prev.map(s => s.service_code === svc.service_code ? { ...s, price, stock: available.length, number_id: indo?.number_id, provider_id: available[0]?.provider_id } : s));
        });
      }
    });
  }, [step]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [countdown]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const requestOtp = async () => {
    if (!email) return;
    setSendingOtp(true);
    setErrorMsg('');
    const r = await authApi('request-otp', { email });
    setSendingOtp(false);
    if (r.success) {
      setStep('otp');
      setOtp('');
      setCountdown(OTP_DURATION); // mulai countdown 5 menit
    } else {
      setErrorMsg(r.msg || 'Gagal mengirim OTP, coba lagi');
    }
  };

  const resendOtp = async () => {
    setSendingOtp(true);
    setErrorMsg('');
    setOtp('');
    const r = await authApi('request-otp', { email });
    setSendingOtp(false);
    if (r.success) {
      setCountdown(OTP_DURATION);
    } else {
      setErrorMsg(r.msg || 'Gagal mengirim ulang OTP');
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return;
    setVerifying(true);
    setErrorMsg('');
    const r = await authApi('verify-otp', { email, code: otp });
    setVerifying(false);
    if (r.success) {
      setUser(r.user);
      setBalance(r.user.balance);
      setStep('app');
      api('balance').then(res => res.success && setBalance(res.data.balance));
    } else {
      setErrorMsg(r.msg || 'Kode OTP salah atau sudah expired');
    }
  };

  const handleOrder = async () => {
    if (!selected) return;
    const r = await api('order_create', { number_id: selected.number_id, provider_id: selected.provider_id, service_id: selected.service_code });
    if (r.success) {
      setOrder({ ...r.data, service_name: selected.service_name });
      api('balance').then(res => res.success && setBalance(res.data.balance));
    }
  };

  const checkSms = async () => {
    if (!order) return;
    const r = await api('order_status', { order_id: order.order_id });
    if (r.success && r.data?.otp_code) {
      setOrder({ ...order, otp_code: r.data.otp_code, otp_msg: r.data.otp_msg });
    }
  };

  const createDeposit = async () => {
    const r = await api('deposit_create', { amount: Number(amount) });
    if (r.success) setDeposit(r.data);
  };

  const checkDeposit = () => {
    api('balance').then(r => {
      if (r.success) {
        setBalance(r.data.balance);
        setDeposit(null);
        setAmount('');
      }
    });
  };

  if (step === 'login' || step === 'otp') {
    return (
      <div style={{ padding: 40, paddingTop: 100 }}>
        <div className="card"><div className="card-body">
          <h2 style={{ marginBottom: 20 }}>Masuk ke Walz Nexus</h2>

          {step === 'login' ? (
            <>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                  placeholder="nama@email.com"
                  onKeyDown={e => e.key === 'Enter' && !sendingOtp && email && requestOtp()}
                />
              </div>
              {errorMsg && (
                <p style={{ color: '#f85149', fontSize: 13, marginBottom: 12, marginTop: -4 }}>⚠️ {errorMsg}</p>
              )}
              <button className="btn-primary" onClick={requestOtp} disabled={!email || sendingOtp}>
                {sendingOtp ? 'Mengirim...' : 'Kirim OTP'}
              </button>
            </>
          ) : (
            <>
              <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 16 }}>
                Kode OTP dikirim ke <strong style={{ color: '#e6edf3' }}>{email}</strong>
              </p>

              {/* Countdown Timer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, marginBottom: 16,
                padding: '10px 16px',
                background: countdown > 0 ? '#1c2128' : '#2d1b1b',
                borderRadius: 8,
                border: `1px solid ${countdown > 60 ? '#30363d' : countdown > 0 ? '#f0883e' : '#f85149'}`,
              }}>
                <span style={{ fontSize: 18 }}>{countdown > 0 ? '⏰' : '❌'}</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: countdown > 60 ? '#4f8ef7' : countdown > 0 ? '#f0883e' : '#f85149',
                }}>
                  {countdown > 0 ? formatCountdown(countdown) : '00:00'}
                </span>
                <span style={{ color: '#8b949e', fontSize: 12 }}>
                  {countdown > 0 ? 'sisa waktu' : 'kode expired'}
                </span>
              </div>

              <div className="input-group">
                <label>Kode OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setErrorMsg(''); }}
                  placeholder="6 digit"
                  onKeyDown={e => e.key === 'Enter' && otp.length === 6 && !verifying && verifyOtp()}
                  disabled={countdown === 0}
                />
              </div>

              {errorMsg && (
                <p style={{ color: '#f85149', fontSize: 13, marginBottom: 12, marginTop: -4 }}>⚠️ {errorMsg}</p>
              )}

              <button
                className="btn-primary"
                onClick={verifyOtp}
                disabled={otp.length !== 6 || verifying || countdown === 0}
                style={{ marginBottom: 12 }}
              >
                {verifying ? 'Memverifikasi...' : 'Verifikasi'}
              </button>

              <button
                className="btn-secondary"
                onClick={resendOtp}
                disabled={sendingOtp || countdown > 0}
                style={{ width: '100%', opacity: countdown > 0 ? 0.5 : 1 }}
              >
                {sendingOtp ? 'Mengirim...' : countdown > 0 ? `Kirim Ulang (tunggu ${formatCountdown(countdown)})` : 'Kirim Ulang OTP'}
              </button>

              <button
                onClick={() => { setStep('login'); setOtp(''); setErrorMsg(''); clearInterval(timerRef.current); }}
                style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 12, cursor: 'pointer', marginTop: 12, display: 'block', width: '100%', textAlign: 'center' }}
              >
                ← Ganti email
              </button>
            </>
          )}
        </div></div>
      </div>
    );
  }

  const filtered = services.filter(s => s.service_name?.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <header className="brand-header">
        <div className="header-top">
          <div className="brand-logo">
            <div className="logo-badge"><div className="logo-dot" /><span>Online</span></div>
            <h1>WALZ <span>NEXUS</span></h1>
          </div>
        </div>
        <div className="balance-card">
          <div className="balance-left">
            <div className="balance-label">Saldo Kamu</div>
            <div className="balance-amount">{fmt(balance)}</div>
            <div className="balance-sub">{user?.email}</div>
          </div>
          <button className="btn-balance-action" onClick={() => setTab('deposit')}>+ Top Up</button>
        </div>
      </header>

      <div className="tab-content">
        {tab === 'virtual' && !order && (
          <div>
            <div className="search-bar"><span className="search-icon">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari layanan" /></div>
            {loading ? <div className="empty-state">Memuat...</div> : (
              <div className="service-grid">
                {filtered.map(s => (
                  <div key={s.service_code} className={`service-card ${selected?.service_code === s.service_code ? 'active' : ''}`} onClick={() => setSelected(s)}>
                    <div className="icon-wrapper"><img src={s.service_img} alt="" className="service-icon" /></div>
                    <div className="service-name">{s.service_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 6 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 700 }}>{s.price ? fmt(s.price) : '...'}</span>
                      <span style={{ fontSize: '0.65rem', color: s.stock > 0 ? 'var(--green)' : 'var(--red)' }}>Stok {s.stock ?? '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selected && (
              <div className="checkout-bar">
                <div className="checkout-info"><p>Dipilih</p><h3>{selected.service_name}</h3><span style={{ fontSize: '0.7rem' }}>{fmt(selected.price || 0)}</span></div>
                <button className="btn-glow" onClick={handleOrder} disabled={!selected.price}>Beli</button>
              </div>
            )}
          </div>
        )}

        {tab === 'virtual' && order && (
          <div className="order-card">
            <div className="order-card-body">
              <div className="number-showcase" onClick={() => navigator.clipboard.writeText(order.phone_number)}>
                <div className="showcase-label">Nomor</div>
                <div className="number-text">{order.phone_number}</div>
                <div className="price-tag">{fmt(order.price)}</div>
              </div>
              {order.otp_code ? (
                <div className="otp-showcase"><div className="otp-code">{order.otp_code}</div><div className="otp-msg">{order.otp_msg}</div></div>
              ) : (
                <div className="otp-loading"><p>Menunggu SMS...</p><button className="btn-primary" onClick={checkSms}>Cek SMS</button></div>
              )}
              <button className="btn-secondary" onClick={() => setOrder(null)} style={{ marginTop: 16 }}>Beli Lagi</button>
            </div>
          </div>
        )}

        {tab === 'deposit' && (
          <div>
            {!deposit ? (
              <div className="card"><div className="card-body">
                <div className="input-group"><label>Nominal</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000" /></div>
                <button className="btn-primary" onClick={createDeposit} disabled={!amount}>Buat QRIS</button>
              </div></div>
            ) : (
              <div className="qris-wrapper">
                <img src={deposit.qr_image || deposit.qr_url} alt="QRIS" className="qris-img" />
                <div className="amount-highlight">{fmt(deposit.amount)}</div>
                <button className="btn-primary" onClick={checkDeposit}>Cek Saldo</button>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'virtual' ? 'active' : ''}`} onClick={() => setTab('virtual')}><span className="nav-icon">📞</span><span className="nav-label">Nomor OTP</span></button>
        <button className={`nav-item ${tab === 'deposit' ? 'active' : ''}`} onClick={() => setTab('deposit')}><span className="nav-icon">💸</span><span className="nav-label">Deposit</span></button>
      </nav>
    </>
  );
}
