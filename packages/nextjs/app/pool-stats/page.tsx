"use client";

import type { NextPage } from "next";

import { PoolStats } from "~~/components/example-ui/PoolStats";
import { ChartBarIcon } from "@heroicons/react/24/outline";

const PoolAnalytics: NextPage = () => {
  

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <ChartBarIcon className="h-10 w-10 text-primary" />
          Pool Analytics
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Real-time statistics and insights for the liquidity pool. Monitor TVL, volume, fees, and APR.
        </p>
      </div>

      {/* Stats Component */}
      <div className="flex justify-center">
        <PoolStats />
      </div>

      {/* Educational Section */}
      <div className="mt-12 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="text-xl font-bold mb-3">📊 Understanding TVL</h3>
              <p className="text-sm text-slate-400">
                Total Value Locked (TVL) represents the combined value of all tokens deposited in the liquidity pool. A
                higher TVL generally means better price stability and lower slippage for traders.
              </p>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="text-xl font-bold mb-3">💰 How APR Works</h3>
              <p className="text-sm text-slate-400">
                Annual Percentage Rate (APR) shows the estimated yearly return for liquidity providers based on current
                trading fees. The 0.3% trading fee is distributed proportionally to all LP token holders.
              </p>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="text-xl font-bold mb-3">📈 Volume & Fees</h3>
              <p className="text-sm text-slate-400">
                Trading volume shows total swap activity. Higher volume generates more fees for liquidity providers. The
                pool earns 0.3% of every trade, which accumulates in the reserves.
              </p>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="text-xl font-bold mb-3">⚠️ Price Impact</h3>
              <p className="text-sm text-slate-400">
                Large swaps relative to pool size cause price impact. A balanced pool with high liquidity reduces
                slippage and provides better trading experience for users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolAnalytics;