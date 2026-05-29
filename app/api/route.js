import { NextResponse } from 'next/server';
import {
  redis,
  PROFIT,
  getUserById,
  deductBalance,
  updateProfile,
  addBalance,
  getUserByEmail
} from '@/lib/redis';
import {
  cekSaldo as digiflazzCekSaldo,
  daftarHargaPrabayar,
  daftarHargaPascabayar,
  topupPrabayar,
  cekTagihan,
  bayarTagihan,
  cekStatusTransaksi,
  generateRefId,
} from '@/lib/digiflazz';

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
  return (
    process.env[`RUMAHOTP_KEY_${svc}`] ||
    process.env.RUMAHOTP_API_KEY
  );
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
    if (!user) {
      return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });
    }
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
    if (!user) {
      return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });
    }
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
    const r = await fetch(url, {
      headers: { 'x-apikey': key, accept: 'application/json' },
      cache: 'no-store'
    });
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
    const r = await fetch(url, {
      headers: { 'x-apikey': key, accept: 'application/json' },
      cache: 'no-store'
    });
    const data = await r.json();
    return NextResponse.json(data);
  }

  if (!user) {
    return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });
  }

  if (endpoint === 'history') {
    const keys = await redis.lrange(`history:${user.id}`, 0, 49);
    if (!keys || keys.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    const keyAPI = getApiKey({});
    const data = await Promise.all(
      keys.map(async k => {
        let item = await redis.hgetall(k);
        if (!item) return null;
        const id = k.split(':')[1];
        const itemType = k.startsWith('order:') ? 'order' : 'deposit';
        if (item.status === 'credited' && itemType === 'deposit') {
          await redis.hset(k, { status: 'completed' });
          item.status = 'completed';
        }
        if (item.status === 'pending' && itemType === 'deposit') {
          try {
            const r = await fetch(`${BASE}/v2/deposit/get_status?deposit_id=${id}`, {
              headers: { 'x-apikey': keyAPI, accept: 'application/json' }
            });
            const resData = await r.json();
            if (resData.success && resData.data && (resData.data.status === 'success' || resData.data.status === 'paid')) {
              const freshItem = await redis.hgetall(k);
              if (freshItem && freshItem.status === 'pending') {
                await redis.hset(k, { status: 'completed' });
                await addBalance(user.id, Number(item.diterima || item.amount));
              }
              item.status = 'completed';
            } else if (resData.data && resData.data.status === 'cancel') {
              await redis.hset(k, { status: 'canceled' });
              item.status = 'canceled';
            }
          } catch (e) { }
        } else if (item.status === 'waiting' && itemType === 'order') {
          try {
            const r = await fetch(`${BASE}/v1/orders/get_status?order_id=${id}`, {
              headers: { 'x-apikey': keyAPI, accept: 'application/json' }
            });
            const resData = await r.json();
            if (resData.success && resData.data?.otp_code && resData.data.otp_code !== '-' && resData.data.otp_code.trim().length > 1) {
              await redis.hset(k, { status: 'completed', otp_code: resData.data.otp_code, otp_msg: resData.data.otp_msg });
              item.status = 'completed';
              item.otp_code = resData.data.otp_code;
              item.otp_msg = resData.data.otp_msg;
            } else if (resData.data?.status === 'cancel') {
              await redis.hset(k, { status: 'canceled' });
              item.status = 'canceled';
            }
          } catch (e) { }
        }
        return { ...item, id, itemType };
      })
    );
    return NextResponse.json({ success: true, data: data.filter(Boolean) });
  }

  if (endpoint === 'deposit_create') {
    const key = getApiKey({});
    const url = `${BASE}${ENDPOINTS.deposit_create}?amount=${payload.amount}&payment_id=qris`;
    const r = await fetch(url, { headers: { 'x-apikey': key, accept: 'application/json' } });
    const data = await r.json();
    if (data.success && data.data) {
      const actualAmt = data.data.diterima || data.data.amount || data.data.total || payload.amount;
      const depId = data.data.id || data.data.deposit_id;
      const qrImage = data.data.qr_image || data.data.qr_url || '';
      const expiredAt = data.data.expired_at || data.data.expire_time || data.data.expired || '';
      const expiredAtMs = expiredAt ? (isNaN(Number(expiredAt)) ? new Date(expiredAt).getTime() : Number(expiredAt)) : Date.now() + 20 * 60 * 1000;
      const feeAmt = Number(data.data.fee || 0);
      const diterimaAmt = Number(data.data.diterima || payload.amount);
      const totalAmt = Number(data.data.total || diterimaAmt + feeAmt);
      await redis.hset(`deposit:${depId}`, {
        userId: user.id,
        fee: feeAmt,
        diterima: diterimaAmt,
        total: totalAmt,
        amount: diterimaAmt,
        base_amount: Number(payload.amount),
        qr_image: qrImage,
        status: 'pending',
        timestamp: Date.now(),
        expired_at: String(expiredAtMs)
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
      if (!dep || dep.userId !== user.id) {
        return NextResponse.json({ success: false, msg: 'Deposit tidak valid' });
      }
      if (dep && dep.status === 'pending') {
        await redis.hset(`deposit:${payload.deposit_id}`, { status: 'completed' });
        const newBalance = await addBalance(user.id, Number(dep.diterima || dep.amount));
        return NextResponse.json({ success: true, status: 'paid', new_balance: newBalance, msg: 'Deposit berhasil ditambahkan' });
      } else if (dep && (dep.status === 'completed' || dep.status === 'credited')) {
        if (dep.status === 'credited') await redis.hset(`deposit:${payload.deposit_id}`, { status: 'completed' });
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
    const countryRes = await fetch(`${BASE}/v2/countries?service_id=${payload.service_id}`, {
      headers: { 'x-apikey': key, accept: 'application/json' }
    });
    const countryData = await countryRes.json();
    const targetCountry = countryData.data?.find(c => String(c.number_id) === String(payload.number_id)) || countryData.data?.[0];
    const provider = targetCountry?.pricelist?.find(p => String(p.provider_id) === String(payload.provider_id)) || targetCountry?.pricelist?.[0];
    const basePrice = Number(provider?.price || 0);
    const sellPrice = basePrice + PROFIT;
    try {
      await deductBalance(user.id, sellPrice);
    } catch (e) {
      const isInsufficient = e.message?.toLowerCase().includes('tidak cukup') || e.message?.toLowerCase().includes('insufficient') || e.message?.toLowerCase().includes('kurang');
      return NextResponse.json({
        success: false,
        msg: isInsufficient ? 'Saldo tidak cukup untuk melakukan pembelian ini.' : e.message,
        error_code: isInsufficient ? 'INSUFFICIENT_BALANCE' : 'ORDER_ERROR',
        required: sellPrice,
      });
    }
    const params = new URLSearchParams({
      number_id: payload.number_id,
      provider_id: payload.provider_id,
      service_id: payload.service_id,
      operator_id: payload.operator_id
    });
    const r = await fetch(`${BASE}${ENDPOINTS.order_create}?${params}`, {
      headers: { 'x-apikey': key, accept: 'application/json' }
    });
    const data = await r.json();
    if (data.success && data.data) {
      data.data.price = sellPrice;
      data.data.base_price = basePrice;
      await redis.hset(`order:${data.data.order_id}`, {
        userId: user.id,
        service_id: payload.service_id,
        service_name: payload.service_name || 'Virtual Number',
        service_img: payload.service_img || '',
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
    if (!orderData || orderData.userId !== user.id) {
      return NextResponse.json({ success: false, msg: 'Order tidak valid' });
    }
    const key = getApiKey({ service_id: orderData.service_id });
    const url = `${BASE}/v1/orders/set_status?order_id=${payload.order_id}&status=cancel`;
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
    if (data.success && data.data) {
      if (data.data.otp_code && data.data.otp_code !== '-' && data.data.otp_code.trim().length > 1) {
        await redis.hset(`order:${payload.order_id}`, { status: 'completed', otp_code: data.data.otp_code, otp_msg: data.data.otp_msg || '' });
      } else if (data.data.status === 'cancel') {
        await redis.hset(`order:${payload.order_id}`, { status: 'canceled' });
      }
    }
    return NextResponse.json(data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIGIFLAZZ – PPOB (Prabayar & Pascabayar)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Cek Saldo Digiflazz ───────────────────────────────────────────────────
  if (endpoint === 'ppob_saldo') {
    if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });
    try {
      const result = await digiflazzCekSaldo();
      return NextResponse.json({ success: true, data: result.data });
    } catch (e) {
      return NextResponse.json({ success: false, msg: 'Gagal cek saldo Digiflazz' });
    }
  }

  // ── Daftar Harga Prabayar (pulsa, data, token listrik, game, dll) ─────────
  if (endpoint === 'ppob_harga_prabayar') {
    try {
      const result = await daftarHargaPrabayar();
      const products = (result.data || []).map(p => ({
        ...p,
        base_price: Number(p.price),
        price: Number(p.price) + PROFIT,
      }));
      return NextResponse.json({ success: true, data: products });
    } catch (e) {
      return NextResponse.json({ success: false, msg: 'Gagal mengambil daftar harga prabayar' });
    }
  }

  // ── Daftar Harga Pascabayar (PLN, PDAM, BPJS, dll) ───────────────────────
  if (endpoint === 'ppob_harga_pascabayar') {
    try {
      const result = await daftarHargaPascabayar();
      return NextResponse.json({ success: true, data: result.data || [] });
    } catch (e) {
      return NextResponse.json({ success: false, msg: 'Gagal mengambil daftar harga pascabayar' });
    }
  }

  // ── Topup Prabayar ────────────────────────────────────────────────────────
  if (endpoint === 'ppob_topup') {
    if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });

    const { sku_code, customer_no, base_price = 0, product_name = 'Produk Prabayar' } = payload;
    if (!sku_code || !customer_no) {
      return NextResponse.json({ success: false, msg: 'sku_code dan customer_no wajib diisi' });
    }

    const sellPrice = Number(base_price) + PROFIT;
    const refId = generateRefId('PRE');

    // Potong saldo
    try {
      await deductBalance(user.id, sellPrice);
    } catch (e) {
      return NextResponse.json({
        success: false,
        msg: 'Saldo tidak cukup untuk melakukan pembelian ini.',
        error_code: 'INSUFFICIENT_BALANCE',
        required: sellPrice,
      });
    }

    let result;
    try {
      result = await topupPrabayar({ skuCode: sku_code, customerNo: customer_no, refId });
    } catch (e) {
      await addBalance(user.id, sellPrice);
      return NextResponse.json({ success: false, msg: 'Gagal terhubung ke provider' });
    }

    const tx = result?.data;

    // Kembalikan saldo jika langsung Gagal
    if (tx?.status === 'Gagal') {
      await addBalance(user.id, sellPrice);
    }

    // Simpan ke history Redis
    await redis.hset(`ppob:${refId}`, {
      userId: user.id,
      ref_id: refId,
      sku_code,
      customer_no,
      product_name,
      sell_price: sellPrice,
      base_price: Number(base_price),
      status: tx?.status || 'Pending',
      rc: tx?.rc || '',
      sn: tx?.sn || '',
      message: tx?.message || '',
      type: 'prabayar',
      timestamp: Date.now(),
    });
    await redis.lpush(`history_ppob:${user.id}`, `ppob:${refId}`);

    return NextResponse.json({
      success: tx?.status === 'Sukses',
      status: tx?.status || 'Pending',
      ref_id: refId,
      sn: tx?.sn || '',
      message: tx?.message || '',
      rc: tx?.rc || '',
      price: tx?.price,
      buyer_last_saldo: tx?.buyer_last_saldo,
    });
  }

  // ── Cek Tagihan Pascabayar ────────────────────────────────────────────────
  if (endpoint === 'ppob_cek_tagihan') {
    if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });

    const { sku_code, customer_no } = payload;
    if (!sku_code || !customer_no) {
      return NextResponse.json({ success: false, msg: 'sku_code dan customer_no wajib diisi' });
    }

    const refId = generateRefId('INQ');
    try {
      const result = await cekTagihan({ skuCode: sku_code, customerNo: customer_no, refId });
      const tx = result?.data;

      // Simpan data inquiry sementara di Redis (dipakai saat bayar)
      if (tx?.tr_id) {
        await redis.hset(`ppob_inquiry:${tx.tr_id}`, {
          userId: user.id,
          ref_id: refId,
          sku_code,
          customer_no,
          tr_id: String(tx.tr_id),
          tr_name: tx.tr_name || '',
          nominal: tx.nominal || 0,
          admin: tx.admin || 0,
          price: tx.price || 0,
          selling_price: tx.selling_price || 0,
          period: tx.period || '',
          rc: tx.response_code || '',
          timestamp: Date.now(),
        });
        // Expire otomatis 30 menit (data inquiry hanya berlaku sementara)
        await redis.expire(`ppob_inquiry:${tx.tr_id}`, 1800);
      }

      return NextResponse.json({ success: true, data: tx });
    } catch (e) {
      return NextResponse.json({ success: false, msg: 'Gagal mengecek tagihan' });
    }
  }

  // ── Bayar Tagihan Pascabayar ──────────────────────────────────────────────
  if (endpoint === 'ppob_bayar_tagihan') {
    if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });

    const { tr_id } = payload;
    if (!tr_id) {
      return NextResponse.json({ success: false, msg: 'tr_id wajib diisi' });
    }

    const inquiry = await redis.hgetall(`ppob_inquiry:${tr_id}`);
    if (!inquiry || inquiry.userId !== user.id) {
      return NextResponse.json({ success: false, msg: 'Data inquiry tidak valid atau sudah kadaluarsa' });
    }

    const sellPrice = Number(inquiry.selling_price) + PROFIT;

    try {
      await deductBalance(user.id, sellPrice);
    } catch (e) {
      return NextResponse.json({
        success: false,
        msg: 'Saldo tidak cukup',
        error_code: 'INSUFFICIENT_BALANCE',
        required: sellPrice,
      });
    }

    let result;
    try {
      result = await bayarTagihan({ trId: tr_id });
    } catch (e) {
      await addBalance(user.id, sellPrice);
      return NextResponse.json({ success: false, msg: 'Gagal terhubung ke provider' });
    }

    const tx = result?.data;
    const isSuccess = tx?.response_code === '00';
    const isPending = tx?.response_code === '39' || tx?.response_code === '05' || tx?.response_code === '201';

    // Kembalikan saldo jika gagal (bukan pending)
    if (!isSuccess && !isPending) {
      await addBalance(user.id, sellPrice);
    }

    const refId = inquiry.ref_id || generateRefId('PAY');

    await redis.hset(`ppob:${refId}`, {
      userId: user.id,
      ref_id: refId,
      tr_id: String(tr_id),
      sku_code: inquiry.sku_code || '',
      customer_no: inquiry.customer_no || '',
      tr_name: tx?.tr_name || inquiry.tr_name || '',
      sell_price: sellPrice,
      nominal: tx?.nominal || inquiry.nominal || 0,
      admin: tx?.admin || inquiry.admin || 0,
      price: tx?.price || 0,
      noref: tx?.noref || '',
      status: isSuccess ? 'Sukses' : isPending ? 'Pending' : 'Gagal',
      rc: tx?.response_code || '',
      message: tx?.message || '',
      type: 'pascabayar',
      timestamp: Date.now(),
    });
    await redis.lpush(`history_ppob:${user.id}`, `ppob:${refId}`);

    return NextResponse.json({
      success: isSuccess,
      status: isSuccess ? 'Sukses' : isPending ? 'Pending' : 'Gagal',
      ref_id: refId,
      message: tx?.message || '',
      rc: tx?.response_code || '',
      data: tx,
    });
  }

  // ── Cek Status Transaksi PPOB ─────────────────────────────────────────────
  if (endpoint === 'ppob_cek_status') {
    if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });

    const { ref_id } = payload;
    if (!ref_id) {
      return NextResponse.json({ success: false, msg: 'ref_id wajib diisi' });
    }

    // Pastikan transaksi milik user ini
    const stored = await redis.hgetall(`ppob:${ref_id}`);
    if (!stored || stored.userId !== user.id) {
      return NextResponse.json({ success: false, msg: 'Transaksi tidak ditemukan' });
    }

    try {
      const result = await cekStatusTransaksi({ refId: ref_id });
      const tx = result?.data;

      const newStatus = tx?.response_code === '00' ? 'Sukses'
        : (tx?.response_code === '39' || tx?.response_code === '05' || tx?.response_code === '201') ? 'Pending'
        : 'Gagal';

      if (stored.status !== newStatus) {
        const updates = { status: newStatus, rc: tx?.response_code || '', message: tx?.message || '' };

        // Kembalikan saldo jika sekarang Gagal dan belum pernah di-refund
        if (newStatus === 'Gagal' && stored.sell_price && !stored.refunded) {
          await addBalance(user.id, Number(stored.sell_price));
          updates.refunded = '1';
        }
        await redis.hset(`ppob:${ref_id}`, updates);
      }

      return NextResponse.json({ success: true, status: newStatus, data: tx });
    } catch (e) {
      return NextResponse.json({ success: false, msg: 'Gagal mengecek status transaksi' });
    }
  }

  // ── History Transaksi PPOB ────────────────────────────────────────────────
  if (endpoint === 'ppob_history') {
    if (!user) return NextResponse.json({ success: false, msg: 'Login dulu' }, { status: 401 });

    const keys = await redis.lrange(`history_ppob:${user.id}`, 0, 49);
    if (!keys || keys.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const data = await Promise.all(
      keys.map(async k => {
        const item = await redis.hgetall(k);
        if (!item) return null;
        const ref_id = k.replace('ppob:', '');

        // Auto-refresh status Pending
        if (item.status === 'Pending' && item.ref_id) {
          try {
            const result = await cekStatusTransaksi({ refId: item.ref_id });
            const tx = result?.data;
            if (tx?.response_code === '00') {
              await redis.hset(k, { status: 'Sukses', rc: '00', message: tx.message || '' });
              item.status = 'Sukses';
            } else if (tx?.response_code && tx.response_code !== '39' && tx.response_code !== '05' && tx.response_code !== '201') {
              if (item.sell_price && !item.refunded) {
                await addBalance(user.id, Number(item.sell_price));
                await redis.hset(k, { refunded: '1' });
              }
              await redis.hset(k, { status: 'Gagal', rc: tx.response_code });
              item.status = 'Gagal';
            }
          } catch (e) { /* biarkan status lama */ }
        }

        return { ...item, ref_id };
      })
    );

    return NextResponse.json({ success: true, data: data.filter(Boolean) });
  }

  // ═══════════════════════════════════════════════════════════════════════════

  return NextResponse.json({ success: false, msg: 'Endpoint tidak dikenal' });
}