import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FolderOpen, Plus, Users, Trash2, ChevronRight } from 'lucide-react';

const DEFAULT_TEAMS = [
  { name: 'Senior Team', description: 'Main national team' },
  { name: 'U23', description: 'Under-23 Olympic team' },
  { name: 'U20', description: 'Under-20 youth team' },
  { name: 'U17', description: 'Under-17 youth team' },
  { name: 'U15', description: 'Under-15 youth team' }
];

const FederationTeams = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamPlayers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const response = await api.getFederationTeams();
      setTeams(response.data);
      if (response.data.length > 0) {
        setSelectedTeam(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamPlayers = async (teamId) => {
    try {
      const response = await api.getFederationTeamPlayers(teamId);
      setTeamPlayers(response.data);
    } catch (error) {
      toast.error('Failed to load team players');
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    try {
      await api.createFederationTeam({ name: newTeamName, description: newTeamDescription });
      toast.success('Team created!');
      setShowCreateDialog(false);
      setNewTeamName('');
      setNewTeamDescription('');
      loadTeams();
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const handleCreateDefaultTeams = async () => {
    try {
      for (const team of DEFAULT_TEAMS) {
        await api.createFederationTeam(team);
      }
      toast.success('Default teams created!');
      loadTeams();
    } catch (error) {
      toast.error('Failed to create default teams');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;

    try {
      await api.deleteFederationTeam(teamId);
      toast.success('Team deleted');
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setTeamPlayers([]);
      }
      loadTeams();
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const handleRemovePlayer = async (playerId) => {
    try {
      await api.removePlayerFromFederationTeam(selectedTeam.id, playerId);
      toast.success('Player removed from team');
      loadTeamPlayers(selectedTeam.id);
    } catch (error) {
      toast.error('Failed to remove player');
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">TEAM GROUPS</h1>
          <p className="text-muted-foreground">Manage your national team squads</p>
        </div>
        <div className="flex gap-2">
          {teams.length === 0 && (
            <Button
              data-testid="create-default-teams-btn"
              variant="outline"
              onClick={handleCreateDefaultTeams}
            >
              Create Default Teams
            </Button>
          )}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-team-btn" className="bg-primary text-black">
                <Plus className="w-4 h-4 mr-2" />
                NEW TEAM
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Team Name</label>
                  <Input
                    data-testid="new-team-name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., U21, Women's Team"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    data-testid="new-team-description"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Optional description"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleCreateTeam} className="w-full bg-primary text-black">
                  CREATE TEAM
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No teams created yet</p>
          <p className="text-sm text-muted-foreground mt-2">Create your first team to start organizing players</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Team List */}
          <div className="bg-card border border-border/50 rounded-sm p-4">
            <h3 className="font-heading font-bold uppercase text-sm text-muted-foreground mb-4">TEAMS</h3>
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  data-testid={`team-${team.id}`}
                  onClick={() => setSelectedTeam(team)}
                  className={`p-3 rounded-sm cursor-pointer flex items-center justify-between transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span className="font-medium">{team.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          {/* Team Details */}
          <div className="lg:col-span-3">
            {selectedTeam ? (
              <div className="bg-card border border-border/50 rounded-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-heading font-bold uppercase">{selectedTeam.name}</h2>
                    {selectedTeam.description && (
                      <p className="text-sm text-muted-foreground">{selectedTeam.description}</p>
                    )}
                  </div>
                  <Button
                    data-testid="delete-team-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTeam(selectedTeam.id)}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    DELETE
                  </Button>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    PLAYERS ({teamPlayers.length})
                  </h3>
                </div>

                {teamPlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No players in this team</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add players from the player detail view
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamPlayers.map((player) => (
                      <div
                        key={player.user_id}
                        className="flex items-center justify-between p-3 bg-background rounded-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {player.position || 'Position not set'} â€¢ {player.age ? `${player.age} yrs` : 'Age not set'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer(player.user_id)}
                          className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border/50 rounded-sm p-12 text-center">
                <p className="text-muted-foreground">Select a team to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FederationTeams;


