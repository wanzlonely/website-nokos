import { NextResponse } from 'next/server';
import { redis, addBalance } from '@/lib/redis';

export async function POST(request) {
  const reqId = request.headers.get('x-requested-id');
  const validId = process.env.RUMAHOTP_WEBHOOK_ID;

  if (validId && reqId !== validId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const body = await request.json();
  const { category, id } = body;

  if (category === 'callback.deposit') {
    const { diterima } = body;
    const dep = await redis.hgetall(`deposit:${id}`);

    if (dep && dep.status !== 'completed') {
      await addBalance(dep.userId, Number(diterima || 0));

      await redis.hset(`deposit:${id}`, {
        status: 'completed',
        completedAt: Date.now(),
      });
    }

    return new NextResponse('OK', { status: 200 });
  }

  if (category === 'callback.number') {
    const { code, text, number } = body;

    await redis.hset(`order:${id}`, {
      code,
      text,
      number,
      status: 'completed',
      completedAt: Date.now(),
    });

    const order = await redis.hgetall(`order:${id}`);

    if (order?.userId) {
      await redis.publish(
        `otp:${order.userId}`,
        JSON.stringify({
          id,
          code,
          number,
          text,
        })
      );
    }

    return new NextResponse('OK', { status: 200 });
  }

  return new NextResponse('OK', { status: 200 });
}