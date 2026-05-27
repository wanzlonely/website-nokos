import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { redis, getUserByEmail, updateProfile, createSession } from '@/lib/redis';

export async function POST(request) {
  const { resetToken, newPassword } = await request.json();

  if (!resetToken || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ success: false, msg: 'Data tidak valid atau password minimal 6 karakter' });
  }

  const email = await redis.get(`reset:${resetToken}`);
  if (!email) {
    return NextResponse.json({ success: false, msg: 'Token reset tidak valid atau sudah expired' });
  }

  const user = await getUserByEmail(email);
  if (!user || !user.id) {
    return NextResponse.json({ success: false, msg: 'Akun tidak ditemukan' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateProfile(email, { passwordHash });
  await redis.del(`reset:${resetToken}`);

  const token = await createSession(user.id);
  const res = NextResponse.json({
    success: true,
    msg: 'Password berhasil direset',
    user: { email: user.email, balance: Number(user.balance || 0), username: user.username }
  });
  res.cookies.set('walz_session', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
