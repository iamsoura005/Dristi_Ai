"use client";
import React, { useEffect, useMemo, useState } from "react";

interface Position {
  id: number;
  amount: number;
  apy_percent: number;
  lock_period_days: number;
  status: string;
  start_time?: string;
  end_time?: string | null;
  accumulated_rewards: number;
  accrued_rewards?: number;
}

type Summary = {
  balances: { DRST: number; ETH_address: string };
  positions: Position[];
  totals: { total_staked: number; total_rewards: number };
  apy_options: Record<string, number>;
};

function authHeader() {
  if (typeof window === "undefined") return {} as any;
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function StakingDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [lockDays, setLockDays] = useState<number>(30);
  const [history, setHistory] = useState<any[]>([]);

  async function loadSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staking/summary", { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setSummary(data);
    } catch (e: any) {
      setError(`Failed to load: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/staking/history", { headers: { ...authHeader() } });
      if (res.ok) setHistory((await res.json()).history || []);
    } catch {}
  }

  useEffect(() => {
    loadSummary();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onStake() {
    setError(null);
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/staking/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ amount: amt, lock_period_days: lockDays }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSummary();
      await loadHistory();
      setAmount("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onUnstake(positionId: number) {
    try {
      setLoading(true);
      const res = await fetch("/api/staking/unstake", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ position_id: positionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSummary();
      await loadHistory();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const apyOptions = useMemo(() => summary?.apy_options || { 30: 8, 90: 12, 180: 16 }, [summary]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Staking Dashboard</h2>
        <p className="text-sm text-gray-500">Stake DRST to earn rewards</p>
      </div>

      {error && <div className="p-3 rounded bg-red-50 text-red-700">{error}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="text-gray-500 text-sm">DRST Balance</div>
          <div className="text-2xl font-bold">{summary?.balances?.DRST ?? "-"}</div>
          <div className="text-xs break-all text-gray-500 mt-1">{summary?.balances?.ETH_address}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-gray-500 text-sm">Total Staked</div>
          <div className="text-2xl font-bold">{summary?.totals?.total_staked ?? 0}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-gray-500 text-sm">Total Rewards</div>
          <div className="text-2xl font-bold">{summary?.totals?.total_rewards ?? 0}</div>
        </div>
      </div>

      <div className="p-4 border rounded space-y-3">
        <div className="font-medium">Stake DRST</div>
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <input
            type="number"
            placeholder="Amount"
            className="border rounded px-3 py-2 w-full md:w-48"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={lockDays}
            onChange={(e) => setLockDays(parseInt(e.target.value))}
          >
            {Object.entries(apyOptions).map(([days, apy]) => (
              <option key={days} value={parseInt(days)}>
                {days} days • {apy}% APY
              </option>
            ))}
          </select>
          <button
            onClick={onStake}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Processing..." : "Stake"}
          </button>
        </div>
      </div>

      <div className="p-4 border rounded">
        <div className="font-medium mb-3">Active Positions</div>
        <div className="space-y-2">
          {summary?.positions?.length ? (
            summary.positions.map((p) => (
              <div key={p.id} className="border rounded p-3 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{p.amount} DRST • {p.lock_period_days} days @ {p.apy_percent}%</div>
                  <div className="text-xs text-gray-500">Started: {p.start_time?.slice(0, 19).replace("T", " ")}</div>
                  <div className="text-xs text-green-700">Rewards: {(p.accrued_rewards ?? 0) + (p.accumulated_rewards ?? 0)}</div>
                </div>
                {p.status === "active" ? (
                  <button onClick={() => onUnstake(p.id)} className="px-3 py-2 border rounded">Unstake</button>
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">{p.status}</span>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No positions yet</div>
          )}
        </div>
      </div>

      <div className="p-4 border rounded">
        <div className="font-medium mb-3">History</div>
        <div className="space-y-2">
          {history?.length ? (
            history.map((h: any) => (
              <div key={h.id} className="text-sm flex justify-between border rounded px-3 py-2">
                <div className="capitalize">{h.action}</div>
                <div>{h.amount}</div>
                <div className="text-gray-500">{h.created_at?.slice(0, 19).replace("T", " ")}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No history yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

