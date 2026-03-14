import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  GraduationCap, Plus, Edit, Trash2, Eye, Star, Clock, User
} from 'lucide-react';

const CATEGORIES = [
  { value: 'medical_recovery', label: 'Medical Recovery' },
  { value: 'pro_masterclass', label: 'Pro Masterclasses' },
  { value: 'college_tips', label: 'College Tips' },
  { value: 'fitness_conditioning', label: 'Fitness & Conditioning' },
  { value: 'mental_performance', label: 'Mental Performance' }
];

const SUBCATEGORIES = {
  medical_recovery: ['ACL Recovery', 'Ankle Sprain', 'Hamstring Injury', 'Knee Injury', 'Muscle Recovery', 'General Rehabilitation'],
  pro_masterclass: ['Goalkeeper', 'Defender', 'Midfielder', 'Striker', 'Winger', 'General Skills'],
  college_tips: ['Recruitment Process', 'Academic Balance', 'Showcase Events', 'Communication with Coaches', 'Scholarship Tips'],
  fitness_conditioning: ['Speed Training', 'Strength Training', 'Endurance', 'Flexibility', 'Nutrition'],
  mental_performance: ['Pre-Match Preparation', 'Dealing with Pressure', 'Confidence Building', 'Recovery Mindset', 'Goal Setting']
};

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const AdminMasterclass = () => {
  const [masterclasses, setMasterclasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMasterclass, setEditingMasterclass] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    difficulty: 'beginner',
    duration_minutes: 10,
    thumbnail: '',
    video_url: '',
    content: '',
    author_name: '',
    author_credentials: '',
    author_image: '',
    tags: '',
    featured: false
  });

  useEffect(() => {
    loadMasterclasses();
  }, []);

  const loadMasterclasses = async () => {
    try {
      const response = await api.getAllMasterclassesAdmin();
      setMasterclasses(response.data || []);
    } catch (error) {
      toast.error('Failed to load masterclasses');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      subcategory: '',
      difficulty: 'beginner',
      duration_minutes: 10,
      thumbnail: '',
      video_url: '',
      content: '',
      author_name: '',
      author_credentials: '',
      author_image: '',
      tags: '',
      featured: false
    });
    setEditingMasterclass(null);
  };

  const handleEdit = (masterclass) => {
    setFormData({
      ...masterclass,
      tags: masterclass.tags?.join(', ') || ''
    });
    setEditingMasterclass(masterclass);
    setShowCreateDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.author_name) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim().toLowerCase()) : []
      };

      if (editingMasterclass) {
        await api.updateMasterclass(editingMasterclass.id, data);
        toast.success('Masterclass updated!');
      } else {
        await api.createMasterclass(data);
        toast.success('Masterclass created!');
      }

      setShowCreateDialog(false);
      resetForm();
      loadMasterclasses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save masterclass');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this masterclass?')) return;

    try {
      await api.deleteMasterclass(id);
      toast.success('Masterclass deleted');
      loadMasterclasses();
    } catch (error) {
      toast.error('Failed to delete masterclass');
    }
  };

  const handleToggleFeatured = async (masterclass) => {
    try {
      await api.updateMasterclass(masterclass.id, { featured: !masterclass.featured });
      loadMasterclasses();
    } catch (error) {
      toast.error('Failed to update');
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
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold uppercase">MANAGE MASTERCLASSES</h1>
          </div>
          <p className="text-muted-foreground">Create and manage educational content for players</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black font-bold">
              <Plus className="w-4 h-4 mr-2" />
              CREATE MASTERCLASS
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading uppercase">
                {editingMasterclass ? 'EDIT MASTERCLASS' : 'CREATE MASTERCLASS'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., ACL Recovery: Complete Guide"
                  className="mt-1 bg-black/20 border-white/10"
                />
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of what players will learn..."
                  className="mt-1 bg-black/20 border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v, subcategory: ''})}>
                    <SelectTrigger className="mt-1 bg-black/20 border-white/10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subcategory</Label>
                  <Select value={formData.subcategory} onValueChange={(v) => setFormData({...formData, subcategory: v})}>
                    <SelectTrigger className="mt-1 bg-black/20 border-white/10">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {(SUBCATEGORIES[formData.category] || []).map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(v) => setFormData({...formData, difficulty: v})}>
                    <SelectTrigger className="mt-1 bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map(d => (
                        <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                    className="mt-1 bg-black/20 border-white/10"
                  />
                </div>
              </div>

              <div>
                <Label>Video URL (YouTube/Vimeo)</Label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-1 bg-black/20 border-white/10"
                />
              </div>

              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                  placeholder="https://..."
                  className="mt-1 bg-black/20 border-white/10"
                />
              </div>

              <div>
                <Label>Written Content (Markdown/Text)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Detailed lesson content..."
                  className="mt-1 bg-black/20 border-white/10 min-h-[150px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Author Name *</Label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData({...formData, author_name: e.target.value})}
                    placeholder="e.g., Cristiano Ronaldo"
                    className="mt-1 bg-black/20 border-white/10"
                  />
                </div>

                <div>
                  <Label>Author Credentials</Label>
                  <Input
                    value={formData.author_credentials}
                    onChange={(e) => setFormData({...formData, author_credentials: e.target.value})}
                    placeholder="e.g., Former Real Madrid Player"
                    className="mt-1 bg-black/20 border-white/10"
                  />
                </div>
              </div>

              <div>
                <Label>Author Image URL</Label>
                <Input
                  value={formData.author_image}
                  onChange={(e) => setFormData({...formData, author_image: e.target.value})}
                  placeholder="https://..."
                  className="mt-1 bg-black/20 border-white/10"
                />
              </div>

              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="acl, recovery, injury, rehab"
                  className="mt-1 bg-black/20 border-white/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="featured">Featured Masterclass</Label>
              </div>

              <Button onClick={handleSubmit} className="w-full bg-primary text-black font-bold h-12">
                {editingMasterclass ? 'UPDATE MASTERCLASS' : 'CREATE MASTERCLASS'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Masterclasses List */}
      {masterclasses.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No masterclasses created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {masterclasses.map((mc) => (
            <div
              key={mc.id}
              className="bg-card border border-border/50 p-4 rounded-sm flex items-center gap-4"
            >
              <div className="w-32 h-20 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                {mc.thumbnail ? (
                  <img src={mc.thumbnail} alt={mc.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {mc.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  <h3 className="font-heading font-bold uppercase truncate">{mc.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="capitalize">{mc.category?.replace('_', ' ')}</span>
                  <span>•</span>
                  <span className="capitalize">{mc.difficulty}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {mc.duration_minutes}m
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {mc.views || 0}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {mc.author_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleFeatured(mc)}
                  className={mc.featured ? 'border-yellow-500 text-yellow-500' : 'border-border'}
                >
                  <Star className={`w-4 h-4 ${mc.featured ? 'fill-yellow-500' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(mc)}
                  className="border-primary text-primary"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(mc.id)}
                  className="border-red-500 text-red-500"
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

export default AdminMasterclass;
