"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  BookOpen,
  Scale,
  FileText,
  TrendingUp,
  Loader2,
  Heart,
  Clock,
  ArrowRight,
  Sparkles,
  Shield,
  Gavel,
  Zap,
  Filter,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  relevance?: number;
  category?: string;
  citation?: string;
  court?: string;
  date?: string;
  firNumber?: string;
  status?: string;
  priority?: string;
  location?: string;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300/80 dark:bg-yellow-600/40 rounded px-0.5 font-medium">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function truncate(str: string, maxLen: number) {
  if (!str) return "";
  return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
}

/* ---------- Skeleton Loading Component ---------- */
function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className={`animate-fade-in-up animation-delay-${i * 100}`}>
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded animate-shimmer" />
                  <div className="h-4 w-20 rounded animate-shimmer" />
                  <div className="h-4 w-24 rounded animate-shimmer" />
                </div>
                <div className="h-5 w-3/4 rounded animate-shimmer" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded animate-shimmer" />
                  <div className="h-3 w-2/3 rounded animate-shimmer" />
                </div>
                <div className="flex gap-3">
                  <div className="h-3 w-24 rounded animate-shimmer" />
                  <div className="h-3 w-20 rounded animate-shimmer" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-6 w-16 rounded-full animate-shimmer" />
                <div className="h-7 w-7 rounded animate-shimmer" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [counts, setCounts] = useState({ sections: 0, caseLaws: 0, firs: 0, total: 0 });
  const [searchTimeMs, setSearchTimeMs] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Load user's favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoadingFavorites(true);
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const data = await response.json();
          const favoriteKeys = new Set<string>(
            data.favorites?.map((fav: any) => `${fav.type}-${fav.itemId}`) || []
          );
          setFavorites(favoriteKeys);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoadingFavorites(false);
      }
    };
    loadFavorites();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      params.append('q', searchTerm.trim());
      if (searchType !== 'all') params.append('type', searchType);
      params.append('limit', '20');

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setCounts(data.counts || { sections: 0, caseLaws: 0, firs: 0, total: 0 });
      setSearchTimeMs(data.searchTimeMs || null);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
      setResults([]);
      setCounts({ sections: 0, caseLaws: 0, firs: 0, total: 0 });
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, searchType, toast]);

  // Auto-search when search term changes (debounced)
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 400);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setCounts({ sections: 0, caseLaws: 0, firs: 0, total: 0 });
      setSearchTimeMs(null);
      setHasSearched(false);
    }
  }, [searchTerm, searchType, handleSearch]);

  const getSortedResults = () => {
    return [...results].sort((a, b) => {
      if (sortBy === "relevance") return (b.relevance || 0) - (a.relevance || 0);
      if (sortBy === "date") {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      }
      return a.title.localeCompare(b.title);
    });
  };

  const handleFavoriteToggle = async (type: string, itemId: string) => {
    const favoriteKey = `${type}-${itemId}`;
    const isFavorited = favorites.has(favoriteKey);

    try {
      if (isFavorited) {
        const response = await fetch(`/api/favorites?type=${type}&itemId=${itemId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setFavorites(prev => {
            const newSet = new Set(prev);
            newSet.delete(favoriteKey);
            return newSet;
          });
          toast({
            title: "Removed from favorites",
            description: "Item removed successfully.",
          });
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: type === 'section' ? 'LEGAL_SECTION' :
              type === 'caseLaw' ? 'CASE_LAW' : 'FIR_TEMPLATE',
            itemId,
          }),
        });
        if (response.ok) {
          setFavorites(prev => new Set([...Array.from(prev), favoriteKey]));
          toast({
            title: "Added to favorites",
            description: "Item saved to your favorites.",
          });
        }
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'caseLaw') {
      router.push('/case-laws');
    } else if (result.type === 'section') {
      router.push('/legal-sections');
    } else if (result.type === 'fir') {
      router.push(`/firs/${result.id}`);
    }
  };

  const sortedResults = getSortedResults();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'section': return <BookOpen className="h-4 w-4" />;
      case 'caseLaw': return <Scale className="h-4 w-4" />;
      case 'fir': return <FileText className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'section': return 'Legal Section';
      case 'caseLaw': return 'Case Law';
      case 'fir': return 'FIR Record';
      default: return type;
    }
  };

  const getTypeBorderColor = (type: string) => {
    switch (type) {
      case 'section': return 'border-l-blue-500';
      case 'caseLaw': return 'border-l-emerald-500';
      case 'fir': return 'border-l-orange-500';
      default: return 'border-l-primary';
    }
  };

  const getTypeIconColor = (type: string) => {
    switch (type) {
      case 'section': return 'text-blue-500 bg-blue-500/10';
      case 'caseLaw': return 'text-emerald-500 bg-emerald-500/10';
      case 'fir': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  const getRelevanceBadge = (relevance: number) => {
    if (relevance >= 90) return { color: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white', label: 'Excellent' };
    if (relevance >= 70) return { color: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white', label: 'Good' };
    if (relevance >= 50) return { color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white', label: 'Fair' };
    return { color: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white', label: 'Low' };
  };

  const isFavorited = (type: string, id: string) => favorites.has(`${type}-${id}`);

  const caseCategories = [
    "Criminal Appeal", "Bail Application", "Property Dispute",
    "Constitutional Matter", "Contract Law", "Family Law",
    "Taxation Matter", "Corporate Law", "Service Matter",
  ];

  const crimeTypes = [
    "theft", "dowry death", "murder", "assault", "cheating",
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* ── Premium Header ── */}
      <header className="relative overflow-hidden border-b border-border/40">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 dark:from-primary/10 dark:to-primary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex items-center gap-3 px-6 py-5">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <Search className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">Universal Search</h1>
              <p className="text-sm text-muted-foreground">
                Search across <span className="text-blue-500 font-medium">IPC Sections</span>, <span className="text-emerald-500 font-medium">Case Laws</span>, and <span className="text-orange-500 font-medium">FIR Records</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── Glassmorphism Search Bar ── */}
          <div className="animate-fade-in-up">
            <Card className="relative overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
              {/* Subtle glow line at top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search for IPC sections, case laws, FIR records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 h-12 text-base border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl bg-background/80"
                      id="search-input"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all"
                    id="search-button"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="w-44 rounded-lg border-border/50" id="filter-type">
                      <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Search Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      <SelectItem value="sections">Legal Sections</SelectItem>
                      <SelectItem value="caseLaws">Case Laws</SelectItem>
                      <SelectItem value="firs">FIR Records</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 rounded-lg border-border/50" id="filter-sort">
                      <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="date">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Popular Searches (only when idle) ── */}
          {!hasSearched && (
            <div className="animate-fade-in-up animation-delay-100">
              <Card className="bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Popular Searches
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Case Categories */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Scale className="h-3 w-3" />
                      Case Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {caseCategories.map((term) => (
                        <Badge
                          key={term}
                          variant="outline"
                          className="cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 dark:hover:text-emerald-400 transition-all duration-200 py-1.5 px-3 hover:scale-105"
                          onClick={() => setSearchTerm(term)}
                          id={`tag-${term.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {/* Crime Types */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      Crime Types
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {crimeTypes.map((term) => (
                        <Badge
                          key={term}
                          variant="outline"
                          className="cursor-pointer hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/30 dark:hover:text-orange-400 transition-all duration-200 py-1.5 px-3 hover:scale-105 capitalize"
                          onClick={() => setSearchTerm(term)}
                          id={`tag-${term.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Search Stats Bar ── */}
          {hasSearched && !isSearching && (
            <div className="flex items-center justify-between text-sm text-muted-foreground animate-fade-in-up">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-foreground text-base">
                  {counts.total} results found
                </span>
                {searchTimeMs !== null && (
                  <span className="flex items-center gap-1 text-xs bg-muted/60 px-2.5 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    {(searchTimeMs / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                {counts.sections > 0 && (
                  <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
                    <BookOpen className="h-3 w-3" />
                    {counts.sections} sections
                  </span>
                )}
                {counts.caseLaws > 0 && (
                  <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                    <Scale className="h-3 w-3" />
                    {counts.caseLaws} case laws
                  </span>
                )}
                {counts.firs > 0 && (
                  <span className="flex items-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full">
                    <FileText className="h-3 w-3" />
                    {counts.firs} FIRs
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Search Results ── */}
          <div className="space-y-3">
            {isSearching ? (
              <SearchSkeleton />
            ) : sortedResults.length > 0 ? (
              sortedResults.map((result, index) => (
                <Card
                  key={`${result.type}-${result.id}`}
                  className={`
                    border-l-4 ${getTypeBorderColor(result.type)}
                    hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20
                    transition-all duration-300 cursor-pointer group
                    bg-card/80 backdrop-blur-sm
                    animate-fade-in-up
                  `}
                  style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
                  onClick={() => handleResultClick(result)}
                  id={`result-${result.type}-${result.id}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`flex items-center justify-center h-6 w-6 rounded-md ${getTypeIconColor(result.type)}`}>
                            {getTypeIcon(result.type)}
                          </span>
                          <Badge variant="outline" className="text-xs font-normal rounded-md">
                            {getTypeLabel(result.type)}
                          </Badge>
                          {result.category && result.category !== result.type && (
                            <Badge variant="secondary" className="text-xs rounded-md">
                              {result.category}
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors duration-200">
                          <HighlightText text={result.title} query={searchTerm} />
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-2.5 line-clamp-2 leading-relaxed">
                          <HighlightText
                            text={truncate(result.description, 200)}
                            query={searchTerm}
                          />
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {result.citation && (
                            <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded">
                              <BookOpen className="h-3 w-3" />
                              {result.citation}
                            </span>
                          )}
                          {result.court && (
                            <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded">
                              <Scale className="h-3 w-3" />
                              {result.court}
                            </span>
                          )}
                          {result.date && (
                            <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded">
                              <Clock className="h-3 w-3" />
                              {new Date(result.date).toLocaleDateString()}
                            </span>
                          )}
                          {result.firNumber && (
                            <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">{result.firNumber}</span>
                          )}
                          {result.status && (
                            <Badge variant={result.status === 'APPROVED' ? 'default' : 'secondary'} className="text-xs">
                              {result.status}
                            </Badge>
                          )}
                          {result.location && (
                            <span className="bg-muted/50 px-2 py-0.5 rounded">{result.location}</span>
                          )}
                        </div>
                      </div>

                      {/* Right side: relevance + actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {result.relevance !== undefined && result.relevance > 0 && (() => {
                          const badge = getRelevanceBadge(result.relevance);
                          return (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${badge.color}`}>
                              {result.relevance}%
                            </span>
                          );
                        })()}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavoriteToggle(result.type, result.id);
                            }}
                            className={`rounded-full h-8 w-8 p-0 ${isFavorited(result.type, result.id) ? "text-red-500 hover:text-red-600" : "hover:text-red-500"}`}
                            disabled={loadingFavorites}
                            id={`fav-${result.type}-${result.id}`}
                          >
                            <Heart className={`h-4 w-4 ${isFavorited(result.type, result.id) ? "fill-current" : ""}`} />
                          </Button>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : hasSearched ? (
              /* ── No Results State ── */
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-6">
                    <div className="rounded-2xl bg-muted/50 p-5">
                      <Search className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 rounded-full bg-orange-100 dark:bg-orange-900/30 p-1">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-sm text-muted-foreground mb-5 text-center max-w-md">
                    No matches for &ldquo;<span className="font-medium text-foreground">{searchTerm}</span>&rdquo;. Try different keywords or browse categories below.
                  </p>
                  <div className="flex gap-2">
                    {["Criminal Appeal", "Property Dispute", "theft"].map(term => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all py-1.5 px-3"
                        onClick={() => setSearchTerm(term)}
                      >
                        Try &ldquo;{term}&rdquo;
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* ── Premium Empty / Welcome State ── */
              <Card className="relative overflow-hidden border-primary/10">
                {/* Subtle gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-emerald-500/3 dark:from-primary/5 dark:to-emerald-500/5" />

                <CardContent className="relative flex flex-col items-center justify-center py-20">
                  {/* Floating Icons */}
                  <div className="relative mb-8">
                    <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-5 animate-glow-pulse">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-3 -left-6 animate-float">
                      <div className="rounded-xl bg-blue-500/10 p-2.5 shadow-sm">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-6 animate-float animation-delay-1000">
                      <div className="rounded-xl bg-emerald-500/10 p-2.5 shadow-sm">
                        <Scale className="h-5 w-5 text-emerald-500" />
                      </div>
                    </div>
                    <div className="absolute -bottom-3 -right-4 animate-float animation-delay-2000">
                      <div className="rounded-xl bg-orange-500/10 p-2.5 shadow-sm">
                        <FileText className="h-5 w-5 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2">Search Legal Resources</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-lg mb-8 leading-relaxed">
                    Instantly search across India&apos;s comprehensive legal database. Find{" "}
                    <span className="font-semibold text-blue-500">IPC Sections</span>,{" "}
                    <span className="font-semibold text-emerald-500">28,900+ Case Laws</span>, and{" "}
                    <span className="font-semibold text-orange-500">FIR Records</span>{" "}
                    in one place.
                  </p>

                  {/* Quick-start cards */}
                  <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                    <button
                      onClick={() => { setSearchType('sections'); document.getElementById('search-input')?.focus(); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-200 group/qs"
                      id="qs-sections"
                    >
                      <BookOpen className="h-5 w-5 text-blue-500 group-hover/qs:scale-110 transition-transform" />
                      <span className="text-xs font-medium">IPC Sections</span>
                    </button>
                    <button
                      onClick={() => { setSearchType('caseLaws'); document.getElementById('search-input')?.focus(); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200 group/qs"
                      id="qs-caselaws"
                    >
                      <Scale className="h-5 w-5 text-emerald-500 group-hover/qs:scale-110 transition-transform" />
                      <span className="text-xs font-medium">Case Laws</span>
                    </button>
                    <button
                      onClick={() => { setSearchType('firs'); document.getElementById('search-input')?.focus(); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all duration-200 group/qs"
                      id="qs-firs"
                    >
                      <FileText className="h-5 w-5 text-orange-500 group-hover/qs:scale-110 transition-transform" />
                      <span className="text-xs font-medium">FIR Records</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Analytics Summary Cards ── */}
          {hasSearched && counts.total > 0 && (
            <div className="grid grid-cols-3 gap-4 animate-fade-in-up animation-delay-300">
              {/* Sections */}
              <Card className="relative overflow-hidden border-blue-500/20 bg-card/80 backdrop-blur-sm group hover:shadow-md hover:shadow-blue-500/5 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardContent className="py-4 flex items-center gap-3 relative">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-2.5 group-hover:scale-105 transition-transform">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold animate-count-up">{counts.sections}</div>
                    <p className="text-xs text-muted-foreground">Legal Sections</p>
                  </div>
                </CardContent>
              </Card>

              {/* Case Laws */}
              <Card className="relative overflow-hidden border-emerald-500/20 bg-card/80 backdrop-blur-sm group hover:shadow-md hover:shadow-emerald-500/5 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardContent className="py-4 flex items-center gap-3 relative">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-2.5 group-hover:scale-105 transition-transform">
                    <Scale className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold animate-count-up">{counts.caseLaws}</div>
                    <p className="text-xs text-muted-foreground">Case Laws</p>
                  </div>
                </CardContent>
              </Card>

              {/* FIRs */}
              <Card className="relative overflow-hidden border-orange-500/20 bg-card/80 backdrop-blur-sm group hover:shadow-md hover:shadow-orange-500/5 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardContent className="py-4 flex items-center gap-3 relative">
                  <div className="rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-2.5 group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold animate-count-up">{counts.firs}</div>
                    <p className="text-xs text-muted-foreground">FIR Records</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
