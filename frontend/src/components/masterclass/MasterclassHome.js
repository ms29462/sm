import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  GraduationCap, Heart, Search, Play, Clock, User,
  Stethoscope, Trophy, School, Dumbbell, Brain, Star, Bookmark
} from 'lucide-react';

const CATEGORY_INFO = {
  medical_recovery: {
    name: 'Medical Recovery',
    icon: Stethoscope,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: 'Recovery guides for injuries'
  },
  pro_masterclass: {
    name: 'Pro Masterclasses',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    description: 'Learn from professional footballers'
  },
  college_tips: {
    name: 'College Tips',
    icon: School,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'College recruitment & balance'
  },
  fitness_conditioning: {
    name: 'Fitness & Conditioning',
    icon: Dumbbell,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Physical training guides'
  },
  mental_performance: {
    name: 'Mental Performance',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Mental strength & focus'
  }
};

const MasterclassHome = () => {
  const [masterclasses, setMasterclasses] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [masterclassRes, categoriesRes, bookmarksRes] = await Promise.all([
        api.getMasterclasses({ limit: 20 }),
        api.getMasterclassCategories(),
        api.getUserBookmarks().catch(() => ({ data: [] }))
      ]);

      setMasterclasses(masterclassRes.data);
      setFeatured(masterclassRes.data.filter(m => m.featured).slice(0, 3));
      setCategories(categoriesRes.data.categories || []);
      setBookmarkedIds(new Set(bookmarksRes.data.map(m => m.id)));
    } catch (error) {
      toast.error('Failed to load masterclasses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    try {
      const response = await api.getMasterclasses({ search: searchQuery });
      setMasterclasses(response.data);
    } catch (error) {
      toast.error('Search failed');
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
        toast.success('Removed from bookmarks');
      } else {
        await api.bookmarkMasterclass(masterclassId);
        setBookmarkedIds(prev => new Set(prev).add(masterclassId));
        toast.success('Added to bookmarks');
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold uppercase">MASTERCLASS</h1>
        </div>
        <p className="text-muted-foreground">Learn from the best - Medical recovery, pro tips, and more</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-8 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="masterclass-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search masterclasses..."
            className="pl-10 bg-black/20 border-white/10 h-12"
          />
        </div>
        <Button onClick={handleSearch} className="bg-primary text-black font-bold px-6">
          SEARCH
        </Button>
        <Link to="/player/masterclass/bookmarks">
          <Button variant="outline" className="border-primary text-primary h-12 px-4">
            <Bookmark className="w-4 h-4 mr-2" />
            SAVED
          </Button>
        </Link>
      </div>

      {/* Categories */}
      <div className="mb-10">
        <h2 className="text-xl font-heading font-bold uppercase mb-4">CATEGORIES</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const info = CATEGORY_INFO[category] || {};
            const Icon = info.icon || GraduationCap;
            const count = masterclasses.filter(m => m.category === category).length;
            
            return (
              <Link
                key={category}
                to={`/player/masterclass/category/${category}`}
                className={`p-6 rounded-sm border border-border hover:border-primary/50 transition-colors ${info.bgColor || 'bg-card'}`}
              >
                <Icon className={`w-8 h-8 ${info.color || 'text-primary'} mb-3`} />
                <h3 className="font-heading font-bold uppercase text-sm mb-1">{info.name || category}</h3>
                <p className="text-xs text-muted-foreground">{count} lessons</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-heading font-bold uppercase mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            FEATURED
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((masterclass) => {
              const catInfo = CATEGORY_INFO[masterclass.category] || {};
              
              return (
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
                        <Play className="w-12 h-12 text-muted-foreground" />
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
                      <span className={`text-xs px-2 py-0.5 rounded-sm ${catInfo.bgColor} ${catInfo.color}`}>
                        {catInfo.name || masterclass.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-sm ${getDifficultyColor(masterclass.difficulty)}`}>
                        {masterclass.difficulty}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold uppercase mb-2 line-clamp-2">{masterclass.title}</h3>
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
              );
            })}
          </div>
        </div>
      )}

      {/* All Masterclasses */}
      <div>
        <h2 className="text-xl font-heading font-bold uppercase mb-4">ALL MASTERCLASSES</h2>
        {masterclasses.length === 0 ? (
          <div className="bg-card border border-border p-12 rounded-sm text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No masterclasses available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {masterclasses.map((masterclass) => {
              const catInfo = CATEGORY_INFO[masterclass.category] || {};
              
              return (
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
                        <Play className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={(e) => handleBookmark(e, masterclass.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-sm hover:bg-black/70"
                    >
                      <Bookmark className={`w-3 h-3 ${bookmarkedIds.has(masterclass.id) ? 'text-primary fill-primary' : 'text-white'}`} />
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-sm ${getDifficultyColor(masterclass.difficulty)}`}>
                        {masterclass.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {masterclass.duration_minutes}m
                      </span>
                    </div>
                    <h3 className="font-heading font-bold uppercase text-sm mb-1 line-clamp-2">{masterclass.title}</h3>
                    <p className="text-xs text-muted-foreground">{masterclass.author_name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterclassHome;
