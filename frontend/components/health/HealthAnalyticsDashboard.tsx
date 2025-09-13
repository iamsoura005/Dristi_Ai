"use client";
import React, { useEffect, useState } from "react";

function authHeader() {
  if (typeof window === "undefined") return {} as any;
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function HealthAnalyticsDashboard() {
  const [summary, setSummary] = useState<any | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [sRes, tRes] = await Promise.all([
        fetch("/api/analytics/health/summary", { headers: { ...authHeader() } }),
        fetch("/api/analytics/health/trends", { headers: { ...authHeader() } }),
      ]);
      if (sRes.ok) setSummary(await sRes.json());
      if (tRes.ok) setTrends((await tRes.json()).trends || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onExport() {
    const res = await fetch("/api/analytics/health/export", { headers: { ...authHeader() } });
    if (!res.ok) return;
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Health Analytics</h2>
          <p className="text-sm text-gray-500">Insights from your test history</p>
        </div>
        <button onClick={onExport} className="px-3 py-2 border rounded">Export Report</button>
      </div>

      {error && <div className="p-3 rounded bg-red-50 text-red-700">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 border rounded text-center">
          <div className="text-gray-500 text-sm">Test Results</div>
          <div className="text-xl font-semibold">{summary?.counts?.test_results ?? 0}</div>
        </div>
        <div className="p-3 border rounded text-center">
          <div className="text-gray-500 text-sm">AI Analyses</div>
          <div className="text-xl font-semibold">{summary?.counts?.ai_analyses ?? 0}</div>
        </div>
        <div className="p-3 border rounded text-center">
          <div className="text-gray-500 text-sm">Avg Risk Score</div>
          <div className="text-xl font-semibold">{summary?.avg_risk_score ?? 0}</div>
        </div>
      </div>

      <div className="p-4 border rounded">
        <div className="font-medium mb-2">Recent Tests</div>
        <div className="space-y-2">
          {summary?.recent_tests?.length ? (
            summary.recent_tests.map((t: any) => (
              <div key={t.id} className="text-sm border rounded px-3 py-2 flex justify-between">
                <div className="font-medium">{t.type}</div>
                <div className="text-gray-500">{t.created_at?.slice(0, 19).replace("T", " ")}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No recent tests</div>
          )}
        </div>
      </div>

      <div className="p-4 border rounded">
        <div className="font-medium mb-2">Monthly Trends</div>
        <div className="grid grid-cols-1 gap-2">
          {trends.length ? (
            trends.map((m) => (
              <div key={m.month} className="flex justify-between text-sm border rounded px-3 py-2">
                <div>{m.month}</div>
                <div>{m.tests} tests</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No trend data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

