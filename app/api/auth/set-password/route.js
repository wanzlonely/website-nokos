import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { redis, getUserById, updateProfile } from '@/lib/redis';

async function getUser(request) {
  const token = request.cookies.get('walz_session')?.value;
  if (!token) return null;
  const userId = await redis.get(`session:${token}`);
  if (!userId) return null;
  return getUserById(userId);
}

export async function POST(request) {
  const { currentPassword, newPassword, setupMode, username } = await request.json();

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ success: false, msg: 'Password minimal 6 karakter' });
  }

  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ success: false, msg: 'Sesi berakhir, silakan login ulang' }, { status: 401 });
  }

  if (user.passwordHash && !setupMode) {
    if (!currentPassword) {
      return NextResponse.json({ success: false, msg: 'Masukkan password saat ini' });
    }
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json({ success: false, msg: 'Password saat ini salah' });
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updates = { passwordHash };
  if (setupMode && username) {
    updates.username = username.trim();
  }

  try {
    await updateProfile(user.email, updates);
    return NextResponse.json({ success: true, msg: 'Data berhasil disimpan' });
  } catch (error) {
    return NextResponse.json({ success: false, msg: error.message });
  }
}
