"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { ChevronDownIcon, ClockIcon, MagnifyingGlassIcon, StarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  isPopular?: boolean;
}

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  otherToken?: Token | null; // To prevent selecting same token twice
  tokens: Token[];
}

export const TokenSelector = ({ selectedToken, onSelectToken, otherToken, tokens }: TokenSelectorProps) => {
  const { address: connectedAddress } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentTokens, setRecentTokens] = useState<string[]>([]);
  const [favoriteTokens, setFavoriteTokens] = useState<string[]>([]);

  // Load recent and favorite tokens from localStorage
  useEffect(() => {
    const recent = localStorage.getItem("recentTokens");
    const favorites = localStorage.getItem("favoriteTokens");

    if (recent) setRecentTokens(JSON.parse(recent));
    if (favorites) setFavoriteTokens(JSON.parse(favorites));
  }, []);

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
    setSearchQuery("");

    // Add to recent tokens
    const updated = [token.address, ...recentTokens.filter(addr => addr !== token.address)].slice(0, 5);
    setRecentTokens(updated);
    localStorage.setItem("recentTokens", JSON.stringify(updated));
  };

  const toggleFavorite = (tokenAddress: string) => {
    const updated = favoriteTokens.includes(tokenAddress)
      ? favoriteTokens.filter(addr => addr !== tokenAddress)
      : [...favoriteTokens, tokenAddress];

    setFavoriteTokens(updated);
    localStorage.setItem("favoriteTokens", JSON.stringify(updated));
  };

  // Filter tokens based on search
  const filteredTokens = tokens.filter(
    token =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Get popular tokens
  const popularTokens = tokens.filter(t => t.isPopular);

  // Get recent tokens objects
  const recentTokenObjects = recentTokens.map(addr => tokens.find(t => t.address === addr)).filter(Boolean) as Token[];

  // Get favorite tokens objects
  const favoriteTokenObjects = favoriteTokens
    .map(addr => tokens.find(t => t.address === addr))
    .filter(Boolean) as Token[];

  return (
    <>
      {/* Token Button */}
      <button
        className="btn btn-ghost gap-2 bg-base-300 hover:bg-base-300/80 border border-base-content/10 min-w-fit px-4"
        onClick={() => setIsOpen(true)}
      >
        {selectedToken ? (
          <>
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-6">
                <span className="text-xs font-bold">{selectedToken.symbol[0]}</span>
              </div>
            </div>
            <span className="font-bold text-base">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="font-bold">Select Token</span>
        )}
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)}></div>

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="card bg-base-100 w-full max-w-md shadow-2xl border border-base-300 max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="card-body p-4 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Select a Token</h3>
                  <button className="btn btn-circle btn-ghost btn-sm" onClick={() => setIsOpen(false)}>
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or paste address"
                    className="input input-bordered w-full pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-circle btn-ghost btn-xs absolute right-2 top-2"
                      onClick={() => setSearchQuery("")}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Token Lists */}
                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Popular Tokens */}
                  {!searchQuery && popularTokens.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-slate-400 mb-2 px-2">Popular Tokens</div>
                      <div className="flex gap-2 flex-wrap">
                        {popularTokens.map(token => (
                          <button
                            key={token.address}
                            className="btn btn-sm btn-outline gap-2"
                            onClick={() => handleSelectToken(token)}
                            disabled={token.address === otherToken?.address}
                          >
                            <div className="avatar placeholder">
                              <div className="bg-primary text-primary-content rounded-full w-5">
                                <span className="text-xs">{token.symbol[0]}</span>
                              </div>
                            </div>
                            {token.symbol}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Favorite Tokens */}
                  {!searchQuery && favoriteTokenObjects.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-slate-400 mb-2 px-2 flex items-center gap-2">
                        <StarIconSolid className="h-4 w-4 text-warning" />
                        Favorites
                      </div>
                      <TokenList
                        tokens={favoriteTokenObjects}
                        onSelect={handleSelectToken}
                        onToggleFavorite={toggleFavorite}
                        favoriteTokens={favoriteTokens}
                        disabledToken={otherToken}
                        connectedAddress={connectedAddress}
                      />
                    </div>
                  )}

                  {/* Recent Tokens */}
                  {!searchQuery && recentTokenObjects.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-slate-400 mb-2 px-2 flex items-center gap-2">
                        <ClockIcon className="h-4 w-4" />
                        Recent
                      </div>
                      <TokenList
                        tokens={recentTokenObjects}
                        onSelect={handleSelectToken}
                        onToggleFavorite={toggleFavorite}
                        favoriteTokens={favoriteTokens}
                        disabledToken={otherToken}
                        connectedAddress={connectedAddress}
                      />
                    </div>
                  )}

                  {/* All Tokens */}
                  <div>
                    {searchQuery && (
                      <div className="text-sm font-semibold text-slate-400 mb-2 px-2">Search Results</div>
                    )}
                    <TokenList
                      tokens={filteredTokens}
                      onSelect={handleSelectToken}
                      onToggleFavorite={toggleFavorite}
                      favoriteTokens={favoriteTokens}
                      disabledToken={otherToken}
                      connectedAddress={connectedAddress}
                    />
                  </div>

                  {/* No Results */}
                  {filteredTokens.length === 0 && (
                    <div className="text-center py-8">
                      <MagnifyingGlassIcon className="h-12 w-12 text-base-300 mx-auto mb-2" />
                      <p className="text-slate-400">No tokens found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Token List Component
interface TokenListProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  onToggleFavorite: (address: string) => void;
  favoriteTokens: string[];
  disabledToken?: Token | null;
  connectedAddress?: string;
}

const TokenList = ({
  tokens,
  onSelect,
  onToggleFavorite,
  favoriteTokens,
  disabledToken,
  connectedAddress,
}: TokenListProps) => {
  return (
    <div className="space-y-1">
      {tokens.map(token => (
        <TokenRow
          key={token.address}
          token={token}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favoriteTokens.includes(token.address)}
          isDisabled={token.address === disabledToken?.address}
          connectedAddress={connectedAddress}
        />
      ))}
    </div>
  );
};

// Token Row Component
interface TokenRowProps {
  token: Token;
  onSelect: (token: Token) => void;
  onToggleFavorite: (address: string) => void;
  isFavorite: boolean;
  isDisabled: boolean;
  connectedAddress?: string;
}

const TokenRow = ({ token, onSelect, onToggleFavorite, isFavorite, isDisabled, connectedAddress }: TokenRowProps) => {
  // Get token balance
  const { data: balance } = useScaffoldContractRead({
    contractName: token.symbol === "MTK" ? "MyToken" : "SimpleUSDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return "0";
    return parseFloat(formatUnits(bal, token.decimals)).toFixed(4);
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl hover:bg-base-200 transition-colors ${
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={() => !isDisabled && onSelect(token)}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="avatar placeholder">
          <div className="bg-primary text-primary-content rounded-full w-10">
            <span className="text-sm font-bold">{token.symbol[0]}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="font-bold flex items-center gap-2">
            {token.symbol}
            {isDisabled && <span className="badge badge-sm">Selected</span>}
          </div>
          <div className="text-xs text-slate-400">{token.name}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right mr-2">
          <div className="font-semibold">{formatBalance(balance)}</div>
        </div>
        <button
          className="btn btn-circle btn-ghost btn-xs"
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite(token.address);
          }}
        >
          {isFavorite ? (
            <StarIconSolid className="h-4 w-4 text-warning" />
          ) : (
            <StarIcon className="h-4 w-4 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
};

// Sample token list (you can expand this)
export const defaultTokens: Token[] = [
  {
    address: "0x...", // Your MTK address
    symbol: "MTK",
    name: "My Token",
    decimals: 18,
    isPopular: true,
  },
  {
    address: "0x...", // Your sUSDC address
    symbol: "sUSDC",
    name: "Simple USDC",
    decimals: 6,
    isPopular: true,
  },
  // Add more tokens here as your DEX grows
];
