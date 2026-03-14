import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, Bookmark, Clock, User, Play,
  Stethoscope, Trophy, School, Dumbbell, Brain, Filter
} from 'lucide-react';

const CATEGORY_INFO = {
  medical_recovery: { name: 'Medical Recovery', icon: Stethoscope, color: 'text-red-500' },
  pro_masterclass: { name: 'Pro Masterclasses', icon: Trophy, color: 'text-yellow-500' },
  college_tips: { name: 'College Tips', icon: School, color: 'text-blue-500' },
  fitness_conditioning: { name: 'Fitness & Conditioning', icon: Dumbbell, color: 'text-green-500' },
  mental_performance: { name: 'Mental Performance', icon: Brain, color: 'text-purple-500' }
};

const MasterclassCategory = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [masterclasses, setMasterclasses] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  const categoryInfo = CATEGORY_INFO[category] || { name: category, icon: Play };
  const CategoryIcon = categoryInfo.icon;

  useEffect(() => {
    loadData();
  }, [category, selectedSubcategory, selectedDifficulty]);

  const loadData = async () => {
    try {
      const params = { category };
      if (selectedSubcategory !== 'all') params.subcategory = selectedSubcategory;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;

      const [masterclassRes, categoriesRes, bookmarksRes] = await Promise.all([
        api.getMasterclasses(params),
        api.getMasterclassCategories(),
        api.getUserBookmarks().catch(() => ({ data: [] }))
      ]);

      setMasterclasses(masterclassRes.data);
      setSubcategories(categoriesRes.data.subcategories?.[category] || []);
      setBookmarkedIds(new Set(bookmarksRes.data.map(m => m.id)));
    } catch (error) {
      toast.error('Failed to load masterclasses');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (e, masterclassId) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (bookmarkedIds.has(masterclassId)) {
        await api.removeBookmark(masterclassId);
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.delete(masterclassId);
          return next;
        });
      } else {
        await api.bookmarkMasterclass(masterclassId);
        setBookmarkedIds(prev => new Set(prev).add(masterclassId));
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
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
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/player/masterclass')}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </Button>
        <div className="flex items-center gap-3">
          <CategoryIcon className={`w-8 h-8 ${categoryInfo.color}`} />
          <h1 className="text-3xl font-heading font-bold uppercase">{categoryInfo.name}</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>
        
        {subcategories.length > 0 && (
          <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
            <SelectTrigger className="w-[200px] bg-black/20 border-white/10">
              <SelectValue placeholder="Subcategory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {subcategories.map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-[150px] bg-black/20 border-white/10">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {masterclasses.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <CategoryIcon className={`w-12 h-12 ${categoryInfo.color} mx-auto mb-4 opacity-50`} />
          <p className="text-muted-foreground">No masterclasses found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {masterclasses.map((masterclass) => (
            <Link
              key={masterclass.id}
              to={`/player/masterclass/${masterclass.id}`}
              className="bg-card border border-border rounded-sm overflow-hidden hover:border-primary/50 transition-colors group"
            >
              <div className="relative aspect-video bg-muted">
                {masterclass.thumbnail ? (
                  <img src={masterclass.thumbnail} alt={masterclass.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white" />
                </div>
                <button
                  onClick={(e) => handleBookmark(e, masterclass.id)}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-sm hover:bg-black/70"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(masterclass.id) ? 'text-primary fill-primary' : 'text-white'}`} />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {masterclass.subcategory && (
                    <span className="text-xs px-2 py-0.5 rounded-sm bg-primary/10 text-primary">
                      {masterclass.subcategory}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-sm ${getDifficultyColor(masterclass.difficulty)}`}>
                    {masterclass.difficulty}
                  </span>
                </div>
                <h3 className="font-heading font-bold uppercase mb-2 line-clamp-2">{masterclass.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{masterclass.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {masterclass.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {masterclass.duration_minutes} min
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MasterclassCategory;
