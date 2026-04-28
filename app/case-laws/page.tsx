"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Scale, Search, Filter, BookOpen, Calendar, Star, ExternalLink, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CaseLaw {
  id: string;
  title: string;
  citation: string;
  court: string;
  date: string;
  category: string;
  summary: string;
  rating: number;
  relevance: string;
  sections: Array<{ legalSection: { act: string; section: string; title: string } }>;
}

export default function CaseLaws() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCourt, setSelectedCourt] = useState("all");
  const [caseLaws, setCaseLaws] = useState<CaseLaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => { setPage(1); }, [searchTerm, selectedCategory, selectedCourt]);
  useEffect(() => { fetchCaseLaws(); }, [searchTerm, selectedCategory, selectedCourt, page]);

  const fetchCaseLaws = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '20');
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCourt !== 'all') params.append('court', selectedCourt);

      const response = await fetch(`/api/case-laws?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch case laws');

      const data = await response.json();
      setCaseLaws(data.caseLaws || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching case laws:', error);
      toast({ title: "Error", description: "Failed to load case laws. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/40 glass-card">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Case Laws Database
          </h1>
          <p className="text-sm text-muted-foreground">Search and explore landmark legal judgments and precedents</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search */}
          <Card className="glass-card border-border/40 rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case name, citation, or legal section..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-background/50 border-border/60 focus:border-primary/50 rounded-xl"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48 h-11 bg-background/50 border-border/60 rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Criminal Appeal">Criminal Appeal</SelectItem>
                    <SelectItem value="Bail Application">Bail Application</SelectItem>
                    <SelectItem value="Constitutional Matter">Constitutional Matter</SelectItem>
                    <SelectItem value="Contract Law">Contract Law</SelectItem>
                    <SelectItem value="Property Dispute">Property Dispute</SelectItem>
                    <SelectItem value="Taxation Matter">Taxation Matter</SelectItem>
                    <SelectItem value="Service Matter">Service Matter</SelectItem>
                    <SelectItem value="Family Law">Family Law</SelectItem>
                    <SelectItem value="Corporate Law">Corporate Law</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                  <SelectTrigger className="w-full md:w-48 h-11 bg-background/50 border-border/60 rounded-xl">
                    <SelectValue placeholder="Court" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50">
                    <SelectItem value="all">All Courts</SelectItem>
                    <SelectItem value="Supreme Court of India">Supreme Court</SelectItem>
                    <SelectItem value="High Court">High Court</SelectItem>
                    <SelectItem value="District Court">District Court</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-muted-foreground">
              {totalCount.toLocaleString()} cases found — page {page} of {totalPages}
            </h2>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <span className="text-sm text-muted-foreground">Loading case laws...</span>
              </div>
            ) : caseLaws.length === 0 ? (
              <Card className="glass-card border-border/40 rounded-2xl">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="h-14 w-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                      <Scale className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No case laws found</h3>
                    <p className="text-sm text-muted-foreground">Try adjusting your search criteria or filters.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              caseLaws.map((caselaw) => (
                <Card key={caselaw.id} className="glass-card glass-card-hover border-border/40 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base mb-2">{caselaw.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" /> {caselaw.citation}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Scale className="h-3.5 w-3.5" /> {caselaw.court}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> {new Date(caselaw.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">{caselaw.category}</Badge>
                          <Badge variant={caselaw.relevance === "High" ? "default" : "outline"} className="text-[10px] font-semibold">
                            {caselaw.relevance} Relevance
                          </Badge>
                          {caselaw.sections.map((section, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] font-mono border-border/60">
                              {section.legalSection.act} {section.legalSection.section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < caselaw.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="bg-muted/30 rounded-lg h-9">
                        <TabsTrigger value="summary" className="text-xs rounded-md">Summary</TabsTrigger>
                        <TabsTrigger value="keypoints" className="text-xs rounded-md">Key Points</TabsTrigger>
                      </TabsList>
                      <TabsContent value="summary" className="mt-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">{caselaw.summary}</p>
                      </TabsContent>
                      <TabsContent value="keypoints" className="mt-3">
                        <p className="text-sm text-muted-foreground">Key points data not available in current API response.</p>
                      </TabsContent>
                    </Tabs>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/40">
                      <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs h-8 shadow-sm">
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" /> View Full Text
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 border-border/60">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> External Link
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 border-border/60">
                        Add to Favorites
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="border-border/60">
                  ← Previous
                </Button>
                <span className="text-sm text-muted-foreground font-mono">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="border-border/60">
                  Next →
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
