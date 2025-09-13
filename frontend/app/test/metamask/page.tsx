"use client";
import React from "react";
import MetaMaskTestSuite from "@/components/test/MetaMaskTestSuite";

export default function MetaMaskTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12">
      <div className="container mx-auto px-4">
        <MetaMaskTestSuite />
      </div>
    </div>
  );
}
