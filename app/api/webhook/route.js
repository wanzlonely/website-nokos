import { NextResponse } from 'next/server';
import { redis, addBalance } from '@/lib/redis';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // ── Webhook RumahOTP (existing) ────────────────────────────────────────────
  const reqId = request.headers.get('x-requested-id');
  const validId = process.env.RUMAHOTP_WEBHOOK_ID;

  if (validId && reqId === validId) {
    const { category, id } = body;

    if (category === 'callback.deposit') {
      const { diterima } = body;
      const dep = await redis.hgetall(`deposit:${id}`);
      if (dep && dep.status !== 'completed') {
        await addBalance(dep.userId, Number(diterima || 0));
        await redis.hset(`deposit:${id}`, { status: 'completed', completedAt: Date.now() });
      }
      return new NextResponse('OK', { status: 200 });
    }

    if (category === 'callback.number') {
      const { code, text, number } = body;
      await redis.hset(`order:${id}`, { code, text, number, status: 'completed', completedAt: Date.now() });
      const order = await redis.hgetall(`order:${id}`);
      if (order?.userId) {
        await redis.publish(`otp:${order.userId}`, JSON.stringify({ id, code, number, text }));
      }
      return new NextResponse('OK', { status: 200 });
    }

    return new NextResponse('OK', { status: 200 });
  }

  // ── Webhook Digiflazz (PPOB) ───────────────────────────────────────────────
  // Digiflazz mengirim Secret di beberapa kemungkinan lokasi
  const validDigiSecret = process.env.DIGIFLAZZ_WEBHOOK_SECRET;
  if (validDigiSecret) {
    const secretFromHeader = request.headers.get('x-digiflazz-secret')
      || request.headers.get('x-hub-signature')
      || request.headers.get('authorization');
    const secretFromBody = body?.secret || body?.data?.secret;
    const incoming = secretFromHeader || secretFromBody;

    if (incoming !== validDigiSecret) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Digiflazz mengirim payload: { data: { ref_id, status, rc, sn, message, ... } }
  const tx = body?.data;
  if (tx?.ref_id) {
    const stored = await redis.hgetall(`ppob:${tx.ref_id}`);
    if (stored) {
      const updates = {
        status: tx.status || stored.status,
        rc: tx.rc || stored.rc || '',
        message: tx.message || stored.message || '',
        sn: tx.sn || stored.sn || '',
        updatedAt: Date.now(),
      };

      if (tx.status === 'Gagal' && stored.status !== 'Gagal') {
        if (stored.sell_price && !stored.refunded) {
          await addBalance(stored.userId, Number(stored.sell_price));
          updates.refunded = '1';
        }
      }

      await redis.hset(`ppob:${tx.ref_id}`, updates);
    }
  }

  return new NextResponse('OK', { status: 200 });
}
