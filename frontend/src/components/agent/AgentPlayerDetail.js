import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import RequestChatDialog from '@/components/club/RequestChatDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { 
  ArrowLeft, User, MapPin, Calendar, Trophy, Target, 
  Heart, ExternalLink, Video, FileText
} from 'lucide-react';

const AgentPlayerDetail = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadPlayer();
    checkFavorite();
  }, [playerId]);

  const loadPlayer = async () => {
    try {
      const response = await api.getAgentPlayerDetail(playerId);
      setPlayer(response.data);
    } catch (error) {
      toast.error('Failed to load player');
      navigate('/agent/players');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await api.getAgentFavorites();
      setIsFavorite(response.data.some(p => p.user_id === playerId));
    } catch (error) {
      // Ignore
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await api.removeAgentFavorite(playerId);
        setIsFavorite(false);
        toast.success('Removed from watchlist');
      } else {
        await api.addAgentFavorite(playerId);
        setIsFavorite(true);
        toast.success('Added to watchlist');
      }
    } catch (error) {
      toast.error('Failed to update watchlist');
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
    return null;
  }

  return (
    <div className="p-8" data-testid="agent-player-detail">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to players
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-start gap-6">
              {player.profile_picture ? (
                <img 
                  src={player.profile_picture} 
                  alt={player.name} 
                  className="w-32 h-32 rounded-sm object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-sm bg-primary/10 flex items-center justify-center">
                  <User className="w-16 h-16 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-heading font-bold uppercase">{player.name}</h1>
                    <p className="text-xl text-primary">{player.position || 'Position N/A'}</p>
                  </div>
                  <button
                    onClick={toggleFavorite}
                    className="p-3 hover:bg-white/5 rounded-sm"
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {player.nationality && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {player.nationality}
                    </span>
                  )}
                  {player.age && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {player.age} years old
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <h2 className="font-heading font-bold uppercase mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              CAREER STATS
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-black/20 rounded-sm">
                <p className="text-2xl font-heading font-bold text-primary">{player.games || 0}</p>
                <p className="text-xs text-muted-foreground uppercase">Games</p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-sm">
                <p className="text-2xl font-heading font-bold text-green-500">{player.goals || 0}</p>
                <p className="text-xs text-muted-foreground uppercase">Goals</p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-sm">
                <p className="text-2xl font-heading font-bold text-blue-500">{player.assists || 0}</p>
                <p className="text-xs text-muted-foreground uppercase">Assists</p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-sm">
                <p className="text-2xl font-heading font-bold">{player.height || '-'}</p>
                <p className="text-xs text-muted-foreground uppercase">Height</p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-sm">
                <p className="text-2xl font-heading font-bold">{player.weight || '-'}</p>
                <p className="text-xs text-muted-foreground uppercase">Weight</p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-sm">
                <p className="text-2xl font-heading font-bold">{player.preferred_foot || '-'}</p>
                <p className="text-xs text-muted-foreground uppercase">Foot</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {player.bio && (
            <div className="bg-card border border-border/50 p-6 rounded-sm">
              <h2 className="font-heading font-bold uppercase mb-4">ABOUT</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{player.bio}</p>
            </div>
          )}

          {/* Video Highlights */}
          {player.video_url && (
            <div className="bg-card border border-border/50 p-6 rounded-sm">
              <h2 className="font-heading font-bold uppercase mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                HIGHLIGHT VIDEO
              </h2>
              <a 
                href={player.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Watch Highlights
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <h2 className="font-heading font-bold uppercase mb-4">PLAYER INFO</h2>
            <div className="space-y-3 text-sm">
              {player.current_club && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Club</span>
                  <span>{player.current_club}</span>
                </div>
              )}
              {player.playing_level && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <span>{player.playing_level}</span>
                </div>
              )}
              {player.contract_status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract</span>
                  <span>{player.contract_status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
            <h2 className="font-heading font-bold uppercase">ACTIONS</h2>
            
            <RequestChatDialog 
  playerId={playerId}
  playerName={player.name}
  requesterType="agent"
/>

            <Button
              onClick={toggleFavorite}
              variant="outline"
              className="w-full border-primary text-primary"
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'REMOVE FROM WATCHLIST' : 'ADD TO WATCHLIST'}
            </Button>

            {player.cv_url && (
              <a href={player.cv_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full border-white/20">
                  <FileText className="w-4 h-4 mr-2" />
                  VIEW CV
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPlayerDetail;

