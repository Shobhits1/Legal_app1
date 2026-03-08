"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scale,
  Search,
  Filter,
  BookOpen,
  Calendar,
  MapPin,
  Star,
  ExternalLink,
  Loader2,
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
  sections: Array<{
    legalSection: {
      act: string;
      section: string;
      title: string;
    };
  }>;
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

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedCourt]);

  useEffect(() => {
    fetchCaseLaws();
  }, [searchTerm, selectedCategory, selectedCourt, page]);

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
      if (!response.ok) {
        throw new Error('Failed to fetch case laws');
      }

      const data = await response.json();
      setCaseLaws(data.caseLaws || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching case laws:', error);
      toast({
        title: "Error",
        description: "Failed to load case laws. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = caseLaws;

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Case Laws Database</h1>
          <p className="text-sm text-muted-foreground">
            Search and explore landmark legal judgments and precedents
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Case Laws
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by case name, citation, or legal section..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Court" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courts</SelectItem>
                    <SelectItem value="Supreme Court of India">
                      Supreme Court
                    </SelectItem>
                    <SelectItem value="High Court">High Court</SelectItem>
                    <SelectItem value="District Court">
                      District Court
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Search Results ({totalCount.toLocaleString()} cases found — page {page} of {totalPages})
              </h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading case laws...</span>
              </div>
            ) : filteredCases.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No case laws found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or filters.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredCases.map((caselaw) => (
                <Card
                  key={caselaw.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {caselaw.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {caselaw.citation}
                          </span>
                          <span className="flex items-center gap-1">
                            <Scale className="h-4 w-4" />
                            {caselaw.court}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(caselaw.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">{caselaw.category}</Badge>
                          <Badge
                            variant={
                              caselaw.relevance === "High" ? "default" : "outline"
                            }
                          >
                            {caselaw.relevance} Relevance
                          </Badge>
                          {caselaw.sections.map((section, idx) => (
                            <Badge key={idx} variant="outline">
                              {section.legalSection.act} {section.legalSection.section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < caselaw.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                      </TabsList>
                      <TabsContent value="summary" className="mt-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {caselaw.summary}
                        </p>
                      </TabsContent>
                      <TabsContent value="keypoints" className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          Key points data not available in current API response.
                        </p>
                      </TabsContent>
                    </Tabs>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Full Text
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        External Link
                      </Button>
                      <Button size="sm" variant="outline">
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ← Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
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
