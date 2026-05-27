import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

export async function POST(request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ success: false, msg: 'Email tidak boleh kosong' });

  const emailKey = email.toLowerCase();

  // Anti double-request: jika OTP sudah dikirim dalam 60 detik terakhir, skip
  const cooldownKey = `otp_cooldown:${emailKey}`;
  const hasCooldown = await redis.get(cooldownKey);
  if (hasCooldown) {
    return NextResponse.json({ success: true });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Simpan sebagai string eksplisit agar tidak di-auto-convert Redis SDK
  await redis.set(`otp:${emailKey}`, code, { ex: 300 });
  await redis.set(cooldownKey, '1', { ex: 60 });

  try {
    await transporter.sendMail({
      from: `"Walz Nexus" <${process.env.GMAIL_USER}>`,
      to: email,
      // Tanpa emoji di subject agar tidak masuk spam
      subject: 'Kode OTP Walz Nexus - ' + code,
      // Header tambahan agar tidak dianggap spam
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'Walz Nexus Mailer',
      },
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden">
              <tr>
                <td style="background:#1a1a2e;padding:24px;text-align:center">
                  <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px">WALZ </span>
                  <span style="color:#4f8ef7;font-size:20px;font-weight:bold;letter-spacing:2px">NEXUS</span>
                </td>
              </tr>
              <tr>
                <td style="padding:32px">
                  <p style="color:#333;margin:0 0 8px;font-size:15px">Halo, <strong>${email}</strong></p>
                  <p style="color:#666;margin:0 0 24px;font-size:14px">Berikut kode verifikasi untuk masuk ke akun Walz Nexus kamu:</p>
                  <div style="background:#f0f4ff;border:2px solid #4f8ef7;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">
                    <span style="font-size:38px;font-weight:bold;letter-spacing:10px;color:#1a1a2e;font-family:'Courier New',monospace">${code}</span>
                  </div>
                  <p style="color:#e67e22;margin:0 0 4px;font-size:13px;font-weight:bold">Kode berlaku selama 5 menit.</p>
                  <p style="color:#999;margin:0;font-size:12px">Jangan bagikan kode ini kepada siapapun termasuk pihak Walz Nexus.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9f9f9;padding:16px;text-align:center">
                  <p style="color:#bbb;font-size:11px;margin:0">Jika kamu tidak meminta kode ini, abaikan email ini.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    await redis.del(cooldownKey);
    return NextResponse.json({ success: false, msg: 'Gagal mengirim email, coba lagi' });
  }
}
