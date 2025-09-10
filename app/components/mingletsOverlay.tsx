"use client";
import { IMinglet } from "@/models/minglets";

interface Props {
  wallet: string | null;
  connectWallet: () => void;
  minglets: IMinglet[];
  loading: boolean;
  refreshMinglets: () => void;
}

export default function MingletOverlay({
  wallet,
  connectWallet,
  minglets,
  loading,
  refreshMinglets,
}: Props) {
  const createMinglet = async () => {
    if (!wallet) return alert("Connect your wallet first!");
    const name = prompt("Enter Minglet name:");
    if (!name) return;

    await fetch("/api/minglets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // keep JWT cookie
      body: JSON.stringify({ name }),
    });

    refreshMinglets();
  };

  const handleAction = async (id: string, action: "feed" | "play") => {
    if (!wallet) return alert("Connect your wallet first!");

    await fetch("/api/minglets/action", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, action }),
    });

    refreshMinglets();
  };

  // 🟢 Only show Minglets owned by this wallet
  const ownedMinglets = minglets.filter((m) => m.ownerWallet === wallet);

  return (
    <>
      {/* Top bar (wallet + create button / connect) */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        {wallet ? (
          <>
            <span className="text-xs font-mono text-white/70">
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </span>
            <button
              onClick={createMinglet}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 border border-white/20 rounded-full flex items-center justify-center text-white text-lg leading-none transition-colors"
              title="Create Minglet"
            >
              +
            </button>
          </>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm backdrop-blur-sm transition-colors"
          >
            Connect
          </button>
        )}
      </div>

      {/* Minglet list */}
      <div className="absolute bottom-6 left-6 w-64">
        {loading ? (
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 text-center text-white/70 text-sm">
            Loading...
          </div>
        ) : ownedMinglets.length === 0 ? (
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 text-center text-white/50 text-sm">
            No Minglets yet
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {ownedMinglets.map((m) => (
              <div
                key={m._id}
                className="bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">
                    {m.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAction(m._id, "feed")}
                      className="w-6 h-6 bg-green-500/80 hover:bg-green-500 rounded text-white text-xs flex items-center justify-center transition-colors"
                      title="Feed"
                    >
                      🍗
                    </button>
                    <button
                      onClick={() => handleAction(m._id, "play")}
                      className="w-6 h-6 bg-blue-500/80 hover:bg-blue-500 rounded text-white text-xs flex items-center justify-center transition-colors"
                      title="Play"
                    >
                      😊
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-white/70">
                  <span>🍗 {m.stats.hunger.toFixed(2)}</span>
                  <span>😊 {m.stats.happiness.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
