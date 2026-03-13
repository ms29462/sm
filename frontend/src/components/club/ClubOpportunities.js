import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { POSITIONS } from '@/lib/constants';

const LEAGUES = [
  "CPL",
  "USL Championship",
  "USL League One",
  "Challenger Pro League",
  "MLS",
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "League One",
  "League Two",
  "National League",
  "Semi-Professional",
  "Amateur"
];

const ClubOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    league_level: '',
    salary_range: '',
    contract_duration: '',
    description: '',
  });

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const response = await api.getClubOpportunities();
      setOpportunities(response.data);
    } catch (error) {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!formData.position || !formData.league_level || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.createOpportunity(formData);
      toast.success('Opportunity created!');
      setShowDialog(false);
      setFormData({
        position: '',
        league_level: '',
        salary_range: '',
        contract_duration: '',
        description: '',
      });
      loadOpportunities();
    } catch (error) {
      toast.error('Failed to create opportunity');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      await api.deleteOpportunity(id);
      toast.success('Opportunity deleted');
      loadOpportunities();
    } catch (error) {
      toast.error('Failed to delete opportunity');
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">OPPORTUNITIES</h1>
          <p className="text-muted-foreground">Manage your posted opportunities</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              data-testid="create-opportunity-btn"
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              POST OPPORTUNITY
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border/50 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading font-bold uppercase">POST NEW OPPORTUNITY</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="position" className="text-sm font-medium uppercase tracking-wide">
                  Position *
                </Label>
                <Select value={formData.position} onValueChange={(value) => handleChange('position', value)}>
                  <SelectTrigger
                    id="position"
                    data-testid="position-select"
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                  >
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="league_level" className="text-sm font-medium uppercase tracking-wide">
                  League Level *
                </Label>
                <Select value={formData.league_level} onValueChange={(value) => handleChange('league_level', value)}>
                  <SelectTrigger
                    id="league_level"
                    data-testid="league-level-select"
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                  >
                    <SelectValue placeholder="Select league level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAGUES.map((league) => (
                      <SelectItem key={league} value={league}>
                        {league}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Used for AI-powered player matching
                </p>
              </div>
              <div>
                <Label htmlFor="salary_range" className="text-sm font-medium uppercase tracking-wide">
                  Salary Range
                </Label>
                <Input
                  id="salary_range"
                  data-testid="salary-range-input"
                  value={formData.salary_range}
                  onChange={(e) => handleChange('salary_range', e.target.value)}
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                  placeholder="e.g., $50k - $100k"
                />
              </div>
              <div>
                <Label htmlFor="contract_duration" className="text-sm font-medium uppercase tracking-wide">
                  Contract Duration
                </Label>
                <Input
                  id="contract_duration"
                  data-testid="contract-duration-input"
                  value={formData.contract_duration}
                  onChange={(e) => handleChange('contract_duration', e.target.value)}
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                  placeholder="e.g., 2 years"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium uppercase tracking-wide">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  data-testid="description-input"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm min-h-[120px]"
                  placeholder="Describe the opportunity..."
                />
              </div>
              <Button
                data-testid="submit-opportunity-btn"
                onClick={handleCreate}
                className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
              >
                POST OPPORTUNITY
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {opportunities.length === 0 ? (
        <div data-testid="no-opportunities" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No opportunities posted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              data-testid={`opportunity-card-${opp.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-heading font-bold uppercase">{opp.position}</h3>
                    <span className="bg-white/10 text-white border border-white/20 uppercase text-[10px] tracking-wider px-2 py-1">
                      {opp.league_level}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{opp.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {opp.salary_range && (
                      <div>
                        <span className="text-muted-foreground">Salary: </span>
                        <span className="font-medium font-mono">{opp.salary_range}</span>
                      </div>
                    )}
                    {opp.contract_duration && (
                      <div>
                        <span className="text-muted-foreground">Duration: </span>
                        <span className="font-medium">{opp.contract_duration}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  data-testid={`delete-btn-${opp.id}`}
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(opp.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubOpportunities;