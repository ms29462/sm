import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, User, CheckCircle, Heart, ExternalLink, Download } from 'lucide-react';

const PlayerDetailView = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerProfile();
  }, [playerId]);

  const loadPlayerProfile = async () => {
    try {
      const response = await api.getPlayerDetail(playerId);
      setPlayer(response.data);
    } catch (error) {
      toast.error('Failed to load player profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async () => {
    try {
      await api.addFavorite(playerId);
      toast.success('Added to favorites!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to favorites');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Player not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center space-x-4">
        <Button
          data-testid="back-btn"
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">PLAYER PROFILE</h1>
          <p className="text-muted-foreground">Complete athletic information</p>
        </div>
      </div>

      <div className="max-w-5xl">
        {/* Header Card with Profile Picture and Basic Info */}
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-start space-x-8 mb-6">
            {player.profile_picture ? (
              <img
                src={player.profile_picture}
                alt={player.name}
                className="w-32 h-32 rounded-sm object-cover border-4 border-primary"
              />
            ) : (
              <div className="w-32 h-32 rounded-sm bg-muted flex items-center justify-center border-4 border-border">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-heading font-bold uppercase">{player.name}</h2>
                {player.verified && (
                  <span
                    data-testid="verified-badge"
                    className="inline-flex items-center px-3 py-1 text-xs uppercase tracking-wider rounded-sm bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    VERIFIED
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{player.email}</p>
              <div className="flex flex-wrap gap-3">
                {player.position && (
                  <span className="bg-primary/10 text-primary border border-primary/20 uppercase text-sm tracking-wider px-4 py-2 rounded-sm font-bold">
                    {player.position}
                  </span>
                )}
                {player.playing_level && (
                  <span className="bg-white/5 text-white border border-white/20 uppercase text-sm tracking-wider px-4 py-2 rounded-sm">
                    {player.playing_level}
                  </span>
                )}
              </div>
            </div>
            <div>
              <Button
                data-testid="add-favorite-btn"
                onClick={handleAddFavorite}
                className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
              >
                <Heart className="w-4 h-4 mr-2" />
                ADD TO FAVORITES
              </Button>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">
            PERSONAL INFORMATION
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {player.age && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Age</p>
                <p className="text-lg font-medium">{player.age} years</p>
              </div>
            )}
            {player.nationality && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Nationality</p>
                <p className="text-lg font-medium">{player.nationality}</p>
              </div>
            )}
            {player.height && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Height</p>
                <p className="text-lg font-medium">{player.height} cm</p>
              </div>
            )}
            {player.weight && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Weight</p>
                <p className="text-lg font-medium">{player.weight} kg</p>
              </div>
            )}
            {player.preferred_foot && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Preferred Foot</p>
                <p className="text-lg font-medium">{player.preferred_foot}</p>
              </div>
            )}
            {player.current_club && (
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Current Club</p>
                <p className="text-lg font-medium">{player.current_club}</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">
            CAREER STATISTICS
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-6 bg-background rounded-sm border border-border">
              <p className="text-4xl font-heading font-bold text-primary mb-2">{player.games || 0}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Games Played</p>
            </div>
            <div className="text-center p-6 bg-background rounded-sm border border-border">
              <p className="text-4xl font-heading font-bold text-primary mb-2">{player.goals || 0}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Goals</p>
            </div>
            <div className="text-center p-6 bg-background rounded-sm border border-border">
              <p className="text-4xl font-heading font-bold text-primary mb-2">{player.assists || 0}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Assists</p>
            </div>
          </div>
        </div>

        {/* Media */}
        {(player.highlight_video || player.cv) && (
          <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
            <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">
              MEDIA & DOCUMENTS
            </h3>
            <div className="space-y-4">
              {player.highlight_video && (
                <div className="flex items-center justify-between p-4 bg-background rounded-sm border border-border">
                  <div>
                    <p className="font-medium mb-1">Highlight Video</p>
                    <p className="text-sm text-muted-foreground">YouTube / Vimeo</p>
                  </div>
                  <Button
                    data-testid="view-video-btn"
                    variant="outline"
                    onClick={() => window.open(player.highlight_video, '_blank')}
                    className="border-primary text-primary hover:bg-primary hover:text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    WATCH VIDEO
                  </Button>
                </div>
              )}
              {player.cv && (
                <div className="flex items-center justify-between p-4 bg-background rounded-sm border border-border">
                  <div>
                    <p className="font-medium mb-1">Player CV / Resume</p>
                    <p className="text-sm text-muted-foreground">Professional document</p>
                  </div>
                  <Button
                    data-testid="download-cv-btn"
                    variant="outline"
                    onClick={() => {
                      if (player.cv.startsWith('http')) {
                        window.open(player.cv, '_blank');
                      } else {
                        // Handle base64 download
                        const link = document.createElement('a');
                        link.href = player.cv;
                        link.download = `${player.name}_CV.pdf`;
                        link.click();
                      }
                    }}
                    className="border-primary text-primary hover:bg-primary hover:text-black"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    VIEW CV
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDetailView;
