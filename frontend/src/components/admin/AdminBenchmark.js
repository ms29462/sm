import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const AdminBenchmark = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await api.getBenchmarkStatus();
      setStatus(response.data);
    } catch (error) {
      toast.error('Failed to load benchmark status');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm('This will scrape data from Transfermarkt and may take several minutes. Continue?')) {
      return;
    }
    
    setGenerating(true);
    toast.info('Generating benchmark data... This may take 5-10 minutes.');
    
    try {
      const response = await api.generateBenchmark();
      toast.success(`Benchmark generated! ${response.data.player_count} players indexed.`);
      loadStatus();
    } catch (error) {
      toast.error('Failed to generate benchmark: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setGenerating(false);
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">BENCHMARK DATA</h1>
        <p className="text-muted-foreground">Manage AI matching benchmark data from Transfermarkt</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-start space-x-4 mb-6">
            <Database className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <h3 className="text-xl font-heading font-bold uppercase mb-2">BENCHMARK STATUS</h3>
              {status?.exists ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    <span>Benchmark data available</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Generated: {new Date(status.generated_at).toLocaleString()}</p>
                    <p>Players indexed: {status.player_count}</p>
                    <p>Leagues: {status.leagues?.join(', ')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>No benchmark data. Please generate it.</span>
                </div>
              )}
            </div>
          </div>

          <Button
            data-testid="generate-benchmark-btn"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'GENERATING... (5-10 MIN)' : status?.exists ? 'REGENERATE BENCHMARK' : 'GENERATE BENCHMARK'}
          </Button>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <h4 className="font-heading font-bold uppercase mb-3">ABOUT BENCHMARK DATA</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Benchmark data is used to calculate player-opportunity match scores based on:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>League-specific player statistics</li>
              <li>Position-based performance metrics</li>
              <li>Market value comparisons</li>
              <li>Age and experience profiles</li>
            </ul>
            <p className="mt-3">
              <strong>Note:</strong> Data is scraped from Transfermarkt for the following leagues: 
              CPL, USL Championship, USL League One, Challenger Pro League.
            </p>
            <p>
              Regenerate periodically to keep match scores accurate with current player data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBenchmark;
