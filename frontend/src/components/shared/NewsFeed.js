import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Newspaper, Pin, ArrowRight, X } from "lucide-react";

const getYouTubeId = (url) => {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
};

const NewsArticle = ({ post, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
    <div className="max-w-3xl mx-auto p-4 py-8">
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        {post.media_type === "image" && post.media_url && (
          <img src={post.media_url} alt={post.title} className="w-full h-64 object-cover" />
        )}
        {post.media_type === "youtube" && getYouTubeId(post.media_url) && (
          <div className="aspect-video">
            <iframe src={`https://www.youtube.com/embed/${getYouTubeId(post.media_url)}`} className="w-full h-full" allowFullScreen title={post.title} />
          </div>
        )}
        <div className="p-4 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {post.pinned && <Pin className="w-4 h-4 text-primary flex-shrink-0" />}
              <div className="text-xs text-muted-foreground">
                <span className="text-primary font-bold">{post.author}</span>
                <span> · </span>
                <span>{new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6">{post.title}</h1>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base">{post.content}</p>
        </div>
      </div>
    </div>
  </div>
);

const NewsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => { loadNews(); }, [page]);

  const loadNews = async () => {
    try {
      const res = await api.getNewsFeed(page);
      setPosts(res.data.posts || res.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (e) {}
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-primary font-heading">LOADING...</div>;

  const pinnedPosts = posts.filter(p => p.pinned);
  const regularPosts = posts.filter(p => !p.pinned);

  return (
    <>
    <div className="p-6 max-w-5xl mx-auto">
      {selectedPost && <NewsArticle post={selectedPost} onClose={() => setSelectedPost(null)} />}

      <div className="mb-8 flex items-center gap-3">
        <Newspaper className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">News Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">Latest updates from Soccer Match</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned Posts - Featured */}
          {pinnedPosts.map(post => (
            <div key={post.id} onClick={() => setSelectedPost(post)}
              className="bg-card border border-primary/30 rounded-sm overflow-hidden cursor-pointer hover:border-primary/60 transition-colors group">
              {post.media_type === "image" && post.media_url && (
                <img src={post.media_url} alt={post.title} className="w-full h-56 object-cover group-hover:opacity-90 transition-opacity" />
              )}
              {post.media_type === "youtube" && getYouTubeId(post.media_url) && (
                <div className="relative h-56 bg-black/40 flex items-center justify-center">
                  <img src={`https://img.youtube.com/vi/${getYouTubeId(post.media_url)}/hqdefault.jpg`} alt={post.title} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-b-8 border-l-14 border-transparent border-l-white ml-1" style={{borderLeftWidth: '14px'}} />
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm font-bold uppercase">Pinned</span>
                  <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                <h2 className="text-xl font-heading font-bold uppercase mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.content}</p>
                <div className="flex items-center gap-1 text-xs text-primary font-bold">
                  Read more <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}

          {/* Regular Posts - Grid */}
          {regularPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regularPosts.map(post => (
                <div key={post.id} onClick={() => setSelectedPost(post)}
                  className="bg-card border border-border/50 rounded-sm overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group">
                  {post.media_type === "image" && post.media_url && (
                    <img src={post.media_url} alt={post.title} className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity" />
                  )}
                  {post.media_type === "youtube" && getYouTubeId(post.media_url) && (
                    <div className="relative h-40 bg-black/40">
                      <img src={`https://img.youtube.com/vi/${getYouTubeId(post.media_url)}/hqdefault.jpg`} alt={post.title} className="w-full h-full object-cover opacity-70" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-t-6 border-b-6 border-l-10 border-transparent ml-0.5" style={{borderTopWidth:'6px', borderBottomWidth:'6px', borderLeftWidth:'10px', borderLeftColor:'white'}} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                    <h3 className="font-heading font-bold uppercase mb-2 group-hover:text-primary transition-colors text-sm">{post.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-1 text-xs text-primary font-bold">
                      Read more <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
            Previous
          </button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default NewsFeed;