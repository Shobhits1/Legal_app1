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
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen, Search, Scale, Copy, Star, Loader2, ArrowRight, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LegalSection {
  id: string; act: string; section: string; title: string;
  description: string; punishment: string; essentials: string;
  category: string; frequency: string; relatedSections: string;
}

export default function LegalSections() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ipc");
  const [legalSections, setLegalSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchLegalSections(); }, [activeTab, searchTerm]);

  const fetchLegalSections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (activeTab !== 'all') params.append('act', activeTab.toUpperCase());
      const response = await fetch(`/api/legal-sections?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch legal sections');
      const data = await response.json();
      setLegalSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching legal sections:', error);
      toast({ title: "Error", description: "Failed to load legal sections.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Section details copied to clipboard" });
  };

  const parseEssentials = (essentials: string) => { try { return JSON.parse(essentials); } catch { return []; } };
  const parseRelatedSections = (relatedSections: string) => { try { return JSON.parse(relatedSections); } catch { return []; } };

  const renderSections = (actLabel: string) => (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-muted-foreground">
          {legalSections.length} sections found
        </h2>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">{actLabel}</Badge>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <span className="text-sm text-muted-foreground">Loading legal sections...</span>
        </div>
      ) : legalSections.length === 0 ? (
        <Card className="glass-card border-border/40 rounded-2xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No sections found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search criteria.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {legalSections.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border-0">
              <Card className="glass-card border-border/40 rounded-2xl overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs border-primary/20 text-primary bg-primary/5 shrink-0">
                        §{section.section}
                      </Badge>
                      <span className="font-semibold text-sm text-left">{section.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge className={`text-[10px] font-semibold ${
                        section.frequency === "Very High" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-muted/50 text-muted-foreground border-border/60"
                      }`}>
                        {section.frequency}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-border/60">{section.category}</Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0 space-y-5">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Description</h4>
                      <p className="text-sm leading-relaxed">{section.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Punishment</h4>
                      <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-400">{section.punishment}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Essential Elements</h4>
                      <ul className="space-y-2">
                        {parseEssentials(section.essentials).map((essential: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <ArrowRight className="h-3 w-3 text-blue-400" />
                            </div>
                            <span className="text-sm">{essential}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Related Sections</h4>
                      <div className="flex flex-wrap gap-2">
                        {parseRelatedSections(section.relatedSections).map((relatedSection: string) => (
                          <Badge key={relatedSection} variant="outline" className="cursor-pointer hover:bg-accent/50 transition-colors text-xs border-border/60 font-mono">
                            §{relatedSection}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                      <Button size="sm" onClick={() => copyToClipboard(`Section ${section.section} - ${section.title}\n\n${section.description}\n\nPunishment: ${section.punishment}`)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs h-8 shadow-sm">
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Section
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 border-border/60">
                        <Star className="h-3.5 w-3.5 mr-1.5" /> Add to Favorites
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 border-border/60">
                        <Scale className="h-3.5 w-3.5 mr-1.5" /> View Case Laws
                      </Button>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/40 glass-card">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Legal Sections Reference
          </h1>
          <p className="text-sm text-muted-foreground">Comprehensive database of legal sections with detailed explanations</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search */}
          <Card className="glass-card border-border/40 rounded-2xl">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by section number, title, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-background/50 border-border/60 focus:border-primary/50 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 rounded-xl h-11 p-1">
              <TabsTrigger value="ipc" className="rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Indian Penal Code (IPC)
              </TabsTrigger>
              <TabsTrigger value="bns" className="rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Bharatiya Nyaya Sanhita (BNS)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ipc" className="space-y-4 mt-4">
              {renderSections("Indian Penal Code 1860")}
            </TabsContent>

            <TabsContent value="bns" className="space-y-4 mt-4">
              {renderSections("Bharatiya Nyaya Sanhita 2023")}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
