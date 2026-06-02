import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AnalystEvaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, evaluation: null });

  useEffect(() => {
    fetchEvaluations();
  }, []);

  useEffect(() => {
    const filtered = evaluations.filter(e => 
      e.player_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.match_description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvaluations(filtered);
  }, [searchQuery, evaluations]);

  const fetchEvaluations = async () => {
    try {
      const response = await api.getAnalystEvaluations();
      setEvaluations(response.data);
      setFilteredEvaluations(response.data);
    } catch (error) {
      toast.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.evaluation) return;
    
    try {
      await api.deleteEvaluation(deleteDialog.evaluation.id);
      toast.success('Evaluation deleted');
      fetchEvaluations();
    } catch (error) {
      toast.error('Failed to delete evaluation');
    } finally {
      setDeleteDialog({ open: false, evaluation: null });
    }
  };

  const getRecommendationLabel = (rec) => {
    const labels = {
      'strongly_recommend': { text: 'Strongly Recommend', color: 'text-emerald-400 bg-emerald-400/10' },
      'recommend': { text: 'Recommend', color: 'text-green-400 bg-green-400/10' },
      'monitor': { text: 'Monitor', color: 'text-amber-400 bg-amber-400/10' },
      'further_evaluation': { text: 'Further Evaluation', color: 'text-orange-400 bg-orange-400/10' },
      'not_recommended': { text: 'Not Recommended', color: 'text-red-400 bg-red-400/10' }
    };
    return labels[rec] || { text: rec, color: 'text-gray-400 bg-gray-400/10' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-heading font-bold">My Evaluations</h1>
          <p className="text-sm text-muted-foreground">{evaluations.length} total evaluations</p>
        </div>
        <Link to="/analyst/players" className="w-full sm:w-auto">
          <Button className="bg-primary text-black hover:bg-primary/90 w-full sm:w-auto">
            New Evaluation
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by player or match..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-800/50 border-zinc-700"
        />
      </div>

      {/* Evaluations List */}
      <Card>
        <CardContent className="p-0">
          {filteredEvaluations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No evaluations found</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredEvaluations.map((evaluation) => {
                const rec = getRecommendationLabel(evaluation.recommendation);
                return (
                  <div
                    key={evaluation.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 lg:p-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <Link
                      to={`/analyst/evaluation/${evaluation.id}`}
                      className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm lg:text-base">{evaluation.player_name}</p>
                        <p className="text-xs lg:text-sm text-muted-foreground truncate">
                          {evaluation.match_description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(evaluation.match_date).toLocaleDateString('en-US')} • {evaluation.minutes_played} min
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 lg:gap-6">
                        <div className="hidden lg:flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-400">{evaluation.technical_score}</p>
                            <p className="text-xs text-muted-foreground">Tech</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-400">{evaluation.tactical_score}</p>
                            <p className="text-xs text-muted-foreground">Tact</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-orange-400">{evaluation.physical_score}</p>
                            <p className="text-xs text-muted-foreground">Phys</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-purple-400">{evaluation.mental_score}</p>
                            <p className="text-xs text-muted-foreground">Ment</p>
                          </div>
                        </div>

                        {/* Mobile scores */}
                        <div className="flex lg:hidden items-center gap-2 text-xs">
                          <span className="text-emerald-400">{evaluation.technical_score}</span>
                          <span className="text-blue-400">{evaluation.tactical_score}</span>
                          <span className="text-orange-400">{evaluation.physical_score}</span>
                          <span className="text-purple-400">{evaluation.mental_score}</span>
                        </div>

                        <span className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${rec.color}`}>
                          {rec.text}
                        </span>
                        
                        <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                      </div>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-400 self-end sm:self-auto"
                      onClick={() => setDeleteDialog({ open: true, evaluation })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The evaluation for {deleteDialog.evaluation?.player_name} will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnalystEvaluations;
