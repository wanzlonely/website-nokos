import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createSession } from '@/lib/redis';

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ success: false, msg: 'Email dan password wajib diisi' });
  }

  const user = await getUserByEmail(email);
  if (!user || !user.id) {
    return NextResponse.json({ success: false, msg: 'Akun tidak ditemukan, gunakan OTP untuk daftar' });
  }

  if (!user.passwordHash) {
    return NextResponse.json({ success: false, msg: 'Password belum diatur, gunakan OTP untuk masuk' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return NextResponse.json({ success: false, msg: 'Password salah' });
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
