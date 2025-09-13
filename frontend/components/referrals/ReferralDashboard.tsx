"use client";
import React, { useEffect, useState } from "react";

function authHeader() {
  if (typeof window === "undefined") return {} as any;
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReferralDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");
  const [stats, setStats] = useState<any | null>(null);
  const [board, setBoard] = useState<any[]>([]);

  async function loadCode() {
    try {
      const res = await fetch("/api/referrals/my-code", { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setCode(data.code);
      setShareLink(data.share_link);
    } catch (e: any) {
      setError(`Failed to load code: ${e.message}`);
    }
  }

  async function loadStats() {
    try {
      const res = await fetch("/api/referrals/stats", { headers: { ...authHeader() } });
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  async function loadLeaderboard() {
    try {
      const res = await fetch("/api/referrals/leaderboard", { headers: { ...authHeader() } });
      if (res.ok) setBoard((await res.json()).leaderboard || []);
    } catch {}
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCode(), loadStats(), loadLeaderboard()]).finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Referral Program</h2>
        <p className="text-sm text-gray-500">Invite friends and earn rewards</p>
      </div>

      {error && <div className="p-3 rounded bg-red-50 text-red-700">{error}</div>}

      <div className="p-4 border rounded">
        <div className="font-medium mb-2">Your Referral Link</div>
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <input value={shareLink} readOnly className="border rounded px-3 py-2 w-full" />
          <button onClick={copyLink} className="px-3 py-2 border rounded">Copy</button>
        </div>
        <div className="text-xs text-gray-500 mt-2">Code: {code}</div>
      </div>

      <div className="p-4 border rounded">
        <div className="font-medium mb-3">Your Stats</div>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border rounded text-center">
              <div className="text-gray-500 text-sm">Links</div>
              <div className="text-xl font-semibold">{stats.summary.total_links}</div>
            </div>
            <div className="p-3 border rounded text-center">
              <div className="text-gray-500 text-sm">Clicks</div>
              <div className="text-xl font-semibold">{stats.summary.clicks}</div>
            </div>
            <div className="p-3 border rounded text-center">
              <div className="text-gray-500 text-sm">Conversions</div>
              <div className="text-xl font-semibold">{stats.summary.conversions}</div>
            </div>
            <div className="p-3 border rounded text-center">
              <div className="text-gray-500 text-sm">Rewards</div>
              <div className="text-xl font-semibold">{stats.summary.total_rewards}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No data yet</div>
        )}
      </div>

      <div className="p-4 border rounded">
        <div className="font-medium mb-3">Leaderboard</div>
        <div className="space-y-2">
          {board?.length ? (
            board.map((r, idx) => (
              <div key={r.user_id} className="flex justify-between border rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">#{idx + 1}</span>
                  <span className="font-medium">{r.name}</span>
                </div>
                <div className="text-sm">{r.conversions} conversions  {r.clicks} clicks</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No leaderboard yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

