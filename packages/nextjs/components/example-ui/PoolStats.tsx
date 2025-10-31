"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { usePublicClient } from "wagmi";
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FireIcon,
  InformationCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

interface PoolStatsData {
  tvl: string;
  volume24h: string;
  fees24h: string;
  totalTransactions: number;
  uniqueUsers: number;
  priceChange24h: number;
  apr: string;
}

export const PoolStats = () => {
  const publicClient = usePublicClient();
  const [stats, setStats] = useState<PoolStatsData>({
    tvl: "0",
    volume24h: "0",
    fees24h: "0",
    totalTransactions: 0,
    uniqueUsers: 0,
    priceChange24h: 0,
    apr: "0",
  });
  const [loading, setLoading] = useState(true);

  const [priceHistory, setPriceHistory] = useState<Array<{ time: number; price: number }>>([]);

  const { data: dexContract } = useDeployedContractInfo("SimpleDEX");

  // Get current reserves
  const { data: reserves } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getReserves",
  });

  const reserveA = reserves?.[0] || 0n;
  const reserveB = reserves?.[1] || 0n;
  const totalLiquidity = reserves?.[2] || 0n;

  // Get token symbols
  const { data: symbolA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "symbol",
  });

  const { data: symbolB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "symbol",
  });

  // Calculate current price
  const currentPrice =
    reserveA > 0n && reserveB > 0n ? Number(formatUnits(reserveB, 6)) / Number(formatUnits(reserveA, 18)) : 0;

  useEffect(() => {
    const fetchPoolStats = async () => {
      if (!dexContract || !publicClient) return;

      setLoading(true);

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const blocksIn24h = 43200n; // ~2 sec blocks = 43,200 blocks in 24h
        const fromBlock = currentBlock > blocksIn24h ? currentBlock - blocksIn24h : 0n;

        // Fetch swap events for 24h
        const swapLogs = await publicClient.getLogs({
          address: dexContract.address,
          event: {
            type: "event",
            name: "Swap",
            inputs: [
              { type: "address", name: "user", indexed: true },
              { type: "address", name: "tokenIn", indexed: true },
              { type: "uint256", name: "amountIn" },
              { type: "uint256", name: "amountOut" },
            ],
          },
          fromBlock,
          toBlock: "latest",
        });

        // Fetch liquidity events
        const liquidityAddedLogs = await publicClient.getLogs({
          address: dexContract.address,
          event: {
            type: "event",
            name: "LiquidityAdded",
            inputs: [
              { type: "address", name: "provider", indexed: true },
              { type: "uint256", name: "amountA" },
              { type: "uint256", name: "amountB" },
              { type: "uint256", name: "liquidityMinted" },
            ],
          },
          fromBlock,
          toBlock: "latest",
        });

        const liquidityRemovedLogs = await publicClient.getLogs({
          address: dexContract.address,
          event: {
            type: "event",
            name: "LiquidityRemoved",
            inputs: [
              { type: "address", name: "provider", indexed: true },
              { type: "uint256", name: "amountA" },
              { type: "uint256", name: "amountB" },
              { type: "uint256", name: "liquidityBurned" },
            ],
          },
          fromBlock,
          toBlock: "latest",
        });

        // Calculate 24h volume
        let volume24h = 0;
        let fees24h = 0;
        const uniqueUsersSet = new Set<string>();
        const pricePoints: Array<{ time: number; price: number }> = [];

        for (const log of swapLogs) {
          const amountIn = Number(formatUnits(log.args.amountIn as bigint, 18));
          volume24h += amountIn;
          fees24h += amountIn * 0.003; // 0.3% fee

          // Track unique users
          if (log.args.user) {
            uniqueUsersSet.add((log.args.user as string).toLowerCase());
          }

          // Get price at this block for history
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          pricePoints.push({
            time: Number(block.timestamp),
            price: currentPrice, // Simplified - in production, calculate from reserves at that block
          });
        }

        // Calculate TVL
        const tvlA = Number(formatUnits(reserveA, 18));
        const tvlB = Number(formatUnits(reserveB, 6));
        const tvl = tvlA + tvlB; // Simplified - in production, convert to USD

        // Calculate APR (simplified)
        const dailyFees = fees24h;
        const yearlyFees = dailyFees * 365;
        const apr = tvl > 0 ? ((yearlyFees / tvl) * 100).toFixed(2) : "0";

        // Get price 24h ago (first price point)
        const priceChange24h =
          pricePoints.length > 0 ? ((currentPrice - pricePoints[0].price) / pricePoints[0].price) * 100 : 0;

        setStats({
          tvl: tvl.toFixed(2),
          volume24h: volume24h.toFixed(2),
          fees24h: fees24h.toFixed(4),
          totalTransactions: swapLogs.length + liquidityAddedLogs.length + liquidityRemovedLogs.length,
          uniqueUsers: uniqueUsersSet.size,
          priceChange24h,
          apr,
        });

        setPriceHistory(pricePoints.slice(-24)); // Last 24 data points
      } catch (error) {
        console.error("Error fetching pool stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoolStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPoolStats, 30000);
    return () => clearInterval(interval);
  }, [dexContract, publicClient, reserveA, reserveB, currentPrice]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div className="card-body">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-primary" />
                Pool Analytics
              </h2>
              <p className="text-slate-400 mt-1">
                {symbolA}/{symbolB} Liquidity Pool
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge badge-lg badge-primary gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                Live
              </div>
              {loading && <span className="loading loading-spinner loading-sm"></span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TVL */}
        <div className="card bg-base-100 shadow-xl border border-base-300 hover:border-primary/40 transition-all">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  Total Value Locked
                  <div className="tooltip" data-tip="Combined value of all tokens in the pool">
                    <InformationCircleIcon className="h-4 w-4" />
                  </div>
                </p>
                <p className="text-3xl font-bold text-primary mt-1">${stats.tvl}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatUnits(reserveA, 18)} {symbolA} + {formatUnits(reserveB, 6)} {symbolB}
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* 24h Volume */}
        <div className="card bg-base-100 shadow-xl border border-base-300 hover:border-secondary/40 transition-all">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  24h Volume
                  <div className="tooltip" data-tip="Total trading volume in last 24 hours">
                    <InformationCircleIcon className="h-4 w-4" />
                  </div>
                </p>
                <p className="text-3xl font-bold text-secondary mt-1">${stats.volume24h}</p>
                <p className="text-xs text-slate-400 mt-1">Last 24 hours</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <ArrowTrendingUpIcon className="h-8 w-8 text-secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* 24h Fees */}
        <div className="card bg-base-100 shadow-xl border border-base-300 hover:border-accent/40 transition-all">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  24h Fees
                  <div className="tooltip" data-tip="Trading fees earned by liquidity providers">
                    <InformationCircleIcon className="h-4 w-4" />
                  </div>
                </p>
                <p className="text-3xl font-bold text-accent mt-1">${stats.fees24h}</p>
                <p className="text-xs text-slate-400 mt-1">0.3% per trade</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <FireIcon className="h-8 w-8 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* APR */}
        <div className="card bg-base-100 shadow-xl border border-base-300 hover:border-success/40 transition-all">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  Estimated APR
                  <div className="tooltip" data-tip="Annual Percentage Rate based on current fees">
                    <InformationCircleIcon className="h-4 w-4" />
                  </div>
                </p>
                <p className="text-3xl font-bold text-success mt-1">{stats.apr}%</p>
                <p className="text-xs text-slate-400 mt-1">Based on 24h fees</p>
              </div>
              <div className="bg-success/10 p-3 rounded-lg">
                <ChartBarIcon className="h-8 w-8 text-success" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Price Change */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <p className="text-sm text-slate-400">Price Change (24h)</p>
            <div className="flex items-center gap-2 mt-2">
              <p className={`text-2xl font-bold ${stats.priceChange24h >= 0 ? "text-success" : "text-error"}`}>
                {stats.priceChange24h >= 0 ? "+" : ""}
                {stats.priceChange24h.toFixed(2)}%
              </p>
              {stats.priceChange24h >= 0 ? (
                <div className="badge badge-success">↑</div>
              ) : (
                <div className="badge badge-error">↓</div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Current: 1 {symbolA} = {currentPrice.toFixed(4)} {symbolB}
            </p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Total Transactions (24h)
            </p>
            <p className="text-2xl font-bold mt-2">{stats.totalTransactions}</p>
            <p className="text-xs text-slate-400 mt-1">Swaps + Liquidity ops</p>
          </div>
        </div>

        {/* Unique Users */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Unique Users (24h)
            </p>
            <p className="text-2xl font-bold mt-2">{stats.uniqueUsers}</p>
            <p className="text-xs text-slate-400 mt-1">Active traders</p>
          </div>
        </div>
      </div>

      {/* Pool Composition */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h3 className="text-xl font-bold mb-4">Pool Composition</h3>
          <div className="space-y-4">
            {/* Token A */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-6">
                      <span className="text-xs font-bold">{symbolA?.[0]}</span>
                    </div>
                  </div>
                  <span className="font-semibold">{symbolA}</span>
                </div>
                <span className="font-bold">{parseFloat(formatUnits(reserveA, 18)).toFixed(2)}</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={Number(reserveA)}
                max={Number(reserveA) + Number(reserveB)}
              ></progress>
            </div>

            {/* Token B */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="avatar placeholder">
                    <div className="bg-secondary text-secondary-content rounded-full w-6">
                      <span className="text-xs font-bold">{symbolB?.[0]}</span>
                    </div>
                  </div>
                  <span className="font-semibold">{symbolB}</span>
                </div>
                <span className="font-bold">{parseFloat(formatUnits(reserveB, 6)).toFixed(2)}</span>
              </div>
              <progress
                className="progress progress-secondary w-full"
                value={Number(reserveB)}
                max={Number(reserveA) + Number(reserveB)}
              ></progress>
            </div>
          </div>

          <div className="divider"></div>

          {/* Pool Ratio */}
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Current Ratio</div>
              <div className="stat-value text-lg">
                1 : {(Number(formatUnits(reserveB, 6)) / Number(formatUnits(reserveA, 18))).toFixed(4)}
              </div>
              <div className="stat-desc">
                {symbolA} : {symbolB}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Total LP Tokens</div>
              <div className="stat-value text-lg">{parseFloat(formatUnits(totalLiquidity, 18)).toFixed(2)}</div>
              <div className="stat-desc">Liquidity shares</div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h3 className="text-xl font-bold mb-4">Price History (24h)</h3>

            {priceHistory.length > 0 ? (
              <p className="text-slate-400">**Chart data points available:** {priceHistory.length}</p>
            ) : (
              <p className="text-slate-400">Loading price data...</p>
            )}
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info">
        <InformationCircleIcon className="h-6 w-6" />
        <div>
          <h4 className="font-bold">Statistics Update</h4>
          <p className="text-sm">
            Pool statistics are updated every 30 seconds based on the last 24 hours of activity.
          </p>
        </div>
      </div>
    </div>
  );
};
