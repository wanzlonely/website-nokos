import { NextResponse } from 'next/server';
import { redis, getUserByEmail, createUser, createSession } from '@/lib/redis';

export async function POST(request) {
  const { email, code, mode } = await request.json();
  // mode: 'login' (default) | 'reset' (forgot password)
  const emailKey = email.toLowerCase();

  const saved = await redis.get(`otp:${emailKey}`);
  if (!saved || String(saved) !== String(code)) {
    return NextResponse.json({ success: false, msg: 'OTP salah atau sudah expired' });
  }

  await redis.del(`otp:${emailKey}`);
  await redis.del(`otp_cooldown:${emailKey}`);

  // For password reset: issue a short-lived reset token instead of a session
  if (mode === 'reset') {
    const resetToken = 'rst_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await redis.set(`reset:${resetToken}`, emailKey, { ex: 60 * 10 }); // 10 minutes
    return NextResponse.json({ success: true, resetToken });
  }

  // Normal login flow
  let user = await getUserByEmail(email);
  if (!user || !user.id) {
    user = await createUser(email);
  }

  const token = await createSession(user.id);

  const res = NextResponse.json({
    success: true,
    user: { email: user.email, balance: Number(user.balance || 0) }
  });
  res.cookies.set('walz_session', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
