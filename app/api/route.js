import { NextResponse } from 'next/server';
import { redis, PROFIT, getUserById, deductBalance, updateProfile, addBalance, getUserByEmail } from '@/lib/redis';

const BASE = 'https://www.rumahotp.io/api';
const ENDPOINTS = {
  services: '/v2/services',
  countries: '/v2/countries',
  operators: '/v2/operators',
  order_create: '/v2/orders',
  order_status: '/v1/orders/get_status',
  deposit_create: '/v2/deposit/create',
  deposit_status: '/v2/deposit/get_status',
  deposit_cancel: '/v1/deposit/cancel',
  h2h_product: '/v1/h2h/product',
};

function getApiKey(payload = {}) {
  const svc = (payload.service_id || '').toString().toUpperCase();
  return process.env[`RUMAHOTP_KEY_${svc}`] || process.env.RUMAHOTP_API_KEY;
}

async function getUser(request) {
  const token = request.cookies.get('walz_session')?.value;
  if (!token) return null;
  const userId = await redis.get(`session:${token}`);
  if (!userId) return null;
  return getUserById(userId);
}

export async function POST(request) {
  const body = await request.json();
  const { endpoint, ...payload } = body;
  const user = await getUser(request);

  if (endpoint === 'check_email') {
    const u = await getUserByEmail(payload.email);
    return NextResponse.json({ exists: !!(u && u.id) });
  }

  if (endpoint === 'balance') {
    if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });
    return NextResponse.json({
      success: true,
      data: {
        balance: Number(user.balance || 0),
        email: user.email,
        username: user.username || '',
        hasPassword: !!user.passwordHash,
      }
    });
  }

  if (endpoint === 'profile_update') {
    if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });
    const updates = {};
    if (payload.username !== undefined) updates.username = payload.username.trim();
    try {
      await updateProfile(user.email, updates);
      return NextResponse.json({ success: true, msg: 'Profil berhasil disimpan' });
    } catch (error) {
      return NextResponse.json({ success: false, msg: error.message });
    }
  }

  if (endpoint === 'logout') {
    const token = request.cookies.get('walz_session')?.value;
    if (token) await redis.del(`session:${token}`);
    const res = NextResponse.json({ success: true });
    res.cookies.set('walz_session', '', { maxAge: 0, path: '/' });
    return res;
  }

  if (endpoint === 'h2h_products') {
    try {
      const url = `${BASE}${ENDPOINTS.h2h_product}`;
      const r = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
      const data = await r.json();
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ success: false, msg: 'Sistem sedang maintenance' });
    }
  }

  if (endpoint === 'services' || endpoint === 'countries') {
    const key = getApiKey(payload);
    const params = new URLSearchParams(payload);
    const url = `${BASE}${ENDPOINTS[endpoint]}${params.toString() ? '?' + params : ''}`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' }, cache: 'no-store' });
    const data = await r.json();
    
    if (endpoint === 'countries' && Array.isArray(data?.data)) {
      data.data.forEach(c => {
        if (Array.isArray(c.pricelist)) {
          c.pricelist.forEach(p => {
            const base = Number(p.price) || 0;
            p.base_price = base;
            p.price = base + PROFIT; 
          });
        }
      });
    }
    return NextResponse.json(data);
  }

  if (endpoint === 'operators') {
    const key = getApiKey(payload);
    const params = new URLSearchParams({ country: payload.country, provider_id: payload.provider_id });
    const url = `${BASE}${ENDPOINTS.operators}?${params}`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' }, cache: 'no-store' });
    const data = await r.json();
    return NextResponse.json(data);
  }

  if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });

  if (endpoint === 'history') {
    const keys = await redis.lrange(`history:${user.id}`, 0, 49);
    if (!keys || keys.length === 0) return NextResponse.json({ success: true, data: [] });
    
    const data = await Promise.all(keys.map(async k => {
      const item = await redis.hgetall(k);
      if (!item) return null;
      return { ...item, id: k.split(':')[1], itemType: k.startsWith('order:') ? 'order' : 'deposit' };
    }));

    return NextResponse.json({ success: true, data: data.filter(Boolean) });
  }

  if (endpoint === 'deposit_create') {
    const key = getApiKey({});
    const url = `${BASE}${ENDPOINTS.deposit_create}?amount=${payload.amount}&payment_id=qris`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();
    if (data.success && data.data) {
      const actualAmt = data.data.amount || data.data.total || payload.amount;
      const depId = data.data.id || data.data.deposit_id;
      await redis.hset(`deposit:${depId}`, { 
        userId: user.id, 
        amount: Number(actualAmt), 
        status: 'pending',
        timestamp: Date.now()
      });
      await redis.lpush(`history:${user.id}`, `deposit:${depId}`);
      return NextResponse.json(data);
    } else {
      const errorMsg = typeof data.data === 'string' ? data.data : (data.message || 'Gagal membuat QRIS.');
      return NextResponse.json({ success: false, msg: errorMsg });
    }
  }

  if (endpoint === 'deposit_status') {
    const key = getApiKey({});
    const url = `${BASE}${ENDPOINTS.deposit_status}?deposit_id=${payload.deposit_id}`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();
    
    if (data.success && data.data && (data.data.status === 'success' || data.data.status === 'paid')) {
      const dep = await redis.hgetall(`deposit:${payload.deposit_id}`);
      if (dep && dep.status === 'pending') {
        await redis.hset(`deposit:${payload.deposit_id}`, { status: 'completed' });
        const newBalance = await addBalance(user.id, dep.amount);
        return NextResponse.json({ success: true, status: 'paid', new_balance: newBalance, msg: 'Deposit berhasil ditambahkan' });
      } else if (dep && dep.status === 'completed') {
        const u = await getUserById(user.id);
        return NextResponse.json({ success: true, status: 'paid', new_balance: u.balance, msg: 'Deposit sudah diproses' });
      }
    }
    return NextResponse.json(data);
  }

  if (endpoint === 'deposit_cancel') {
    const key = getApiKey({});
    const url = `${BASE}${ENDPOINTS.deposit_cancel}?deposit_id=${payload.deposit_id}`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();
    if (data.success) {
      await redis.hset(`deposit:${payload.deposit_id}`, { status: 'canceled' });
    }
    return NextResponse.json(data);
  }

  if (endpoint === 'order_create') {
    const key = getApiKey(payload);
    const countryRes = await fetch(`${BASE}/v2/countries?service_id=${payload.service_id}`, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const countryData = await countryRes.json();
    const targetCountry = countryData.data?.find(c => String(c.number_id) === String(payload.number_id)) || countryData.data?.[0];
    const provider = targetCountry?.pricelist?.find(p => String(p.provider_id) === String(payload.provider_id)) || targetCountry?.pricelist?.[0];
    
    const basePrice = Number(provider?.price || 0);
    const sellPrice = basePrice + PROFIT;

    try {
      await deductBalance(user.id, sellPrice);
    } catch (e) {
      return NextResponse.json({ success: false, msg: e.message });
    }

    const params = new URLSearchParams({
      number_id: payload.number_id,
      provider_id: payload.provider_id,
      service_id: payload.service_id,
      operator_id: payload.operator_id
    });

    const r = await fetch(`${BASE}${ENDPOINTS.order_create}?${params}`, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();

    if (data.success && data.data) {
      data.data.price = sellPrice;
      data.data.base_price = basePrice;
      await redis.hset(`order:${data.data.order_id}`, { 
        userId: user.id, 
        service_id: payload.service_id, 
        number: data.data.phone_number, 
        country: targetCountry?.name || '',
        operator: payload.operator_id || 'any',
        status: 'waiting',
        price: sellPrice,
        timestamp: Date.now()
      });
      await redis.lpush(`history:${user.id}`, `order:${data.data.order_id}`);
    } else {
      await addBalance(user.id, sellPrice);
      data.msg = data.message || data.data || 'Stock penyedia habis, tunggu beberapa saat.';
    }
    return NextResponse.json(data);
  }

  if (endpoint === 'order_cancel') {
    const orderKey = `order:${payload.order_id}`;
    const orderData = await redis.hgetall(orderKey);
    if (!orderData || orderData.userId !== user.id) return NextResponse.json({ success: false, msg: 'Order tidak valid' });

    const key = getApiKey({}); 
    const url = `${BASE}${ENDPOINTS.order_status.replace('get_status', 'set_status')}?order_id=${payload.order_id}&status=cancel`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();

    if (data.success || (data.message && data.message.includes('cancel'))) {
      if (orderData.status !== 'canceled') {
        await addBalance(user.id, Number(orderData.price));
        await redis.hset(orderKey, { status: 'canceled' });
      }
      return NextResponse.json({ success: true, msg: 'Pesanan berhasil dibatalkan.' });
    } else {
      return NextResponse.json({ success: false, msg: data.message || data.data || 'Gagal membatalkan pesanan.' });
    }
  }

  if (endpoint === 'order_status') {
    const key = getApiKey({});
    const url = `${BASE}${ENDPOINTS.order_status}?order_id=${payload.order_id}`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();
    if (data.success && data.data?.price) {
      data.data.price = Number(data.data.price) + PROFIT;
      if (data.data.otp_code) {
        await redis.hset(`order:${payload.order_id}`, { status: 'completed' });
      } else if (data.data.status === 'cancel') {
        await redis.hset(`order:${payload.order_id}`, { status: 'canceled' });
      }
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ success: false, msg: 'Endpoint tidak dikenal' });
}
