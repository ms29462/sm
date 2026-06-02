import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Newspaper, Plus, Trash2, Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES = [
  { id: "player", label: "Players" },
  { id: "club", label: "Clubs" },
  { id: "college", label: "Colleges" },
  { id: "federation", label: "Federations" },
  { id: "agent", label: "Agents" },
  { id: "specialist", label: "Specialists" },
];

const AdminNews = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    target_roles: ["player", "club", "college", "federation", "agent", "specialist"],
    pinned: false,
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await api.getAdminNews();
      setPosts(res.data || []);
    } catch (e) {
      toast.error("Failed to load news");
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (form.target_roles.length === 0) {
      toast.error("Select at least one target audience");
      return;
    }
    try {
      await api.createNewsPost(form);
      toast.success("News post published!");
      setShowCreate(false);
      setForm({ title: "", content: "", target_roles: ["player", "club", "college", "federation", "agent", "specialist"], pinned: false });
      loadPosts();
    } catch (e) {
      toast.error("Failed to publish");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.deleteNewsPost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success("Deleted!");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handlePin = async (id) => {
    try {
      await api.togglePinNews(id);
      loadPosts();
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const toggleRole = (role) => {
    setForm(f => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter(r => r !== role)
        : [...f.target_roles, role]
    }));
  };

  const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 text-sm text-white outline-none";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase">News Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">Publish updates and announcements to users</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary text-black font-bold rounded-sm">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      {/* Create Post Form */}
      {showCreate && (
        <div className="bg-card border border-border/50 rounded-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold uppercase">Create News Post</h2>
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                placeholder="Post title..." className={inputClass + " h-10 mt-1"} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Content *</label>
              <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))}
                placeholder="Write your announcement..." rows={5}
                className={inputClass + " mt-1 p-3 resize-none"} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Target Audience</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
                  <button key={role.id} onClick={() => toggleRole(role.id)}
                    className={`px-3 py-1.5 text-xs rounded-sm border font-bold transition-colors ${
                      form.target_roles.includes(role.id)
                        ? "bg-primary text-black border-primary"
                        : "border-white/20 text-muted-foreground hover:border-white/40"
                    }`}>
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pinned" checked={form.pinned}
                onChange={e => setForm(f => ({...f, pinned: e.target.checked}))}
                className="accent-primary w-4 h-4" />
              <label htmlFor="pinned" className="text-sm text-muted-foreground cursor-pointer">Pin this post (appears at top)</label>
            </div>
            <Button onClick={handleCreate} className="w-full bg-primary text-black font-bold rounded-sm">
              Publish Post
            </Button>
          </div>
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-8 text-primary font-heading">LOADING...</div>
      ) : posts.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No news posts yet. Create your first announcement!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className={`bg-card border rounded-sm p-6 ${post.pinned ? "border-primary/50" : "border-border/50"}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div className="flex items-start gap-2">
                  {post.pinned && <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                  <h3 className="font-heading font-bold uppercase">{post.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePin(post.id)}
                    className={`text-xs px-2 py-1 rounded-sm border transition-colors ${post.pinned ? "border-primary text-primary" : "border-white/20 text-muted-foreground hover:border-primary hover:text-primary"}`}>
                    {post.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button onClick={() => handleDelete(post.id)}
                    className="text-destructive hover:bg-destructive/10 p-1.5 rounded-sm transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{post.content}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <div className="flex flex-wrap gap-1">
                  {post.target_roles.map(role => (
                    <span key={role} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm text-muted-foreground capitalize">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNews;