import webpush from 'web-push';
import { prisma } from './prisma';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'noreply@courttrack.app'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function pushToUser(userId: number, payload: { title: string; body: string; url?: string }) {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const stale: number[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 410) stale.push(s.id);
      }
    }),
  );

  if (stale.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
}

export async function createNotification(userId: number, type: string, title: string, body: string, matchId?: number) {
  await prisma.notification.create({ data: { userId, type, title, body, matchId: matchId ?? null } });
  await pushToUser(userId, { title, body, url: '/' });
}
