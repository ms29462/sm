import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Video } from 'lucide-react';

const VideoList = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await api.getMyVideos();
      setVideos(response.data);
    } catch (error) {
      toast.error('Failed to load video sessions');
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">MY VIDEO SESSIONS</h1>
        <p className="text-muted-foreground">Your video interview sessions</p>
      </div>

      {videos.length === 0 ? (
        <div data-testid="no-videos" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No video sessions available yet</p>
          <p className="text-sm text-muted-foreground mt-2">Admin will create video sessions for you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              data-testid={`video-${video.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-bold uppercase mb-2">
                    {video.other_party}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Created: {new Date(video.created_at).toLocaleString()}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 text-xs uppercase tracking-wider rounded-sm ${
                      video.is_active
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {video.is_active ? 'ACTIVE' : 'ENDED'}
                  </span>
                </div>
                {video.is_active && (
                  <Button
                    data-testid={`join-btn-${video.id}`}
                    onClick={() => navigate(`/video/${video.id}`)}
                    className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10 px-6"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    JOIN CALL
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;