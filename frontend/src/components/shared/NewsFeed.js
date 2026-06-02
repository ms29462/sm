import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Newspaper, Pin } from "lucide-react";

const NewsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const res = await api.getNewsFeed();
      setPosts(res.data || []);
    } catch (e) {}
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Newspaper className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase">News Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">Latest updates from Soccer Match</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className={`bg-card border rounded-sm p-6 ${post.pinned ? "border-primary/30" : "border-border/50"}`}>
              <div className="flex items-start gap-2 mb-2">
                {post.pinned && <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                <h3 className="font-heading font-bold uppercase text-lg">{post.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-primary font-bold">{post.author}</span>
                <span>·</span>
                <span>{new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                {post.pinned && <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">Pinned</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;