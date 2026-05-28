import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();
export const PROFIT = 1000;

export async function getUserByEmail(email) {
  return await redis.hgetall(`user:email:${email.toLowerCase()}`);
}

export async function getUserByUsername(username) {
  const email = await redis.get(`user:username:${username.toLowerCase()}`);
  if (!email) return null;
  return getUserByEmail(email);
}

export async function createUser(email) {
  const id = 'u_' + Math.random().toString(36).slice(2, 10);
  const user = { id, email: email.toLowerCase(), balance: 0, createdAt: Date.now() };
  await redis.hset(`user:email:${email.toLowerCase()}`, user);
  await redis.set(`user:id:${id}`, email.toLowerCase());
  return user;
}

export async function getUserById(id) {
  const email = await redis.get(`user:id:${id}`);
  if (!email) return null;
  return getUserByEmail(email);
}

export async function addBalance(userId, amount) {
  const user = await getUserById(userId);
  if (!user) return 0;
  const newBal = Number(user.balance || 0) + Number(amount);
  await redis.hset(`user:email:${user.email}`, { balance: newBal });
  return newBal;
}

export async function deductBalance(userId, amount) {
  const user = await getUserById(userId);
  const bal = Number(user.balance || 0);
  if (bal < amount) throw new Error('Saldo tidak cukup');
  const newBal = bal - amount;
  await redis.hset(`user:email:${user.email}`, { balance: newBal });
  return newBal;
}

export async function updateProfile(email, updates) {
  const oldUser = await getUserByEmail(email);
  if (updates.username && oldUser.username !== updates.username) {
    const existing = await redis.get(`user:username:${updates.username.toLowerCase()}`);
    if (existing && existing.toLowerCase() !== email.toLowerCase()) {
      throw new Error('Username sudah digunakan oleh pengguna lain');
    }
    if (oldUser.username) await redis.del(`user:username:${oldUser.username.toLowerCase()}`);
    await redis.set(`user:username:${updates.username.toLowerCase()}`, email.toLowerCase());
  }
  await redis.hset(`user:email:${email.toLowerCase()}`, updates);
}

export async function createSession(userId) {
  const token = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  await redis.set(`session:${token}`, userId, { ex: 60 * 60 * 24 * 30 });
  return token;
}
