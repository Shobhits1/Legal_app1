"use client";

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Send,
  Loader2,
  BookOpen,
  Scale,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Save,
  Calendar,
  MapPin,
  User,
  Mic,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportFIRToPDF } from "@/lib/pdf-export";

export default function FIRAssistant() {
  const [incidentDetails, setIncidentDetails] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [firData, setFirData] = useState({
    title: "",
    description: "",
    incidentDate: "",
    location: "",
    complainant: "",
    accused: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  });
  const { toast } = useToast();
  const router = useRouter();

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Your browser does not support voice input. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Set to Indian English by default

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setIncidentDetails((prev) => prev ? prev + " " + finalTranscript : finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleAnalyze = async () => {
    if (!incidentDetails.trim()) {
      toast({
        title: "Error",
        description: "Please enter incident details",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/firs/ml-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident_text: incidentDetails
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze incident with ML Service');
      }

      const rawData = await response.json();

      // Adapt ML format to existing component format
      const data = {
        primarySections: rawData.primary_sections?.map((s: any) => ({
          section: s.section,
          description: s.title,
          confidence: s.confidence || (rawData.confidence ? Math.round(rawData.confidence * 100) : 85),
        })) || [],
        secondarySections: rawData.secondary_sections?.map((s: any) => ({
          section: s.section,
          description: s.title,
          confidence: 70,
        })) || [],
        relevantCaseLaws: rawData.similar_cases?.map((c: any) => ({
          title: c.filename.replace(/_/g, " ").replace(/\.PDF$/i, ""),
          citation: c.year ? `Year: ${c.year}` : "Supreme Court",
          relevance: `Category: ${c.category} - ${c.text_preview?.substring(0, 50)}...`
        })) || [],
        recommendations: [
          `Predicted Category: ${rawData.predicted_category} (${(rawData.confidence * 100).toFixed(1)}% match)`,
          "A draft FIR has been automatically generated using the Legal-BERT model",
          "Ensure evidence collection aligns with the suggested primary IPC sections",
          "Identify and secure corroborating witnesses"
        ],
        firDraft: rawData.fir_draft
      };

      setAnalysis(data);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "ML Service Error",
        description: "Failed to analyze incident with AI predicting. Ensure ML service is running.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateFIR = async () => {
    if (!firData.title || !firData.description || !firData.incidentDate || !firData.location || !firData.complainant) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/firs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firData),
      });

      if (!response.ok) {
        throw new Error('Failed to create FIR');
      }

      const createdFIR = await response.json();
      toast({
        title: "Success",
        description: `FIR ${createdFIR.firNumber} created successfully!`,
      });

      // Export PDF
      try {
        // Format sections for PDF export
        const allSections = [
          ...(createdFIR.primarySections || []).map((section: any) => ({
            act: section.section.split(' ')[0], // Extract "IPC" from "IPC 379"
            section: section.section.split(' ')[1], // Extract "379" from "IPC 379"
            title: section.description,
          })),
          ...(createdFIR.secondarySections || []).map((section: any) => ({
            act: section.section.split(' ')[0],
            section: section.section.split(' ')[1],
            title: section.description,
          })),
        ];

        await exportFIRToPDF({
          id: createdFIR.id,
          firNumber: createdFIR.firNumber,
          title: createdFIR.title,
          description: createdFIR.description,
          incidentDate: createdFIR.incidentDate,
          location: createdFIR.location,
          complainant: createdFIR.complainant,
          accused: createdFIR.accused,
          priority: createdFIR.priority,
          status: createdFIR.status,
          sections: allSections,
          createdAt: createdFIR.createdAt,
        });
        toast({
          title: "PDF Downloaded",
          description: "FIR has been saved as PDF",
        });
      } catch (pdfError) {
        console.error('PDF export error:', pdfError);
        toast({
          title: "FIR Created",
          description: "FIR was created but PDF export failed. You can export later from search.",
          variant: "destructive",
        });
      }

      // Reset form
      setIncidentDetails("");
      setAnalysis(null);
      setFirData({
        title: "",
        description: "",
        incidentDate: "",
        location: "",
        complainant: "",
        accused: "",
        priority: "MEDIUM",
      });

      // Optionally redirect to FIR list or details
      router.push('/search?type=firs');
    } catch (error) {
      console.error('FIR creation error:', error);

      let errorMessage = "Failed to create FIR. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          errorMessage = "Session expired. Please sign in again.";
          router.push('/auth/signin');
          return;
        } else if (error.message.includes('validation')) {
          errorMessage = "Invalid data provided. Please check all fields.";
        } else if (error.message.includes('server') || error.message.includes('500')) {
          errorMessage = "Server error. Please try again later.";
        }
      }

      toast({
        title: "Error Creating FIR",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Pre-fill form when analysis is received
  React.useEffect(() => {
    if (analysis && incidentDetails) {
      setFirData({
        title: `FIR - ${incidentDetails.substring(0, 50)}...`,
        description: incidentDetails,
        incidentDate: new Date().toISOString().split('T')[0], // Today's date as default
        location: "",
        complainant: "",
        accused: "",
        priority: "MEDIUM",
      });
    }
  }, [analysis, incidentDetails]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const handleDownloadDraftPDF = async () => {
    if (!analysis) return;

    try {
      // Create a simulated FIRData object from the draft analysis
      const draftFIR = {
        id: "DRAFT-" + Math.floor(Math.random() * 10000).toString(),
        title: firData.title || `FIR Draft - ${incidentDetails.substring(0, 30)}...`,
        description: incidentDetails,
        incidentDate: firData.incidentDate || new Date().toISOString(),
        location: firData.location || "Location not specified yet",
        complainant: firData.complainant || "To be filled",
        accused: firData.accused || "To be filled",
        priority: firData.priority,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        sections: [
          ...(analysis.primarySections || []).map((s: any) => ({
            act: s.section.split(' ')[0] || "IPC",
            section: s.section.split(' ')[1] || s.section,
            title: s.description
          }))
        ]
      };

      await exportFIRToPDF(draftFIR);
      toast({
        title: "PDF Downloaded",
        description: "Your official FIR draft has been downloaded.",
      });
    } catch (error) {
      console.error("PDF Export error:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate the PDF document.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">FIR Assistant</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered legal section recommendation for FIR writing
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Incident Details
              </CardTitle>
              <CardDescription>
                Describe the incident in detail. Include what happened, when,
                where, and who was involved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter the incident details here... For example: 'On 15th January 2024, at around 10:30 PM, the complainant Mr. Raj Kumar reported that unknown persons broke into his house at 123 Main Street and stole jewelry worth Rs. 50,000, cash Rs. 10,000, and a laptop. The incident occurred when the family was away for a wedding...'"
                value={incidentDetails}
                onChange={(e) => setIncidentDetails(e.target.value)}
                className="min-h-32"
              />
              <div className="flex gap-2">
                <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Analyze Incident
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleVoiceInput}
                  variant={isListening ? "destructive" : "secondary"}
                  className="flex items-center gap-2"
                >
                  {isListening ? (
                    <>
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                      Stop Dictation
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Voice Input
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIncidentDetails("")}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Primary Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Primary Legal Sections
                  </CardTitle>
                  <CardDescription>
                    Most applicable sections based on the incident
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.primarySections.map(
                    (section: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div>
                          <p className="font-semibold text-green-800">
                            {section.section}
                          </p>
                          <p className="text-sm text-green-600">
                            {section.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {section.confidence}%
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                `${section.section} - ${section.description}`
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              {/* Secondary Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Secondary Sections
                  </CardTitle>
                  <CardDescription>
                    Additional sections to consider
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.secondarySections.map(
                    (section: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <div>
                          <p className="font-semibold text-orange-800">
                            {section.section}
                          </p>
                          <p className="text-sm text-orange-600">
                            {section.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{section.confidence}%</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                `${section.section} - ${section.description}`
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              {/* Relevant Case Laws */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-blue-600" />
                    Relevant Case Laws
                  </CardTitle>
                  <CardDescription>
                    Landmark judgments related to this case
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.relevantCaseLaws.map(
                    (caselaw: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <p className="font-semibold text-blue-800">
                          {caselaw.title}
                        </p>
                        <p className="text-sm text-blue-600 mb-1">
                          {caselaw.citation}
                        </p>
                        <p className="text-xs text-blue-500">
                          {caselaw.relevance}
                        </p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    Investigation Recommendations
                  </CardTitle>
                  <CardDescription>
                    Suggested steps for thorough investigation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.recommendations.map(
                      (rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                          <span className="text-sm">{rec}</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* FIR Creation Form */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Create FIR
                </CardTitle>
                <CardDescription>
                  Fill in the FIR details based on the analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">FIR Title *</Label>
                    <Input
                      id="title"
                      value={firData.title}
                      onChange={(e) => setFirData({ ...firData, title: e.target.value })}
                      placeholder="Brief title for the FIR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={firData.priority}
                      onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") =>
                        setFirData({ ...firData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incidentDate" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Incident Date & Time *
                    </Label>
                    <Input
                      id="incidentDate"
                      type="datetime-local"
                      value={firData.incidentDate}
                      onChange={(e) => setFirData({ ...firData, incidentDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Location *
                    </Label>
                    <Input
                      id="location"
                      value={firData.location}
                      onChange={(e) => setFirData({ ...firData, location: e.target.value })}
                      placeholder="Incident location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complainant" className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Complainant Name *
                    </Label>
                    <Input
                      id="complainant"
                      value={firData.complainant}
                      onChange={(e) => setFirData({ ...firData, complainant: e.target.value })}
                      placeholder="Name of the complainant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accused">Accused Name(s)</Label>
                    <Input
                      id="accused"
                      value={firData.accused}
                      onChange={(e) => setFirData({ ...firData, accused: e.target.value })}
                      placeholder="Name of accused (if known)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Incident Description *</Label>
                  <Textarea
                    id="description"
                    value={firData.description}
                    onChange={(e) => setFirData({ ...firData, description: e.target.value })}
                    placeholder="Detailed description of the incident"
                    className="min-h-24"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateFIR} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating FIR...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create FIR
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIncidentDetails("");
                      setAnalysis(null);
                      setFirData({
                        title: "",
                        description: "",
                        incidentDate: "",
                        location: "",
                        complainant: "",
                        accused: "",
                        priority: "MEDIUM",
                      });
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Save or export the analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadDraftPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </Button>
                  <Button variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Sections
                  </Button>
                  <Button variant="outline">Save to Case File</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
