"use client";
import { IMinglet } from "@/models/minglets";

interface Props {
  minglet: IMinglet | null;
  onClose: () => void;
}

export default function ProfileOverlay({ minglet, onClose }: Props) {
  if (!minglet) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-xl p-6 w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{minglet.name}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Profile Info */}
        <div className="space-y-4">
          {/* Basic Stats */}
          <div className="bg-white/10 rounded-lg p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/70">Age</span>
                <p className="text-white font-medium">
                  {minglet.stats.age.toFixed(2)} days
                </p>{" "}
              </div>
              <div>
                <span className="text-white/70">Generation</span>
                <p className="text-white font-medium">{minglet.generation}</p>
              </div>
            </div>
          </div>

          {/* Personality */}
          {minglet.personality.length > 0 && (
            <div className="bg-white/10 rounded-lg p-4 border border-white/10">
              <h3 className="text-white/70 text-sm mb-2">Personality Traits</h3>
              <div className="flex flex-wrap gap-2">
                {minglet.personality.map((trait, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-500/30 text-purple-200 text-xs rounded-full border border-purple-400/30"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Parents */}
          {minglet.parents.length > 0 && (
            <div className="bg-white/10 rounded-lg p-4 border border-white/10">
              <h3 className="text-white/70 text-sm mb-2">Parents</h3>
              <div className="space-y-1">
                {minglet.parents.map((parentId, index) => (
                  <p key={index} className="text-white font-mono text-xs">
                    {parentId}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Owner */}
          <div className="bg-white/10 rounded-lg p-4 border border-white/10">
            <h3 className="text-white/70 text-sm mb-2">Owner</h3>
            <p className="text-white font-mono text-sm"></p>
            <p className="text-white/50 text-xs mt-1 break-all">
              {minglet.ownerWallet}
            </p>
          </div>

          {/* Status */}
          <div className="bg-white/10 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  minglet.isAlive ? "bg-green-400" : "bg-red-400"
                }`}
              ></div>
              <span className="text-white text-sm">
                {minglet.isAlive ? "Alive" : "Deceased"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
