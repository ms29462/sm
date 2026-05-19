import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CollegePlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async (filters = {}) => {
    try {
      const response = await api.getCollegePlayers(filters);
      setPlayers(response.data);
    } catch (error) {
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadPlayers({ name: search, position });
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">SEARCH PLAYERS</h1>
        <p className="text-muted-foreground">Find players for your college program</p>
      </div>

      <div className="flex gap-3 mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <Input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Position..."
          className="bg-black/20 border-white/10 focus:border-primary rounded-sm h-12 w-40"
        />
        <Button onClick={handleSearch} className="bg-primary text-black font-bold uppercase rounded-sm h-12 px-6">
          <Search className="w-4 h-4 mr-2" /> Search
        </Button>
      </div>

      {players.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <div key={player.user_id} onClick={() => navigate(`/college/player/${player.user_id}`)} className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-start space-x-4 mb-4">
                {player.profile_picture ? (
                  <img src={player.profile_picture} alt={player.name} className="w-14 h-14 rounded-sm object-cover border-2 border-primary" />
                ) : (
                  <div className="w-14 h-14 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                    <Users className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-heading font-bold uppercase">{player.name}</h3>
                  <p className="text-sm text-muted-foreground">{player.position} · {player.age ? player.age + " yrs" : ""}</p>
                  <p className="text-xs text-muted-foreground">{player.nationality}</p>
                </div>
              </div>
              <div className="flex justify-between text-xs font-mono text-muted-foreground border-t border-border pt-3">
                <span>G: {player.goals || 0}</span>
                <span>A: {player.assists || 0}</span>
                <span>GP: {player.games || 0}</span>
                <span>{player.playing_level || "N/A"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollegePlayers;
