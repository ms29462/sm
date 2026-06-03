import { useState, useEffect } from 'react';
import { Search, Check, X, Award, Shield, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const AdminAnalysts = () => {
  const [analysts, setAnalysts] = useState([]);
  const [filteredAnalysts, setFilteredAnalysts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysts();
  }, []);

  useEffect(() => {
    const filtered = analysts.filter(a =>
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.organization?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAnalysts(filtered);
  }, [searchQuery, analysts]);

  const fetchAnalysts = async () => {
    try {
      const response = await api.getAllAnalysts();
      setAnalysts(response.data);
      setFilteredAnalysts(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des analystes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approved) => {
    try {
      await api.approveAnalyst(userId, approved);
      toast.success(approved ? 'Analyst approuve' : 'Analyst rejete');
      fetchAnalysts();
    } catch (error) {
      toast.error('Erreur lors de l\'operation');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this analyst?")) return;
    try {
      await api.deleteAnalyst(userId);
      setAnalysts(prev => prev.filter(a => a.user_id !== userId));
      toast.success("Analyst deleted!");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleVerify = async (userId, verified) => {
    try {
      await api.verifyAnalyst(userId, verified);
      toast.success(verified ? 'Analyst verifie' : 'Verification removed');
      fetchAnalysts();
    } catch (error) {
      toast.error('Erreur lors de l\'operation');
    }
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
          <h1 className="text-2xl font-heading font-bold">Analyst Management</h1>
          <p className="text-muted-foreground">{analysts.length} analysts registered</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analysts.filter(a => !a.approved).length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analysts.filter(a => a.approved).length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analysts.filter(a => a.verified).length}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email ou organisation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-800/50 border-zinc-700"
        />
      </div>

      {/* Analysts List */}
      <Card>
        <CardContent className="p-0">
          {filteredAnalysts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No analyst found
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredAnalysts.map((analyst) => (
                <div key={analyst.user_id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{analyst.name}</p>
                      {analyst.verified && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-sm border" variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{analyst.email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {analyst.organization && <span>{analyst.organization}</span>}
                      {analyst.specialization && <span>â€¢ {analyst.specialization}</span>}
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {analyst.evaluations_count || 0} evaluations
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approval Status */}
                    {analyst.approved ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-sm border" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <Check className="w-3 h-3 mr-1" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-sm border" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        Pending
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!analyst.approved ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(analyst.user_id, true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(analyst.user_id, false)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(analyst.user_id, false)}
                          className="text-muted-foreground"
                        >
                          Revoke
                        </Button>
                      )}
                      
                      {analyst.approved && (
                        <Button
                          size="sm"
                          variant={analyst.verified ? "outline" : "default"}
                          onClick={() => handleVerify(analyst.user_id, !analyst.verified)}
                          className={analyst.verified ? "border-primary/50 text-primary" : "bg-primary text-black"}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          {analyst.verified ? 'Verified' : 'Verify'}
                        </Button>
                      )}
                      <button
                        onClick={() => handleDelete(analyst.user_id)}
                        className="text-xs px-2 py-1 rounded-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalysts;
