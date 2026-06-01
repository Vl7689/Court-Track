const FROM = 'CourtTrack <onboarding@resend.dev>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://court-track.vercel.app';

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
}

export async function sendMatchNotification({
  to, loggedByUsername, team1, team2, scores, sport,
}: {
  to: string; loggedByUsername: string;
  team1: string; team2: string; scores: string; sport: string;
}) {
  await send(
    to,
    `${loggedByUsername} logged a match — confirm or dispute`,
    `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#22c55e">Match Result Logged</h2>
      <p><strong>${loggedByUsername}</strong> logged a ${sport} result:</p>
      <div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0;color:#fff">
        <p style="margin:0;font-size:18px;text-align:center">
          ${team1} <span style="color:#94a3b8">vs</span> ${team2}
        </p>
        <p style="margin:8px 0 0;text-align:center;color:#94a3b8">${scores}</p>
      </div>
      <p>Open CourtTrack to confirm or dispute this result.</p>
      <a href="${BASE_URL}" style="display:inline-block;background:#22c55e;color:#000;font-weight:bold;padding:10px 20px;border-radius:6px;text-decoration:none">
        Open CourtTrack
      </a>
    </div>`,
  );
}

export async function sendWeeklyReport({
  to, username, wins, losses, streak, streakType, rank,
}: {
  to: string; username: string; wins: number; losses: number;
  streak: number; streakType: string | null; rank: number;
}) {
  const record = `${wins}W – ${losses}L`;
  const streakText = streak > 0 && streakType
    ? `${streak}-match ${streakType === 'W' ? 'win' : 'loss'} streak`
    : 'No current streak';

  await send(
    to,
    `Your CourtTrack weekly report`,
    `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#22c55e">Weekly Report — ${username}</h2>
      <div style="background:#1e293b;border-radius:8px;padding:20px;color:#fff">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center">
          <div>
            <p style="margin:0;font-size:24px;font-weight:bold;color:#22c55e">${record}</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:12px">Overall record</p>
          </div>
          <div>
            <p style="margin:0;font-size:24px;font-weight:bold">#${rank}</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:12px">Global rank</p>
          </div>
          <div>
            <p style="margin:0;font-size:24px;font-weight:bold">${streak}</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:12px">${streakText}</p>
          </div>
        </div>
      </div>
      <p style="color:#94a3b8;font-size:13px">Get out there and log some matches!</p>
      <a href="${BASE_URL}" style="display:inline-block;background:#22c55e;color:#000;font-weight:bold;padding:10px 20px;border-radius:6px;text-decoration:none">
        Open CourtTrack
      </a>
    </div>`,
  );
}
