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

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.set(`otp:${email.toLowerCase()}`, code, { ex: 300 });

  try {
    await transporter.sendMail({
      from: `"Walz Nexus" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Kode OTP Walz Nexus',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:auto;background:#0d1117;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px">WALZ <span style="color:#4f8ef7">NEXUS</span></h1>
          </div>
          <div style="padding:32px;background:#161b22">
            <p style="color:#8b949e;margin:0 0 8px">Halo, <strong style="color:#e6edf3">${email}</strong></p>
            <p style="color:#8b949e;margin:0 0 24px">Berikut kode OTP kamu untuk masuk ke Walz Nexus:</p>
            <div style="background:#0d1117;border:1px solid #30363d;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <div style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#4f8ef7;font-family:monospace">${code}</div>
            </div>
            <div style="background:#1c2128;border-left:3px solid #f0883e;border-radius:4px;padding:12px 16px;margin-bottom:24px">
              <p style="color:#f0883e;margin:0;font-size:13px">⏰ Kode ini hanya berlaku selama <strong>5 menit</strong>.</p>
              <p style="color:#8b949e;margin:4px 0 0;font-size:12px">Jangan bagikan kode ini kepada siapapun.</p>
            </div>
            <p style="color:#484f58;font-size:12px;text-align:center;margin:0">Jika kamu tidak meminta kode ini, abaikan email ini.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return NextResponse.json({ success: false, msg: 'Gagal mengirim email, coba lagi' });
  }
}
