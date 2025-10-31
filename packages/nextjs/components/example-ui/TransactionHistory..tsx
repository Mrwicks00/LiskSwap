"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

type TransactionType = "swap" | "addLiquidity" | "removeLiquidity";

interface Transaction {
  hash: string;
  type: TransactionType;
  timestamp: number;
  blockNumber: bigint;
  amountA?: bigint;
  amountB?: bigint;
  amountIn?: bigint;
  amountOut?: bigint;
  tokenIn?: string;
  liquidityMinted?: bigint;
  liquidityBurned?: bigint;
  status: "success" | "failed";
}

export const TransactionHistory = () => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | TransactionType>("all");

  const { data: dexContract } = useDeployedContractInfo("SimpleDEX");

  const [symbolA] = useState("MTK");
  const [symbolB] = useState("sUSDC");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!dexContract || !connectedAddress || !publicClient) return;

      setLoading(true);

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - 10000n;

        // Fetch all events (same as table version)
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

        const allTxs: Transaction[] = [];

        for (const log of swapLogs) {
          if (log.args.user?.toLowerCase() === connectedAddress.toLowerCase()) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            allTxs.push({
              hash: log.transactionHash || "",
              type: "swap",
              timestamp: Number(block.timestamp),
              blockNumber: log.blockNumber,
              tokenIn: log.args.tokenIn as string,
              amountIn: log.args.amountIn as bigint,
              amountOut: log.args.amountOut as bigint,
              status: "success",
            });
          }
        }

        for (const log of liquidityAddedLogs) {
          if (log.args.provider?.toLowerCase() === connectedAddress.toLowerCase()) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            allTxs.push({
              hash: log.transactionHash || "",
              type: "addLiquidity",
              timestamp: Number(block.timestamp),
              blockNumber: log.blockNumber,
              amountA: log.args.amountA as bigint,
              amountB: log.args.amountB as bigint,
              liquidityMinted: log.args.liquidityMinted as bigint,
              status: "success",
            });
          }
        }

        for (const log of liquidityRemovedLogs) {
          if (log.args.provider?.toLowerCase() === connectedAddress.toLowerCase()) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            allTxs.push({
              hash: log.transactionHash || "",
              type: "removeLiquidity",
              timestamp: Number(block.timestamp),
              blockNumber: log.blockNumber,
              amountA: log.args.amountA as bigint,
              amountB: log.args.amountB as bigint,
              liquidityBurned: log.args.liquidityBurned as bigint,
              status: "success",
            });
          }
        }

        allTxs.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(allTxs);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [dexContract, connectedAddress, publicClient]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatAmount = (amount: bigint | undefined, decimals: number) => {
    if (!amount) return "0";
    return parseFloat(formatUnits(amount, decimals)).toFixed(4);
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "swap":
        return <ArrowsRightLeftIcon className="h-6 w-6" />;
      case "addLiquidity":
        return <PlusCircleIcon className="h-6 w-6" />;
      case "removeLiquidity":
        return <MinusCircleIcon className="h-6 w-6" />;
    }
  };

  const getTransactionBg = (type: TransactionType) => {
    switch (type) {
      case "swap":
        return "bg-primary/10 border-primary/30";
      case "addLiquidity":
        return "bg-success/10 border-success/30";
      case "removeLiquidity":
        return "bg-error/10 border-error/30";
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case "swap":
        return "text-primary";
      case "addLiquidity":
        return "text-success";
      case "removeLiquidity":
        return "text-error";
    }
  };

  const getBlockExplorerUrl = (hash: string) => {
    return `https://sepolia-blockscout.lisk.com/tx/${hash}`;
  };

  const filteredTransactions = filter === "all" ? transactions : transactions.filter(tx => tx.type === filter);

  if (!connectedAddress) {
    return (
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body items-center text-center py-12">
          <ClockIcon className="h-16 w-16 text-base-300 mb-4" />
          <h3 className="text-xl font-bold">Connect Your Wallet</h3>
          <p className="text-slate-400">Connect your wallet to view transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="card bg-base-100 shadow-xl border border-base-300 mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ClockIcon className="h-6 w-6" />
                Transaction History
              </h2>
              <p className="text-sm text-slate-400 mt-1">Your recent DEX activity</p>
            </div>

            {/* Filter Tabs */}
            <div className="tabs tabs-boxed bg-base-200">
              <button className={`tab ${filter === "all" ? "tab-active" : ""}`} onClick={() => setFilter("all")}>
                All
              </button>
              <button className={`tab ${filter === "swap" ? "tab-active" : ""}`} onClick={() => setFilter("swap")}>
                Swaps
              </button>
              <button
                className={`tab ${filter === "addLiquidity" ? "tab-active" : ""}`}
                onClick={() => setFilter("addLiquidity")}
              >
                Add
              </button>
              <button
                className={`tab ${filter === "removeLiquidity" ? "tab-active" : ""}`}
                onClick={() => setFilter("removeLiquidity")}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-slate-400 mt-4">Loading transactions...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTransactions.length === 0 && (
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body flex flex-col items-center justify-center py-12">
            <div className="bg-base-200 rounded-full p-6 mb-4">
              <ClockIcon className="h-12 w-12 text-base-300" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-slate-400 text-center max-w-md">
              {filter === "all"
                ? "Your transaction history will appear here once you start trading"
                : `No ${
                    filter === "swap"
                      ? "swaps"
                      : filter === "addLiquidity"
                      ? "liquidity additions"
                      : "liquidity removals"
                  } found`}
            </p>
          </div>
        </div>
      )}

      {/* Transaction Cards */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="space-y-4">
          {filteredTransactions.map(tx => (
            <div key={tx.hash} className={`card bg-base-100 shadow-lg border-2 ${getTransactionBg(tx.type)}`}>
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  {/* Left Side - Icon & Type */}
                  <div className="flex items-center gap-3">
                    <div className={`${getTransactionColor(tx.type)}`}>{getTransactionIcon(tx.type)}</div>
                    <div>
                      <div className={`font-bold ${getTransactionColor(tx.type)}`}>
                        {tx.type === "addLiquidity"
                          ? "Add Liquidity"
                          : tx.type === "removeLiquidity"
                          ? "Remove Liquidity"
                          : "Swap"}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatTime(tx.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Status */}
                  <div className="badge badge-success gap-1">
                    <CheckCircleIcon className="h-3 w-3" />
                    Success
                  </div>
                </div>

                <div className="divider my-2"></div>

                {/* Transaction Details */}
                <div className="space-y-2">
                  {tx.type === "swap" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Trade</span>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatAmount(tx.amountIn, tx.tokenIn === dexContract?.address ? 18 : 6)}{" "}
                          {tx.tokenIn === dexContract?.address ? symbolA : symbolB}
                        </div>
                        <div className="text-xs text-slate-400">↓</div>
                        <div className="font-semibold">
                          {formatAmount(tx.amountOut, tx.tokenIn === dexContract?.address ? 6 : 18)}{" "}
                          {tx.tokenIn === dexContract?.address ? symbolB : symbolA}
                        </div>
                      </div>
                    </div>
                  )}
                  {tx.type === "addLiquidity" && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Deposited</span>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatAmount(tx.amountA, 18)} {symbolA}
                          </div>
                          <div className="font-semibold">
                            {formatAmount(tx.amountB, 6)} {symbolB}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">LP Tokens</span>
                        <span className="font-semibold">+{formatAmount(tx.liquidityMinted, 18)}</span>
                      </div>
                    </>
                  )}
                  {tx.type === "removeLiquidity" && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Received</span>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatAmount(tx.amountA, 18)} {symbolA}
                          </div>
                          <div className="font-semibold">
                            {formatAmount(tx.amountB, 6)} {symbolB}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">LP Tokens</span>
                        <span className="font-semibold">-{formatAmount(tx.liquidityBurned, 18)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* View on Explorer */}
                <a
                  href={getBlockExplorerUrl(tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline btn-block gap-2 mt-3"
                >
                  View on Explorer
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Count */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="text-center text-sm text-slate-400 mt-6">
          Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};
