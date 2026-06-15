import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Database, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const AdminBenchmark = () => {
  const [status, setStatus] = useState(null);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    // Poll for generation status while running
    let interval;
    if (generating || generationStatus?.running) {
      interval = setInterval(async () => {
        try {
          const genResponse = await api.getBenchmarkGenerationStatus();
          setGenerationStatus(genResponse.data);
          
          if (!genResponse.data.running) {
            // Generation completed, refresh status
            setGenerating(false);
            loadStatus();
            if (genResponse.data.error) {
              toast.error('Benchmark generation failed: ' + genResponse.data.error);
            } else {
              toast.success('Benchmark generation completed!');
            }
          }
        } catch (error) {
          console.error('Failed to check generation status');
        }
      }, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [generating, generationStatus?.running]);

  const loadStatus = async () => {
    try {
      const [statusResponse, genStatusResponse] = await Promise.all([
        api.getBenchmarkStatus(),
        api.getBenchmarkGenerationStatus()
      ]);
      setStatus(statusResponse.data);
      setGenerationStatus(genStatusResponse.data);
      if (genStatusResponse.data.running) {
        setGenerating(true);
      }
    } catch (error) {
      toast.error('Failed to load benchmark status');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm('This will scrape data from Transfermarkt in the background. The process takes 5-10 minutes. Continue?')) {
      return;
    }
    
    setGenerating(true);
    
    try {
      const response = await api.generateBenchmark();
      toast.info(response.data.message);
    } catch (error) {
      toast.error('Failed to start benchmark generation: ' + (error.response?.data?.detail || 'Unknown error'));
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

  const isGenerating = generating || generationStatus?.running;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">BENCHMARK DATA</h1>
        <p className="text-muted-foreground">Manage AI matching benchmark data from Transfermarkt</p>
      </div>

      <div className="max-w-2xl">
        {/* Generation Status Alert */}
        {isGenerating && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-sm mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <div>
                <p className="text-blue-500 font-medium">Benchmark generation in progress...</p>
                <p className="text-sm text-muted-foreground">
                  Started at: {generationStatus?.started_at ? new Date(generationStatus.started_at).toLocaleString() : 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This process takes 5-10 minutes. You can leave this page and come back.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {generationStatus?.error && !isGenerating && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-500 font-medium">Last generation failed</p>
                <p className="text-sm text-muted-foreground">{generationStatus.error}</p>
              </div>
            </div>
          </div>
        )}

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
            disabled={isGenerating}
            className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                GENERATING... (5-10 MIN)
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {status?.exists ? 'REGENERATE BENCHMARK' : 'GENERATE BENCHMARK'}
              </>
            )}
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
