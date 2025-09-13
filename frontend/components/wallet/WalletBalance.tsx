"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, Eye, Coins, Loader2 } from "lucide-react";

interface WalletBalances {
  ETH: number;
  DRST: number;
  VSC: number;
  eth_address: string;
}

function authHeader() {
  if (typeof window === "undefined") return {} as any;
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function WalletBalance() {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  async function loadBalances() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blockchain/wallet/balances", {
        headers: { ...authHeader() }
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication required");
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setBalances(data.balances);
    } catch (e: any) {
      console.error("Failed to load wallet balances:", e);
      setError(`Failed to load balances: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBalances();
    // Refresh balances every 30 seconds
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !balances) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error || !balances) {
    return null; // Hide if there's an error or no balances
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-white">
            {balances.DRST.toFixed(2)} DRST
          </div>
          <div className="text-xs text-gray-400">
            {balances.ETH.toFixed(4)} ETH
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Wallet Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 glass rounded-xl shadow-xl z-50"
          >
            <div className="p-4 border-b border-white/10">
              <div className="font-medium text-white mb-2">Wallet Balances</div>
              <div className="text-xs text-gray-400 break-all">
                {balances.eth_address}
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {/* ETH Balance */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">ETH</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Ethereum</div>
                    <div className="text-xs text-gray-400">ETH</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{balances.ETH.toFixed(4)}</div>
                  <div className="text-xs text-gray-400">ETH</div>
                </div>
              </div>

              {/* DRST Balance */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Dristi Token</div>
                    <div className="text-xs text-gray-400">DRST</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{balances.DRST.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">DRST</div>
                </div>
              </div>

              {/* VSC Balance */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">VisionCoin</div>
                    <div className="text-xs text-gray-400">VSC</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{balances.VSC.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">VSC</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  loadBalances();
                }}
                className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Refresh Balances
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
