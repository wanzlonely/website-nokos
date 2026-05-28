import { NextResponse } from 'next/server';
import { redis, PROFIT, getUserById, deductBalance, updateProfile, addBalance, getUserByEmail } from '@/lib/redis';

const BASE = 'https://www.rumahotp.io/api';
const ENDPOINTS = {
  services: '/v2/services',
  countries: '/v2/countries',
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
    if (!user) return NextResponse.json({ success: false, msg: 'Sesi berakhir, silakan login kembali' }, { status: 401 });
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
    if (!user) return NextResponse.json({ success: false, msg: 'Akses ditolak' }, { status: 401 });
    const updates = {};
    if (payload.username !== undefined) updates.username = payload.username.trim();
    try {
      await updateProfile(user.email, updates);
      return NextResponse.json({ success: true, msg: 'Profil berhasil diperbarui' });
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

  if (!user) return NextResponse.json({ success: false, msg: 'Autentikasi diperlukan' }, { status: 401 });

  if (endpoint === 'deposit_create') {
    const key = getApiKey({});
    const url = `${BASE}${ENDPOINTS.deposit_create}?amount=${payload.amount}&payment_id=qris`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();
    if (data.success && data.data) {
      const actualAmt = data.data.amount || data.data.total || payload.amount;
      await redis.hset(`deposit:${data.data.id || data.data.deposit_id}`, { userId: user.id, amount: Number(actualAmt), status: 'pending' });
      return NextResponse.json(data);
    } else {
      const errorMsg = data.message || (typeof data.data === 'string' ? data.data : 'Gagal membuat QRIS.');
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

    const params = new URLSearchParams(payload);
    const r = await fetch(`${BASE}${ENDPOINTS.order_create}?${params}`, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();

    if (data.success && data.data) {
      data.data.price = sellPrice;
      data.data.base_price = basePrice;
      await redis.hset(`order:${data.data.order_id}`, { userId: user.id, service_id: payload.service_id, number: data.data.phone_number, status: 'waiting' });
    } else {
      await addBalance(user.id, sellPrice);
    }
    return NextResponse.json(data);
  }

  if (endpoint === 'order_status') {
    const key = getApiKey({});
    const url = `${BASE}${ENDPOINTS.order_status}?order_id=${payload.order_id}`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();
    if (data.success && data.data?.price) {
      data.data.price = Number(data.data.price) + PROFIT;
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ success: false, msg: 'Endpoint tidak dikenal' });
}
