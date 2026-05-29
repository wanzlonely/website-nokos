import md5 from 'md5';

const BASE_URL = 'https://api.digiflazz.com/v1';

function getCredentials() {
  return {
    username: process.env.DIGIFLAZZ_USERNAME,
    apiKey: process.env.DIGIFLAZZ_API_KEY,
  };
}

function makeSign(...parts) {
  return md5(parts.join(''));
}

async function digiflazzRequest(endpoint, payload) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Cek Saldo Digiflazz
export async function cekSaldo() {
  const { username, apiKey } = getCredentials();
  const sign = makeSign(username, apiKey, 'depo');
  return digiflazzRequest('/cek-saldo', { cmd: 'deposit', username, sign });
}

// Daftar Harga Prabayar
export async function daftarHargaPrabayar() {
  const { username, apiKey } = getCredentials();
  const sign = makeSign(username, apiKey, 'pricelist');
  return digiflazzRequest('/price-list', { cmd: 'prepaid', username, sign });
}

// Daftar Harga Pascabayar
export async function daftarHargaPascabayar() {
  const { username, apiKey } = getCredentials();
  const sign = makeSign(username, apiKey, 'pricelist');
  return digiflazzRequest('/price-list', { cmd: 'pasca', username, sign });
}

// Topup Prabayar
export async function topupPrabayar({ skuCode, customerNo, refId, testing = false, maxPrice, cbUrl }) {
  const { username, apiKey } = getCredentials();
  const sign = makeSign(username, apiKey, refId);
  const payload = { username, buyer_sku_code: skuCode, customer_no: customerNo, ref_id: refId, sign };
  if (testing) payload.testing = true;
  if (maxPrice) payload.max_price = maxPrice;
  if (cbUrl) payload.cb_url = cbUrl;
  return digiflazzRequest('/transaction', payload);
}

// Cek Tagihan Pascabayar
export async function cekTagihan({ skuCode, customerNo, refId }) {
  const { username, apiKey } = getCredentials();
  const sign = makeSign(username, apiKey, refId);
  return digiflazzRequest('/transaction', {
    commands: 'inq-pasca',
    username,
    buyer_sku_code: skuCode,
    customer_no: customerNo,
    ref_id: refId,
    sign,
  });
}

// Bayar Tagihan Pascabayar
export async function bayarTagihan({ trId }) {
  const { username, apiKey } = getCredentials();
  const sign = makeSign(username, apiKey, String(trId));
  return digiflazzRequest('/transaction', {
    commands: 'pay-pasca',
    username,
    tr_id: trId,
    sign,
  });
}

// Cek Status Transaksi
export async function cekStatusTransaksi({ refId }) {
  const { username, apiKey } = getCredentials();
  const sign = makeSign(username, apiKey, 'cs');
  return digiflazzRequest('/transaction', {
    commands: 'checkstatus',
    username,
    ref_id: refId,
    sign,
  });
}

// Generate ref_id unik
export function generateRefId(prefix = 'TRX') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
