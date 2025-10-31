"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ArrowRightIcon, BoltIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center px-5 py-20 bg-gradient-to-br from-base-300 via-base-100 to-base-300">
        <div className="max-w-6xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full w-fit">
                <SparklesIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Powered by Lisk</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                Trade Tokens
                <span className="block text-primary mt-2">Instantly</span>
              </h1>

              <p className="text-xl text-slate-400 max-w-lg">
                Experience seamless decentralized trading with automated market making. Swap tokens and provide
                liquidity with zero intermediaries.
              </p>

              {isConnected && (
                <div className="flex items-center gap-3 p-4 bg-base-200 rounded-xl w-fit">
                  <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                  <span className="text-sm text-slate-400">Connected:</span>
                  <Address address={connectedAddress} />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/dex" passHref>
                  <button className="btn btn-primary btn-lg gap-2 group">
                    Launch DEX
                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/debug" passHref>
                  <button className="btn btn-outline btn-lg">View Contracts</button>
                </Link>
              </div>
            </div>

            {/* Right Column - Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card bg-base-200 shadow-xl border border-primary/20 hover:border-primary/40 transition-all duration-300">
                <div className="card-body">
                  <BoltIcon className="h-8 w-8 text-primary mb-2" />
                  <h3 className="card-title text-lg">Instant Swaps</h3>
                  <p className="text-sm text-slate-400">Execute trades in seconds with our optimized AMM algorithm</p>
                </div>
              </div>

              <div className="card bg-base-200 shadow-xl border border-secondary/20 hover:border-secondary/40 transition-all duration-300">
                <div className="card-body">
                  <ShieldCheckIcon className="h-8 w-8 text-secondary mb-2" />
                  <h3 className="card-title text-lg">Secure</h3>
                  <p className="text-sm text-slate-400">Audited smart contracts ensure your funds are always safe</p>
                </div>
              </div>

              <div className="card bg-base-200 shadow-xl border border-accent/20 hover:border-accent/40 transition-all duration-300">
                <div className="card-body">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-accent mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="card-title text-lg">Low Fees</h3>
                  <p className="text-sm text-slate-400">Only 0.3% trading fee with rewards for liquidity providers</p>
                </div>
              </div>

              <div className="card bg-base-200 shadow-xl border border-info/20 hover:border-info/40 transition-all duration-300">
                <div className="card-body">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-info mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="card-title text-lg">Community</h3>
                  <p className="text-sm text-slate-400">Join a growing ecosystem of DeFi enthusiasts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-base-300 py-16 px-5 border-t border-[#252442]">
        <div className="max-w-6xl mx-auto">
          <div className="stats stats-vertical lg:stats-horizontal shadow-xl w-full bg-base-200">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-8 h-8 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="stat-title">Trading Fee</div>
              <div className="stat-value text-primary">0.3%</div>
              <div className="stat-desc">Competitive rates</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-8 h-8 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  ></path>
                </svg>
              </div>
              <div className="stat-title">Token Pairs</div>
              <div className="stat-value text-secondary">MTK/sUSDC</div>
              <div className="stat-desc">More coming soon</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-accent">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-8 h-8 stroke-current"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div className="stat-title">Network</div>
              <div className="stat-value text-accent">Lisk</div>
              <div className="stat-desc">Fast & Reliable</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to start trading?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Connect your wallet and experience the future of decentralized finance
          </p>
          <Link href="/dex" passHref>
            <button className="btn btn-primary btn-lg gap-2 group">
              Go to DEX
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
