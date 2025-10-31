"use client";

import { useEffect, useState } from "react";
import { Cog6ToothIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SlippageSettingsProps {
  slippage: number;
  deadline: number;
  onSlippageChange: (slippage: number) => void;
  onDeadlineChange: (deadline: number) => void;
}

export const SlippageSettings = ({ slippage, deadline, onSlippageChange, onDeadlineChange }: SlippageSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");
  const [customDeadline, setCustomDeadline] = useState("");
  const [showSlippageWarning, setShowSlippageWarning] = useState(false);

  const presetSlippages = [0.1, 0.5, 1.0];
  const presetDeadlines = [10, 20, 30];

  useEffect(() => {
    // Show warning for high or very low slippage
    if (slippage > 5 || slippage < 0.05) {
      setShowSlippageWarning(true);
    } else {
      setShowSlippageWarning(false);
    }
  }, [slippage]);

  const handlePresetSlippage = (value: number) => {
    onSlippageChange(value);
    setCustomSlippage("");
  };

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onSlippageChange(numValue);
    }
  };

  const handlePresetDeadline = (value: number) => {
    onDeadlineChange(value);
    setCustomDeadline("");
  };

  const handleCustomDeadline = (value: string) => {
    setCustomDeadline(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 4320) {
      // Max 3 days
      onDeadlineChange(numValue);
    }
  };

  return (
    <>
      {/* Settings Button */}
      <button
        className="btn btn-circle btn-ghost btn-sm hover:bg-base-200 relative"
        onClick={() => setIsOpen(true)}
        title="Transaction Settings"
      >
        <Cog6ToothIcon className="h-5 w-5" />
        {showSlippageWarning && (
          <span className="absolute top-0 right-0 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)}></div>

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="card bg-base-100 w-full max-w-md shadow-2xl border border-base-300 animate-in fade-in zoom-in duration-200">
              <div className="card-body">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Cog6ToothIcon className="h-6 w-6" />
                    Transaction Settings
                  </h3>
                  <button className="btn btn-circle btn-ghost btn-sm" onClick={() => setIsOpen(false)}>
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Slippage Tolerance Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold">Slippage Tolerance</label>
                    <div className="badge badge-outline">{slippage}%</div>
                  </div>

                  {/* Slippage Warning */}
                  {showSlippageWarning && (
                    <div className="alert alert-warning py-2">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="text-xs">
                        {slippage > 5
                          ? "High slippage tolerance may result in unfavorable trades"
                          : "Very low slippage may cause transaction failures"}
                      </span>
                    </div>
                  )}

                  {/* Preset Slippage Buttons */}
                  <div className="flex gap-2">
                    {presetSlippages.map(value => (
                      <button
                        key={value}
                        className={`btn btn-sm flex-1 ${
                          slippage === value && !customSlippage ? "btn-primary" : "btn-outline"
                        }`}
                        onClick={() => handlePresetSlippage(value)}
                      >
                        {value}%
                      </button>
                    ))}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Custom"
                        className={`input input-sm input-bordered w-full ${customSlippage ? "input-primary" : ""}`}
                        value={customSlippage}
                        onChange={e => handleCustomSlippage(e.target.value)}
                        min="0"
                        max="50"
                        step="0.1"
                      />
                      {customSlippage && <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Your transaction will revert if the price changes unfavorably by more than this percentage.
                  </p>
                </div>

                <div className="divider"></div>

                {/* Transaction Deadline Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold">Transaction Deadline</label>
                    <div className="badge badge-outline">{deadline} min</div>
                  </div>

                  {/* Preset Deadline Buttons */}
                  <div className="flex gap-2">
                    {presetDeadlines.map(value => (
                      <button
                        key={value}
                        className={`btn btn-sm flex-1 ${
                          deadline === value && !customDeadline ? "btn-primary" : "btn-outline"
                        }`}
                        onClick={() => handlePresetDeadline(value)}
                      >
                        {value}m
                      </button>
                    ))}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Custom"
                        className={`input input-sm input-bordered w-full ${customDeadline ? "input-primary" : ""}`}
                        value={customDeadline}
                        onChange={e => handleCustomDeadline(e.target.value)}
                        min="1"
                        max="4320"
                      />
                      {customDeadline && <span className="absolute right-2 top-1.5 text-xs text-slate-400">m</span>}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Your transaction will revert if it is pending for more than this duration.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-end mt-6">
                  <button className="btn btn-ghost" onClick={() => setIsOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Custom hook to manage slippage settings
export const useSlippageSettings = () => {
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%
  const [deadline, setDeadline] = useState(20); // Default 20 minutes

  // Load from localStorage
  useEffect(() => {
    const savedSlippage = localStorage.getItem("slippage");
    const savedDeadline = localStorage.getItem("deadline");

    if (savedSlippage) setSlippage(parseFloat(savedSlippage));
    if (savedDeadline) setDeadline(parseInt(savedDeadline));
  }, []);

  // Save to localStorage
  const handleSlippageChange = (newSlippage: number) => {
    setSlippage(newSlippage);
    localStorage.setItem("slippage", newSlippage.toString());
  };

  const handleDeadlineChange = (newDeadline: number) => {
    setDeadline(newDeadline);
    localStorage.setItem("deadline", newDeadline.toString());
  };

  // Calculate minimum amount out based on slippage
  const calculateMinimumAmountOut = (expectedAmount: bigint): bigint => {
    const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
    return (expectedAmount * slippageMultiplier) / 10000n;
  };

  return {
    slippage,
    deadline,
    handleSlippageChange,
    handleDeadlineChange,
    calculateMinimumAmountOut,
  };
};
