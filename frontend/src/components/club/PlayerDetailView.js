import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, User, CheckCircle, Heart, ExternalLink, Download, Video, Play, Target } from 'lucide-react';
import RequestChatDialog from './RequestChatDialog';

const PlayerDetailView = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchArchive, setMatchArchive] = useState([]);
  const [isTracked, setIsTracked] = useState(false);

  useEffect(() => {
    loadPlayerProfile();
  }, [playerId]);

  const loadPlayerProfile = async () => {
    try {
      const [playerRes, archiveRes] = await Promise.all([
        api.getPlayerDetail(playerId),
        api.getPlayerMatchArchivePublic(playerId).catch(() => ({ data: [] }))
      ]);
      setPlayer(playerRes.data);
      setMatchArchive(archiveRes.data || []);
    } catch (error) {
      toast.error('Failed to load player profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPlayer = async () => {
    try {
      if (isTracked) {
        await api.untrackPlayer(playerId);
        setIsTracked(false);
        toast.success('Removed from watchlist');
      } else {
        await api.trackPlayer(playerId);
        setIsTracked(true);
        toast.success('Added to watchlist!');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update watchlist');
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

  const handleDownloadCV = () => {
    if (player?.cv) window.open(player.cv, '_blank');
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
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Player not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const nationalities = [player.nationality_1, player.nationality_2, player.nationality_3]
    .filter(Boolean).join(', ') || player.nationality || 'N/A';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {player.profile_picture ? (
                <img src={player.profile_picture} alt={player.name} className="w-20 h-20 rounded-sm object-cover border-2 border-primary" />
              ) : (
                <div className="w-20 h-20 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-heading font-bold uppercase">{player.name}</h1>
                <p className="text-muted-foreground">{player.position} · {player.playing_level}</p>
                <div className="flex items-center gap-2 mt-1">
                  {player.verified && (
                    <span className="inline-flex items-center px-3 py-1 text-xs uppercase tracking-wider rounded-sm bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </span>
                  )}
                  {player.approved && (
                    <span className="bg-primary/10 text-primary border border-primary/20 uppercase text-sm tracking-wider px-4 py-2 rounded-sm font-bold">
                      Approved
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleTrackPlayer}
              variant="outline"
              className={`rounded-sm h-12 px-6 font-bold uppercase tracking-wide ${isTracked ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black" : "border-white/20 text-white hover:bg-white/10"}`}
            >
              <Target className="w-4 h-4 mr-2" />
              {isTracked ? "Tracked ✓" : "Track Player"}
            </Button>
            <Button
              data-testid="add-favorite-btn"
              onClick={handleAddFavorite}
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
            >
              <Heart className="w-4 h-4 mr-2" />
              ADD TO FAVORITES
            </Button>
            <RequestChatDialog playerId={player.user_id} playerName={player.name} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
        <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">Player Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Age", value: player.age ? `${player.age} years` : "N/A" },
            { label: "Nationality", value: nationalities },
            { label: "Height", value: player.height ? `${player.height} cm` : "N/A" },
            { label: "Weight", value: player.weight ? `${player.weight} kg` : "N/A" },
            { label: "Preferred Foot", value: player.preferred_foot || "N/A" },
            { label: "Current Club", value: player.current_club || "Free Agent" },
            { label: "Games", value: player.games || 0 },
            { label: "Goals", value: player.goals || 0 },
            { label: "Assists", value: player.assists || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background border border-border/50 rounded-sm p-3">
              <p className="text-xs text-muted-foreground uppercase mb-1">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Media */}
      {(player.highlight_video || player.cv || player.transfermarkt_url) && (
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">Media & Links</h3>
          <div className="space-y-4">
            {player.highlight_video && (
              <div className="flex items-center justify-between p-4 bg-background rounded-sm border border-border">
                <div>
                  <p className="font-medium mb-1">Highlight Video</p>
                  <p className="text-sm text-muted-foreground">YouTube / Vimeo</p>
                </div>
                <Button variant="outline" onClick={() => window.open(player.highlight_video, '_blank')}
                  className="border-primary text-primary hover:bg-primary hover:text-black">
                  <ExternalLink className="w-4 h-4 mr-2" /> WATCH VIDEO
                </Button>
              </div>
            )}
            {player.cv && (
              <div className="flex items-center justify-between p-4 bg-background rounded-sm border border-border">
                <div>
                  <p className="font-medium mb-1">CV / Resume</p>
                  <p className="text-sm text-muted-foreground">Player curriculum vitae</p>
                </div>
                <Button variant="outline" onClick={handleDownloadCV}
                  className="border-white/20 text-white hover:bg-white/10">
                  <Download className="w-4 h-4 mr-2" /> DOWNLOAD CV
                </Button>
              </div>
            )}
            {player.transfermarkt_url && (
              <div className="flex items-center justify-between p-4 bg-background rounded-sm border border-border">
                <div>
                  <p className="font-medium mb-1">Transfermarkt Profile</p>
                  <p className="text-sm text-muted-foreground">Professional stats and market value</p>
                </div>
                <Button variant="outline" onClick={() => window.open(player.transfermarkt_url, '_blank')}
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                  <ExternalLink className="w-4 h-4 mr-2" /> VIEW PROFILE
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Video Archive */}
      {matchArchive.length > 0 && (
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">
            Match Video Archive
          </h3>
          <div className="space-y-3">
            {matchArchive.map((match) => (
              <div key={match.id} className="flex items-center justify-between p-4 bg-background rounded-sm border border-border hover:border-primary/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{match.opponent}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>{match.match_date}</span>
                    {match.competition_level && <span className="bg-white/10 px-2 py-0.5 rounded-sm text-xs uppercase">{match.competition_level}</span>}
                    {match.position_played && <span>· {match.position_played}</span>}
                  </div>
                  {match.description && <p className="text-xs text-muted-foreground mt-1">{match.description}</p>}
                </div>
                {match.video_link && (
                  <a href={match.video_link} target="_blank" rel="noopener noreferrer"
                    className="ml-4 px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-black rounded-sm text-sm font-medium transition-colors">
                    Watch
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDetailView;