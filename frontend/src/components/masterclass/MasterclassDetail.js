import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, Bookmark, Clock, User, Play, MessageCircle, 
  Send, Trash2, Eye, Calendar
} from 'lucide-react';

const MasterclassDetail = () => {
  const { masterclassId } = useParams();
  const navigate = useNavigate();
  const [masterclass, setMasterclass] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadMasterclass();
  }, [masterclassId]);

  const loadMasterclass = async () => {
    try {
      const [masterclassRes, commentsRes, bookmarksRes] = await Promise.all([
        api.getMasterclass(masterclassId),
        api.getMasterclassComments(masterclassId),
        api.getUserBookmarks().catch(() => ({ data: [] }))
      ]);

      setMasterclass(masterclassRes.data);
      setComments(commentsRes.data || []);
      setIsBookmarked(bookmarksRes.data.some(m => m.id === masterclassId));
    } catch (error) {
      toast.error('Failed to load masterclass');
      navigate('/player/masterclass');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await api.removeBookmark(masterclassId);
        setIsBookmarked(false);
        toast.success('Removed from bookmarks');
      } else {
        await api.bookmarkMasterclass(masterclassId);
        setIsBookmarked(true);
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await api.addMasterclassComment(masterclassId, newComment.trim());
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await api.deleteMasterclassComment(masterclassId, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  if (!masterclass) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Masterclass not found</p>
        <Button onClick={() => navigate('/player/masterclass')} className="mt-4">
          Back to Masterclasses
        </Button>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(masterclass.video_url);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          data-testid="back-btn"
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </Button>
        <Button
          data-testid="bookmark-btn"
          variant={isBookmarked ? 'default' : 'outline'}
          onClick={handleBookmark}
          className={isBookmarked ? 'bg-primary text-black' : 'border-primary text-primary'}
        >
          <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-black' : ''}`} />
          {isBookmarked ? 'SAVED' : 'SAVE'}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Video Player */}
        {embedUrl && (
          <div className="aspect-video bg-black rounded-sm overflow-hidden mb-6">
            <iframe
              src={embedUrl}
              title={masterclass.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Title & Meta */}
        <div className="bg-card border border-border/50 p-6 rounded-sm mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`text-xs px-2 py-1 rounded-sm border ${getDifficultyColor(masterclass.difficulty)}`}>
              {masterclass.difficulty?.toUpperCase()}
            </span>
            {masterclass.subcategory && (
              <span className="text-xs px-2 py-1 rounded-sm bg-primary/10 text-primary border border-primary/20">
                {masterclass.subcategory}
              </span>
            )}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-4">
            {masterclass.title}
          </h1>
          
          <p className="text-muted-foreground mb-6">{masterclass.description}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {masterclass.author_image ? (
                <img src={masterclass.author_image} alt={masterclass.author_name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div>
                <p className="text-foreground font-medium">{masterclass.author_name}</p>
                {masterclass.author_credentials && (
                  <p className="text-xs">{masterclass.author_credentials}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{masterclass.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{masterclass.views || 0} views</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{masterclass.comments_count || 0} comments</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {masterclass.content && (
          <div className="bg-card border border-border/50 p-6 rounded-sm mb-6">
            <h2 className="font-heading font-bold uppercase mb-4">LESSON CONTENT</h2>
            <div className="prose prose-invert prose-headings:text-foreground prose-headings:font-heading prose-headings:uppercase prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground max-w-none">
              <ReactMarkdown>{masterclass.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Tags */}
        {masterclass.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {masterclass.tags.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-sm bg-muted text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <h2 className="font-heading font-bold uppercase mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            COMMENTS & Q&A ({comments.length})
          </h2>

          {/* Add Comment */}
          <div className="mb-6">
            <Textarea
              data-testid="comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a question or share your thoughts..."
              className="bg-black/20 border-white/10 min-h-[80px] mb-3"
            />
            <Button
              data-testid="submit-comment-btn"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submittingComment}
              className="bg-primary text-black font-bold"
            >
              <Send className="w-4 h-4 mr-2" />
              {submittingComment ? 'POSTING...' : 'POST COMMENT'}
            </Button>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No comments yet. Be the first to ask a question!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  data-testid={`comment-${comment.id}`}
                  className="p-4 bg-background rounded-sm border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{comment.user_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterclassDetail;
