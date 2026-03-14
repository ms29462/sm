import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Bookmark, Clock, User, Play, BookmarkX } from 'lucide-react';

const MasterclassBookmarks = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const response = await api.getUserBookmarks();
      setBookmarks(response.data || []);
    } catch (error) {
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (e, masterclassId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await api.removeBookmark(masterclassId);
      setBookmarks(bookmarks.filter(m => m.id !== masterclassId));
      toast.success('Removed from bookmarks');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/player/masterclass')}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </Button>
        <div className="flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-primary fill-primary" />
          <h1 className="text-3xl font-heading font-bold uppercase">SAVED MASTERCLASSES</h1>
        </div>
        <p className="text-muted-foreground mt-2">Your bookmarked lessons for later</p>
      </div>

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <BookmarkX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">You haven't saved any masterclasses yet</p>
          <Link to="/player/masterclass">
            <Button className="bg-primary text-black font-bold">
              BROWSE MASTERCLASSES
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((masterclass) => (
            <Link
              key={masterclass.id}
              to={`/player/masterclass/${masterclass.id}`}
              className="bg-card border border-border rounded-sm overflow-hidden hover:border-primary/50 transition-colors group"
            >
              <div className="relative aspect-video bg-muted">
                {masterclass.thumbnail ? (
                  <img src={masterclass.thumbnail} alt={masterclass.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white" />
                </div>
                <button
                  onClick={(e) => handleRemoveBookmark(e, masterclass.id)}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-sm hover:bg-red-500/80"
                  title="Remove bookmark"
                >
                  <Bookmark className="w-4 h-4 text-primary fill-primary" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-sm ${getDifficultyColor(masterclass.difficulty)}`}>
                    {masterclass.difficulty}
                  </span>
                </div>
                <h3 className="font-heading font-bold uppercase mb-2 line-clamp-2">{masterclass.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {masterclass.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {masterclass.duration_minutes} min
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MasterclassBookmarks;
