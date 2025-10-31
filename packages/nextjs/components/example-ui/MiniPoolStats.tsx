"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export const MiniPoolStats = () => {
  const publicClient = usePublicClient();
  const [volume24h, setVolume24h] = useState("0");
  const [loading, setLoading] = useState(false);

  const { data: dexContract } = useDeployedContractInfo("SimpleDEX");

  // Get current reserves
  const { data: reserves } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getReserves",
  });

  const reserveA = reserves?.[0] || 0n;
  const reserveB = reserves?.[1] || 0n;

  // Get token symbols
  const { data: symbolA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "symbol",
  });

  const { data: symbolB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "symbol",
  });

  // Calculate TVL
  const tvl = (Number(formatUnits(reserveA, 18)) + Number(formatUnits(reserveB, 6))).toFixed(2);

  // Calculate current price
  const currentPrice =
    reserveA > 0n && reserveB > 0n
      ? (Number(formatUnits(reserveB, 6)) / Number(formatUnits(reserveA, 18))).toFixed(4)
      : "0";

  useEffect(() => {
    const fetch24hVolume = async () => {
      if (!dexContract || !publicClient) return;

      setLoading(true);

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const blocksIn24h = 43200n;
        const fromBlock = currentBlock > blocksIn24h ? currentBlock - blocksIn24h : 0n;

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

        let volume = 0;
        for (const log of swapLogs) {
          const amountIn = Number(formatUnits(log.args.amountIn as bigint, 18));
          volume += amountIn;
        }

        setVolume24h(volume.toFixed(2));
      } catch (error) {
        console.error("Error fetching volume:", error);
      } finally {
        setLoading(false);
      }
    };

    fetch24hVolume();
    const interval = setInterval(fetch24hVolume, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [dexContract, publicClient]);

  return (
    <div className="card bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 shadow-lg">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-primary" />
            Pool Overview
          </h3>
          <Link href="/pool-stats" className="btn btn-ghost btn-xs gap-1">
            View All
            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* TVL */}
          <div className="bg-base-100 rounded-lg p-3 border border-base-300">
            <div className="flex items-center gap-1 mb-1">
              <CurrencyDollarIcon className="h-4 w-4 text-primary" />
              <span className="text-xs text-slate-400">TVL</span>
            </div>
            <p className="text-lg font-bold">${tvl}</p>
          </div>

          {/* Volume 24h */}
          <div className="bg-base-100 rounded-lg p-3 border border-base-300">
            <div className="flex items-center gap-1 mb-1">
              <ArrowTrendingUpIcon className="h-4 w-4 text-secondary" />
              <span className="text-xs text-slate-400">24h Vol</span>
            </div>
            <p className="text-lg font-bold">
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                `$${volume24h}`
              )}
            </p>
          </div>

          {/* Price */}
          <div className="bg-base-100 rounded-lg p-3 border border-base-300">
            <div className="flex items-center gap-1 mb-1">
              <ChartBarIcon className="h-4 w-4 text-accent" />
              <span className="text-xs text-slate-400">Price</span>
            </div>
            <p className="text-sm font-bold" title={`1 ${symbolA} = ${currentPrice} ${symbolB}`}>
              {currentPrice}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-center mt-2">
          {symbolA}/{symbolB} Pool • Updates every 30s
        </div>
      </div>
    </div>
  );
};