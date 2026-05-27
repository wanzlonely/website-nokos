import { NextResponse } from 'next/server';
import { redis, getUserByEmail, createUser } from '@/lib/redis';

export async function POST(request) {
  const { email, code } = await request.json();
  const saved = await redis.get(`otp:${email.toLowerCase()}`);
  if (!saved || saved !== code) {
    return NextResponse.json({ success: false, msg: 'OTP salah' });
  }
  await redis.del(`otp:${email.toLowerCase()}`);
  let user = await getUserByEmail(email);
  if (!user || !user.id) {
    user = await createUser(email);
  }
  const token = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  await redis.set(`session:${token}`, user.id, { ex: 60 * 60 * 24 * 30 });
  const res = NextResponse.json({ success: true, user: { email: user.email, balance: Number(user.balance || 0) } });
  res.cookies.set('walz_session', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}