import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ success: false });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${email.toLowerCase()}`, code, { ex: 300 });
  console.log(`OTP for ${email}: ${code}`);
  return NextResponse.json({ success: true });
}