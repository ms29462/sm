import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, User, CheckCircle, Heart, ExternalLink, Download, FolderPlus, Video, Calendar } from 'lucide-react';

const FederationPlayerDetailView = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [matchArchive, setMatchArchive] = useState([]);
  const [matchCalendar, setMatchCalendar] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddToTeamDialog, setShowAddToTeamDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [playerId]);

  const loadData = async () => {
    try {
      const [playerRes, teamsRes] = await Promise.all([
        api.getPlayerDetail(playerId),
        api.getFederationTeams()
      ]);
      setPlayer(playerRes.data);
      setTeams(teamsRes.data);

      // Load match archive and calendar
      try {
        const [archiveRes, calendarRes] = await Promise.all([
          api.getPlayerMatchArchivePublic(playerId),
          api.getPlayerMatchCalendarPublic(playerId)
        ]);
        setMatchArchive(archiveRes.data || []);
        setMatchCalendar(calendarRes.data || []);
      } catch (e) {
        // Match archive/calendar might not be available
        console.log('Match archive/calendar not available');
      }
    } catch (error) {
      toast.error('Failed to load player profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToScouting = async () => {
    try {
      await api.addFederationFavorite(playerId);
      toast.success('Added to scouting list!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to scouting list');
    }
  };

  const handleAddToTeam = async () => {
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }

    try {
      await api.addPlayerToFederationTeam(selectedTeam, playerId, '');
      toast.success('Player added to team!');
      setShowAddToTeamDialog(false);
      setSelectedTeam('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add player to team');
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

  // Get all nationalities
  const nationalities = [
    player.nationality,
    player.nationality_1,
    player.nationality_2,
    player.nationality_3
  ].filter(Boolean);

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
          <p className="text-muted-foreground">Complete scouting information</p>
        </div>
      </div>

      <div className="max-w-5xl">
        {/* Header Card */}
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
              <div className="flex flex-wrap gap-3 mt-4">
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
            <div className="flex flex-col gap-3">
              <Button
                data-testid="add-to-scouting-btn"
                onClick={handleAddToScouting}
                className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
              >
                <Heart className="w-4 h-4 mr-2" />
                ADD TO SCOUTING
              </Button>
              <Dialog open={showAddToTeamDialog} onOpenChange={setShowAddToTeamDialog}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-to-team-btn"
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white h-12 px-6"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    ADD TO TEAM
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Player to Team</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Team</label>
                      <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                        <SelectTrigger data-testid="team-select">
                          <SelectValue placeholder="Choose a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.length === 0 ? (
                            <SelectItem value="none" disabled>No teams created yet</SelectItem>
                          ) : (
                            teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      data-testid="confirm-add-to-team-btn"
                      onClick={handleAddToTeam}
                      disabled={!selectedTeam || teams.length === 0}
                      className="w-full bg-primary text-black font-bold"
                    >
                      ADD TO TEAM
                    </Button>
                    {teams.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Create teams first in the Team Groups section
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Nationalities Section */}
        {nationalities.length > 0 && (
          <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
            <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">
              NATIONALITIES
            </h3>
            <div className="flex flex-wrap gap-3">
              {nationalities.map((nat, idx) => (
                <span
                  key={idx}
                  className="bg-primary/10 text-primary border border-primary/20 uppercase text-sm tracking-wider px-4 py-2 rounded-sm"
                >
                  {nat}
                </span>
              ))}
            </div>
          </div>
        )}

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

        {/* Match Archive */}
        {matchArchive.length > 0 && (
          <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
            <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border flex items-center">
              <Video className="w-5 h-5 mr-2 text-primary" />
              MATCH ARCHIVE
            </h3>
            <div className="space-y-3">
              {matchArchive.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 bg-background rounded-sm border border-border"
                >
                  <div>
                    <p className="font-medium">vs {match.opponent}</p>
                    <p className="text-sm text-muted-foreground">
                      {match.match_date} • {match.competition_level}
                      {match.position_played && ` • Played as ${match.position_played}`}
                    </p>
                    {match.description && (
                      <p className="text-sm text-muted-foreground mt-1">{match.description}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(match.video_link, '_blank')}
                    className="border-primary text-primary hover:bg-primary hover:text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    WATCH
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Matches */}
        {matchCalendar.length > 0 && (
          <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
            <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              UPCOMING MATCHES
            </h3>
            <div className="space-y-3">
              {matchCalendar.map((match) => (
                <div
                  key={match.id}
                  className="p-4 bg-background rounded-sm border border-border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">vs {match.opponent}</p>
                      <p className="text-sm text-muted-foreground">
                        {match.match_date}
                        {match.match_time && ` at ${match.match_time}`}
                      </p>
                      {match.competition && (
                        <p className="text-xs text-primary mt-1">{match.competition}</p>
                      )}
                    </div>
                    {(match.stadium || match.location) && (
                      <div className="text-right text-sm text-muted-foreground">
                        {match.stadium && <p>{match.stadium}</p>}
                        {match.location && <p>{match.location}</p>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media & Documents */}
        {(player.highlight_video || player.cv || player.transfermarkt_url) && (
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
              {player.transfermarkt_url && (
                <div className="flex items-center justify-between p-4 bg-background rounded-sm border border-border">
                  <div>
                    <p className="font-medium mb-1">Transfermarkt Profile</p>
                    <p className="text-sm text-muted-foreground">Professional stats and market value</p>
                  </div>
                  <Button
                    data-testid="view-transfermarkt-btn"
                    variant="outline"
                    onClick={() => window.open(player.transfermarkt_url, '_blank')}
                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    VIEW PROFILE
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

export default FederationPlayerDetailView;
