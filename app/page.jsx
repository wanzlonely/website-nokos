'use client';

import { useState, useEffect } from 'react';

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

  const requestOtp = async () => {
    const r = await authApi('request-otp', { email });
    if (r.success) setStep('otp');
  };

  const verifyOtp = async () => {
    const r = await authApi('verify-otp', { email, code: otp });
    if (r.success) {
      setUser(r.user);
      setBalance(r.user.balance);
      setStep('app');
      api('balance').then(res => res.success && setBalance(res.data.balance));
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
              <div className="input-group"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" /></div>
              <button className="btn-primary" onClick={requestOtp} disabled={!email}>Kirim OTP</button>
            </>
          ) : (
            <>
              <div className="input-group"><label>Kode OTP</label><input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6 digit" /></div>
              <button className="btn-primary" onClick={verifyOtp} disabled={otp.length !== 6}>Verifikasi</button>
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