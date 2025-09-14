"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, Eye, Coins, Loader2, Plus, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import WalletCreationModal from "./WalletCreationModal";

interface WalletBalances {
  ETH: number;
  DRST: number;
  VSC: number;
  eth_address: string;
}

function authHeader() {
  if (typeof window === "undefined") return {} as any;
  const token = localStorage.getItem("token") ||
                localStorage.getItem("access_token") ||
                localStorage.getItem("auth_token") ||
                localStorage.getItem("hackloop_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function WalletBalance() {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showWalletCreation, setShowWalletCreation] = useState(false);
  const [noWalletFound, setNoWalletFound] = useState(false);

  async function loadBalances() {
    setLoading(true);
    setError(null);
    try {
      // Check if user is authenticated
      const headers = authHeader();
      if (!headers.Authorization) {
        setError("Please log in to view wallet balances");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/blockchain/wallet/balances`, {
        headers: { ...headers }
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Authentication required - please log in");
          return;
        }
        if (res.status === 404) {
          setNoWalletFound(true);
          setError(null); // Clear error since we'll show wallet creation UI
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.balances) {
        setBalances(data.balances);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      console.error("Failed to load wallet balances:", e);
      setError(`Failed to load balances: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleWalletCreated = async () => {
    setNoWalletFound(false);
    setShowWalletCreation(false);
    // Reload balances after wallet creation
    await loadBalances();
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // Check if user is authenticated before loading
      const headers = authHeader();
      if (headers.Authorization) {
        loadBalances();
        // Refresh balances every 30 seconds
        const interval = setInterval(loadBalances, 30000);
        return () => clearInterval(interval);
      } else {
        // Clear any previous error when not authenticated
        setError(null);
        setBalances(null);
        setNoWalletFound(false);
      }
    }
  }, [isClient]);

  if (loading && !balances) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  // Show wallet creation UI when no wallet is found
  if (noWalletFound) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowWalletCreation(true)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Plus className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-400 font-medium">Create Wallet</p>
            <p className="text-xs text-blue-300/60">Set up your blockchain wallet</p>
          </div>
        </button>

        <WalletCreationModal
          isOpen={showWalletCreation}
          onClose={() => setShowWalletCreation(false)}
          onSuccess={handleWalletCreated}
        />
      </>
    );
  }

  if (error) {
    // Don't show error if it's just an authentication issue - user might not be logged in
    if (error.includes("Authentication required") || error.includes("Please log in")) {
      return null; // Hide the component instead of showing error
    }

    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-400 truncate">{error}</p>
        </div>
      </div>
    );
  }

  if (!balances && !loading) {
    return null; // Hide if no balances and not loading
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

      {/* Wallet Creation Modal - available even when balances exist */}
      <WalletCreationModal
        isOpen={showWalletCreation}
        onClose={() => setShowWalletCreation(false)}
        onSuccess={handleWalletCreated}
      />
    </div>
  );
}
