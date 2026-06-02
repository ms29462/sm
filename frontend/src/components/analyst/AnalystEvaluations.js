import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, Trash2, RotateCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      toast.error('Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.evaluation) return;
    
    try {
      await api.deleteEvaluation(deleteDialog.evaluation.id);
      toast.success('Évaluation supprimée');
      fetchEvaluations();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialog({ open: false, evaluation: null });
    }
  };

  const getRecommendationLabel = (rec) => {
    const labels = {
      'strongly_recommend': { text: 'Fortement recommandé', color: 'text-emerald-400 bg-emerald-400/10' },
      'recommend': { text: 'Recommandé', color: 'text-green-400 bg-green-400/10' },
      'monitor': { text: 'À surveiller', color: 'text-amber-400 bg-amber-400/10' },
      'further_evaluation': { text: 'Évaluation supplémentaire', color: 'text-orange-400 bg-orange-400/10' },
      'not_recommended': { text: 'Non recommandé', color: 'text-red-400 bg-red-400/10' }
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Mes Évaluations</h1>
          <p className="text-muted-foreground">{evaluations.length} évaluations au total</p>
        </div>
        <Link to="/analyst/players">
          <Button className="bg-primary text-black hover:bg-primary/90">
            Nouvelle Évaluation
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un joueur ou un match..."
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
              <p>Aucune évaluation trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredEvaluations.map((evaluation) => {
                const rec = getRecommendationLabel(evaluation.recommendation);
                return (
                  <div
                    key={evaluation.id}
                    className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <Link
                      to={`/analyst/evaluation/${evaluation.id}`}
                      className="flex-1 flex items-center gap-4 min-w-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{evaluation.player_name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {evaluation.match_description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(evaluation.match_date).toLocaleDateString('fr-FR')} • {evaluation.minutes_played} min
                        </p>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-6">
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

                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${rec.color}`}>
                        {rec.text}
                      </span>
                      
                      <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-400"
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
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette évaluation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'évaluation de {deleteDialog.evaluation?.player_name} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnalystEvaluations;
