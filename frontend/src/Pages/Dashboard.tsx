import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Copy,
  Trash2,
  MoreVertical,
  Calendar,
  Layers,
  Compass,
  PenTool,
  ArrowRight,
  User,
} from "lucide-react";
import { api } from "../services/api";
import { Navbar } from "../Components/Navbar";
import { Button } from "../Components/UI/Button";
import { SketchParticles } from "../Components/UI/SketchParticles";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "owned" | "shared">("all");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadDrawings();
  }, []);

  const loadDrawings = async () => {
    setLoading(true);
    try {
      const res = await api.getDrawings();
      setDrawings(res.drawings || []);
    } catch (err: any) {
      console.error("Failed to load drawings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.createDrawing("Untitled Drawing");
      const targetId = res.drawing?.id || res.drawing?._id;
      if (targetId) {
        navigate(`/canvas/${targetId}`);
      } else {
        await loadDrawings();
      }
    } catch (err: any) {
      console.error("Failed to create drawing:", err);
      alert(err.message || "Failed to create new drawing");
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.duplicateDrawing(id);
      if (res.drawing) {
        await loadDrawings();
      }
    } catch (err) {
      alert("Failed to duplicate drawing");
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this drawing?")) return;
    try {
      await api.deleteDrawing(id);
      setDrawings((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete drawing");
    } finally {
      setActiveMenuId(null);
    }
  };

  const filteredDrawings = drawings.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    if (filter === "owned") return matchesSearch && d.role === "owner";
    if (filter === "shared") return matchesSearch && d.role !== "owner";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col relative transition-colors selection:bg-(--accent-primary) selection:text-white">
      {/* Interactive Floating Graphite Particles */}
      <SketchParticles />

      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b-2 border-dashed border-(--border-strong)">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-(--accent-primary)" />
              <span className="text-[11px] font-mono uppercase text-(--accent-primary) font-bold tracking-wider">
                WORKSPACE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-pencil tracking-tight text-(--text-primary)">
              Your Drawings
            </h1>
            <p className="text-xs text-(--text-muted) mt-1">
              Create, brainstorm, and collaborate in real time
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/profile">
              <Button
                variant="outline"
                size="md"
                startIcon={<User className="w-3.5 h-3.5 text-(--accent-primary)" />}
              >
                Profile & Settings
              </Button>
            </Link>

            <Button
              variant="primary"
              size="md"
              onClick={handleCreate}
              loading={creating}
              startIcon={<Plus className="w-4 h-4" />}
              className="shadow-md"
            >
              New Drawing
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8 font-mono text-xs">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-(--bg-surface-elevated) border border-(--border-strong)">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === "all"
                  ? "bg-(--bg-surface) text-(--text-primary) font-bold shadow-sm"
                  : "text-(--text-muted) hover:text-(--text-primary)"
              }`}
            >
              All Drawings ({drawings.length})
            </button>
            <button
              onClick={() => setFilter("owned")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === "owned"
                  ? "bg-(--bg-surface) text-(--text-primary) font-bold shadow-sm"
                  : "text-(--text-muted) hover:text-(--text-primary)"
              }`}
            >
              Created by me
            </button>
            <button
              onClick={() => setFilter("shared")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === "shared"
                  ? "bg-(--bg-surface) text-(--text-primary) font-bold shadow-sm"
                  : "text-(--text-muted) hover:text-(--text-primary)"
              }`}
            >
              Shared with me
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-(--text-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drawings..."
              className="w-full pl-9 pr-3 py-1.5 bg-(--bg-surface) border border-(--border-strong) rounded-lg text-xs text-(--text-primary) placeholder-(--text-muted) font-mono focus:outline-none focus:border-(--accent-primary) shadow-sm transition-colors"
            />
          </div>
        </div>

        {/* Drawings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-xl bg-(--bg-surface-elevated) border border-(--border-subtle) animate-pulse"
              />
            ))}
          </div>
        ) : filteredDrawings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 rounded-2xl border-2 border-dashed border-(--border-strong) bg-(--bg-surface) text-center font-mono relative">
            <div className="drafting-tape-tl" />
            <div className="drafting-tape-tr" />
            <PenTool className="w-10 h-10 text-(--accent-primary) mb-3 opacity-70" />
            <h3 className="text-xl font-bold font-pencil text-(--text-primary) mb-1">
              No Drawings Yet
            </h3>
            <p className="text-xs text-(--text-muted) max-w-sm mb-5 leading-relaxed">
              {search
                ? `No drawings found matching "${search}". Try clearing search filter.`
                : "Start a new drawing to brainstorm ideas, sketch diagrams, and collaborate with your team."}
            </p>
            <Button variant="primary" size="md" onClick={handleCreate}>
              Create Your First Drawing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrawings.map((d) => (
              <div
                key={d.id || d._id}
                className="group relative rounded-xl bg-(--bg-surface) border-2 border-(--border-strong) hover:border-(--accent-primary) shadow-md hover:shadow-xl transition-all flex flex-col overflow-hidden"
              >
                {/* Visual Corner Drafting Tape */}
                <div className="drafting-tape-tl" />

                {/* Drawing Preview Sheet */}
                <Link
                  to={`/canvas/${d.id || d._id}`}
                  className="h-36 bg-(--canvas-bg) p-4 flex flex-col justify-between relative overflow-hidden border-b border-(--border-subtle)"
                >
                  {/* Subtle Precision Grid */}
                  <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(var(--canvas-grid) 1.5px, transparent 1.5px)`,
                      backgroundSize: `20px 20px`,
                    }}
                  />

                  {/* Top Sheet Badges */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-(--bg-surface) border border-(--border-subtle) text-(--text-secondary) font-bold">
                      DRAWING #{String(d.id || d._id).slice(-4).toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${
                        d.role === "owner"
                          ? "bg-(--accent-primary)/10 text-(--accent-primary) border-(--accent-primary)/30"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      }`}
                    >
                      {d.role}
                    </span>
                  </div>

                  {/* Centered Hand-sketched Drafting Wireframe Icon */}
                  <div className="flex items-center justify-center z-10 my-auto">
                    <div className="p-3 rounded-lg bg-(--bg-surface) border border-(--border-subtle) group-hover:scale-110 transition-transform shadow-sm">
                      <Layers className="w-6 h-6 text-(--accent-primary) stroke-1" />
                    </div>
                  </div>

                  {/* Quick Launch CTA on Hover */}
                  <div className="text-[11px] font-mono text-(--text-muted) flex items-center justify-between z-10">
                    <span>{d.elementsCount || 0} shapes & strokes</span>
                    <span className="text-(--accent-primary) font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Canvas</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>

                {/* Blueprint Sheet Card Footer */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-(--bg-surface)">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/canvas/${d.id || d._id}`}
                      className="font-bold text-lg font-pencil text-(--text-primary) hover:text-(--accent-primary) transition-colors line-clamp-1"
                    >
                      {d.title}
                    </Link>

                    {/* Action Dropdown Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(activeMenuId === d.id ? null : d.id)
                        }
                        className="p-1 rounded text-(--text-muted) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === d.id && (
                        <div className="absolute right-0 mt-1 w-36 rounded-lg bg-(--bg-surface) border border-(--border-strong) shadow-2xl py-1 z-30 font-mono text-xs">
                          <button
                            onClick={() => handleDuplicate(d.id)}
                            className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>
                          {d.role === "owner" && (
                            <button
                              onClick={() => handleDelete(d.id)}
                              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Archive / Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Revision Date Stamp */}
                  <div className="mt-4 pt-3 border-t border-(--border-subtle) flex items-center justify-between text-[10px] font-mono text-(--text-muted)">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-(--text-muted)" />
                      <span>REV: {new Date(d.updatedAt).toLocaleDateString()}</span>
                    </span>
                    <span className="text-emerald-500 font-semibold">● SYNCED</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
export default Dashboard;
