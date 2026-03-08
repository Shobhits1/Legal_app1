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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Search,
  Scale,
  AlertTriangle,
  Clock,
  Users,
  Copy,
  Star,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LegalSection {
  id: string;
  act: string;
  section: string;
  title: string;
  description: string;
  punishment: string;
  essentials: string;
  category: string;
  frequency: string;
  relatedSections: string;
}

export default function LegalSections() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ipc");
  const [legalSections, setLegalSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLegalSections();
  }, [activeTab, searchTerm]);

  const fetchLegalSections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (activeTab !== 'all') params.append('act', activeTab.toUpperCase());

      const response = await fetch(`/api/legal-sections?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch legal sections');
      }

      const data = await response.json();
      setLegalSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching legal sections:', error);
      toast({
        title: "Error",
        description: "Failed to load legal sections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Section details copied to clipboard",
    });
  };

  const parseEssentials = (essentials: string) => {
    try {
      return JSON.parse(essentials);
    } catch {
      return [];
    }
  };

  const parseRelatedSections = (relatedSections: string) => {
    try {
      return JSON.parse(relatedSections);
    } catch {
      return [];
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Legal Sections Reference</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive database of legal sections with detailed explanations
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Legal Sections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by section number, title, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Tabs for different acts */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ipc">Indian Penal Code (IPC)</TabsTrigger>
              <TabsTrigger value="bns">
                Bharatiya Nyaya Sanhita (BNS)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ipc" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  IPC Sections ({legalSections.length} found)
                </h2>
                <Badge variant="secondary">Indian Penal Code 1860</Badge>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading legal sections...</span>
                </div>
              ) : legalSections.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No sections found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search criteria.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {legalSections.map((section) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <Card>
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  Section {section.section}
                                </Badge>
                                <span className="font-semibold">
                                  {section.title}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  section.frequency === "Very High"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {section.frequency}
                              </Badge>
                              <Badge variant="outline">{section.category}</Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Description
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {section.description}
                                </p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Punishment</h4>
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                  {section.punishment}
                                </p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">
                                  Essential Elements
                                </h4>
                                <ul className="space-y-1">
                                  {parseEssentials(section.essentials).map((essential: string, index: number) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                                      <span>{essential}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">
                                  Related Sections
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {parseRelatedSections(section.relatedSections).map(
                                    (relatedSection: string) => (
                                      <Badge
                                        key={relatedSection}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-secondary"
                                      >
                                        Section {relatedSection}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4 border-t">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(
                                      `Section ${section.section} - ${section.title}\n\n${section.description}\n\nPunishment: ${section.punishment}`
                                    )
                                  }
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Section
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Favorites
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Scale className="h-4 w-4 mr-2" />
                                  View Case Laws
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="bns" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  BNS Sections ({legalSections.length} found)
                </h2>
                <Badge variant="secondary">Bharatiya Nyaya Sanhita 2023</Badge>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading legal sections...</span>
                </div>
              ) : legalSections.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No sections found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search criteria.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {legalSections.map((section) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <Card>
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  Section {section.section}
                                </Badge>
                                <span className="font-semibold">
                                  {section.title}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  section.frequency === "Very High"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {section.frequency}
                              </Badge>
                              <Badge variant="outline">{section.category}</Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Description
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {section.description}
                                </p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Punishment</h4>
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                  {section.punishment}
                                </p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">
                                  Essential Elements
                                </h4>
                                <ul className="space-y-1">
                                  {parseEssentials(section.essentials).map((essential: string, index: number) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                                      <span>{essential}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">
                                  Related Sections
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {parseRelatedSections(section.relatedSections).map(
                                    (relatedSection: string) => (
                                      <Badge
                                        key={relatedSection}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-secondary"
                                      >
                                        Section {relatedSection}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4 border-t">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(
                                      `Section ${section.section} - ${section.title}\n\n${section.description}\n\nPunishment: ${section.punishment}`
                                    )
                                  }
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Section
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Favorites
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Scale className="h-4 w-4 mr-2" />
                                  View Case Laws
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
