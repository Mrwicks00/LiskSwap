"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { ArrowsUpDownIcon, CheckCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { SlippageSettings, useSlippageSettings } from "~~/components/example-ui/SlippageSettings";
import { TokenSelector, defaultTokens } from "~~/components/example-ui/TokenSelector";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const SwapPanel = () => {
  const { address: connectedAddress } = useAccount();
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  // Slippage settings
  const { slippage, deadline, handleSlippageChange, handleDeadlineChange } = useSlippageSettings();

  // Token selection
  const [tokenIn, setTokenIn] = useState(defaultTokens[0]); // MTK
  const [tokenOut, setTokenOut] = useState(defaultTokens[1]); // sUSDC

  // Get DEX contract address
  const { data: dexContract } = useDeployedContractInfo("SimpleDEX");
  const dexAddress = dexContract?.address;

  // Get token addresses from DEX contract
  const { data: tokenAAddress } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "tokenA",
  });

  const { data: tokenBAddress } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "tokenB",
  });

  // Update token addresses when loaded
  useEffect(() => {
    if (tokenAAddress && tokenBAddress) {
      defaultTokens[0].address = tokenAAddress;
      defaultTokens[1].address = tokenBAddress;
    }
  }, [tokenAAddress, tokenBAddress]);

  // Get token balances
  const { data: balanceA, refetch: refetchBalanceA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: balanceB, refetch: refetchBalanceB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  // Check approvals
  const { data: allowanceA, refetch: refetchAllowanceA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "allowance",
    args: [connectedAddress, dexAddress],
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "allowance",
    args: [connectedAddress, dexAddress],
  });

  // Get reserves for price calculation
  const { data: reserves } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getReserves",
  });

  const reserveA = reserves?.[0] || 0n;
  const reserveB = reserves?.[1] || 0n;

  const isTokenAInput = tokenIn.symbol === "MTK";

  // Get swap quote
  const { data: swapQuote, refetch: refetchQuote } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getSwapAmount",
    args:
      inputAmount && parseFloat(inputAmount) > 0
        ? [isTokenAInput ? tokenAAddress : tokenBAddress, parseUnits(inputAmount, tokenIn.decimals)]
        : undefined,
  });

  // Update output amount when quote changes
  useEffect(() => {
    if (swapQuote && swapQuote > 0n) {
      const formatted = formatUnits(swapQuote, tokenOut.decimals);
      setOutputAmount(parseFloat(formatted).toFixed(6));
    } else {
      setOutputAmount("");
    }
  }, [swapQuote, tokenOut.decimals]);

  // Refetch quote when input changes
  useEffect(() => {
    if (inputAmount && parseFloat(inputAmount) > 0) {
      refetchQuote();
    }
  }, [inputAmount, tokenIn, refetchQuote]);

  // Approve functions
  const { writeAsync: approveTokenA } = useScaffoldContractWrite({
    contractName: "MyToken",
    functionName: "approve",
    args: [dexAddress, parseUnits("1000000", 18)],
  });

  const { writeAsync: approveTokenB } = useScaffoldContractWrite({
    contractName: "SimpleUSDC",
    functionName: "approve",
    args: [dexAddress, parseUnits("1000000", 6)],
  });

  // Swap function
  const { writeAsync: executeSwap } = useScaffoldContractWrite({
    contractName: "SimpleDEX",
    functionName: "swap",
    args:
      inputAmount && parseFloat(inputAmount) > 0
        ? [isTokenAInput ? tokenAAddress : tokenBAddress, parseUnits(inputAmount, tokenIn.decimals)]
        : undefined,
  });

  const handleApprove = async () => {
    try {
      if (isTokenAInput) {
        await approveTokenA();
        notification.success("Token A approved!");
        setTimeout(() => {
          refetchAllowanceA();
        }, 2000);
      } else {
        await approveTokenB();
        notification.success("Token B approved!");
        setTimeout(() => {
          refetchAllowanceB();
        }, 2000);
      }
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
    }
  };

  const handleSwap = async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      notification.error("Enter a valid amount");
      return;
    }

    try {
      await executeSwap();
      notification.success("Swap successful!");
      setInputAmount("");
      setOutputAmount("");
      setTimeout(() => {
        refetchBalanceA();
        refetchBalanceB();
      }, 2000);
    } catch (error) {
      console.error("Swap failed:", error);
      notification.error("Swap failed");
    }
  };

  const handleFlipTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setInputAmount("");
    setOutputAmount("");
  };

  const setMaxInput = () => {
    const balance = isTokenAInput ? balanceA : balanceB;
    if (balance) {
      setInputAmount(formatUnits(balance, tokenIn.decimals));
    }
  };

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return "0.0";
    return parseFloat(formatUnits(balance, decimals)).toFixed(4);
  };

  const needsApproval = () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) return false;

    const inputAmountBN = parseUnits(inputAmount, tokenIn.decimals);

    if (isTokenAInput) {
      return !allowanceA || allowanceA < inputAmountBN;
    } else {
      return !allowanceB || allowanceB < inputAmountBN;
    }
  };

  // Calculate exchange rate and price impact
  const exchangeRate =
    inputAmount && outputAmount && parseFloat(outputAmount) > 0
      ? (parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(6)
      : "0";

  const priceImpact =
    reserveA > 0n && reserveB > 0n && inputAmount && parseFloat(inputAmount) > 0
      ? (() => {
          const currentPrice = Number(formatUnits(reserveB, 6)) / Number(formatUnits(reserveA, 18));
          const newPrice = parseFloat(exchangeRate);
          const impact = Math.abs(((newPrice - currentPrice) / currentPrice) * 100);
          return impact.toFixed(2);
        })()
      : "0";

  const fee = inputAmount && parseFloat(inputAmount) > 0 ? (parseFloat(inputAmount) * 0.003).toFixed(6) : "0";

  // Calculate minimum received with slippage
  const minimumReceived =
    outputAmount && parseFloat(outputAmount) > 0 ? (parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6) : "0";

  return (
    <div className="w-full max-w-lg">
      {/* Main Swap Card */}
      <div className="card bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Swap Tokens</h2>
            <SlippageSettings
              slippage={slippage}
              deadline={deadline}
              onSlippageChange={handleSlippageChange}
              onDeadlineChange={handleDeadlineChange}
            />
          </div>

          {/* Input Token Section */}
          <div className="bg-base-200 rounded-2xl p-4 mb-2 border-2 border-base-300 hover:border-primary/40 transition-all">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-slate-400">You Pay</label>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Balance: {formatBalance(isTokenAInput ? balanceA : balanceB, tokenIn.decimals)}</span>
                <button className="btn btn-xs btn-primary btn-outline hover:btn-primary" onClick={setMaxInput}>
                  MAX
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.0"
                className="input input-ghost w-full text-3xl font-semibold focus:outline-none bg-transparent p-0 placeholder:text-base-content/30"
                value={inputAmount}
                onChange={e => setInputAmount(e.target.value)}
              />
              <TokenSelector
                selectedToken={tokenIn}
                onSelectToken={setTokenIn}
                otherToken={tokenOut}
                tokens={defaultTokens}
              />
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-2 z-10 relative">
            <button
              className="btn btn-circle btn-primary shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-base-100"
              onClick={handleFlipTokens}
            >
              <ArrowsUpDownIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Output Token Section */}
          <div className="bg-base-200 rounded-2xl p-4 mt-2 border-2 border-base-300 hover:border-secondary/40 transition-all">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-slate-400">You Receive</label>
              <span className="text-sm text-slate-400">
                Balance: {formatBalance(isTokenAInput ? balanceB : balanceA, tokenOut.decimals)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.0"
                className="input input-ghost w-full text-3xl font-semibold focus:outline-none bg-transparent p-0 placeholder:text-base-content/30"
                value={outputAmount}
                readOnly
              />
              <TokenSelector
                selectedToken={tokenOut}
                onSelectToken={setTokenOut}
                otherToken={tokenIn}
                tokens={defaultTokens}
              />
            </div>
          </div>

          {/* Quick Info / Details Toggle */}
          {inputAmount && outputAmount && parseFloat(outputAmount) > 0 && (
            <div className="mt-4">
              <button
                className="btn btn-ghost btn-block justify-between bg-base-200 hover:bg-base-300 border border-base-300"
                onClick={() => setShowDetails(!showDetails)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    1 {tokenIn.symbol} ≈ {exchangeRate} {tokenOut.symbol}
                  </span>
                  <span className="badge badge-sm">Fee: 0.3%</span>
                </div>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
              </button>

              {/* Detailed Stats - Expandable */}
              {showDetails && (
                <div className="bg-base-200 rounded-xl p-4 mt-2 space-y-3 border border-base-300 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Exchange Rate</span>
                    <span className="font-semibold">
                      1 {tokenIn.symbol} = {exchangeRate} {tokenOut.symbol}
                    </span>
                  </div>
                  <div className="divider my-0"></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Minimum Received</span>
                    <span className="font-semibold">
                      {minimumReceived} {tokenOut.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Trading Fee (0.3%)</span>
                    <span className="font-semibold">
                      {fee} {tokenIn.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Price Impact</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        parseFloat(priceImpact) > 5
                          ? "text-error"
                          : parseFloat(priceImpact) > 2
                          ? "text-warning"
                          : "text-success"
                      }`}
                    >
                      {priceImpact}%
                      {parseFloat(priceImpact) > 5 && <span className="badge badge-error badge-xs">High</span>}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Slippage Tolerance</span>
                    <span className="font-semibold">{slippage}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6">
            {needsApproval() ? (
              <button
                className="btn btn-primary btn-lg btn-block gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
                onClick={handleApprove}
              >
                <CheckCircleIcon className="h-6 w-6" />
                Approve {tokenIn.symbol}
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg btn-block shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-bold text-lg"
                onClick={handleSwap}
                disabled={!inputAmount || parseFloat(inputAmount) <= 0 || !outputAmount}
              >
                {!inputAmount || parseFloat(inputAmount) <= 0 ? "Enter an amount" : "Swap Tokens"}
              </button>
            )}
          </div>

          {/* Warning for high price impact */}
          {parseFloat(priceImpact) > 5 && (
            <div className="alert alert-error shadow-lg mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-semibold">⚠️ High price impact! Consider reducing your swap amount.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
