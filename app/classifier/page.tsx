"use client";

import { useState } from "react";
import {
    Brain,
    FileText,
    Upload,
    Loader2,
    Scale,
    BarChart3,
    BookOpen,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface ClassificationResult {
    label: string;
    confidence: number;
    text: string;
    all_predictions?: Array<{ label: string; confidence: number }>;
    similar_judgements?: Array<{
        filename: string;
        year: number | null;
        text_preview: string;
        category: string;
        source: string;
    }>;
}

const CATEGORY_COLORS: Record<string, string> = {
    "Criminal Appeal": "bg-red-500",
    "Constitutional Matter": "bg-blue-500",
    "Property Dispute": "bg-amber-500",
    "Contract Law": "bg-green-500",
    "Family Law": "bg-pink-500",
    "Taxation Matter": "bg-purple-500",
    "Service Matter": "bg-cyan-500",
    "Corporate Law": "bg-indigo-500",
    "Bail Application": "bg-orange-500",
};

const SAMPLE_TEXTS = [
    {
        title: "Criminal Appeal Example",
        text: "The appellant was convicted under Section 302 of IPC for murder. The trial court relied on circumstantial evidence including recovery of weapon and eyewitness testimony. The defense argued that the identification parade was conducted improperly.",
    },
    {
        title: "Property Dispute Example",
        text: "The plaintiff claims ownership of agricultural land in survey number 45. The respondent has encroached upon the property and constructed a boundary wall. The plaintiff seeks a decree of injunction and restoration of possession.",
    },
    {
        title: "Taxation Matter Example",
        text: "The assessee challenges the reassessment order under Section 147 of the Income Tax Act. The Assessing Officer reopened the assessment after four years alleging that income had escaped assessment due to failure to disclose material facts.",
    },
];

export default function ClassifierPage() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ClassificationResult | null>(null);
    const [error, setError] = useState("");

    const handleClassify = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/classifier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
            }
        } catch {
            setError("Failed to connect to classification service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
                <SidebarTrigger />
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Brain className="h-6 w-6 text-purple-500" />
                        AI Case Classifier
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Classify legal documents into 9 categories using our Legal-BERT model
                    </p>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Input Section */}
                    <Card className="border-2 border-dashed border-purple-200 dark:border-purple-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Enter Legal Text
                            </CardTitle>
                            <CardDescription>
                                Paste a legal document, judgment excerpt, or case description to classify it
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                className="w-full h-40 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-background text-foreground"
                                placeholder="Paste legal text here..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                                <Button
                                    onClick={handleClassify}
                                    disabled={loading || !text.trim()}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 mr-2" />
                                    )}
                                    {loading ? "Classifying..." : "Classify Text"}
                                </Button>
                                <span className="text-xs text-muted-foreground">or try a sample:</span>
                                {SAMPLE_TEXTS.map((sample) => (
                                    <Button
                                        key={sample.title}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setText(sample.text)}
                                    >
                                        {sample.title}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error */}
                    {error && (
                        <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
                            <CardContent className="pt-6">
                                <p className="text-red-600 dark:text-red-400">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Top Prediction */}
                            <Card className="overflow-hidden">
                                <div
                                    className={`h-2 ${CATEGORY_COLORS[result.label] || "bg-gray-500"}`}
                                />
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl">{result.label}</CardTitle>
                                            <CardDescription>Predicted Category</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-purple-600">
                                                {(result.confidence * 100).toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">Confidence</div>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* All Category Scores */}
                            {result.all_predictions && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5" />
                                            Category Scores
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {result.all_predictions.map((pred) => (
                                                <div key={pred.label} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">{pred.label}</span>
                                                        <span className="text-muted-foreground">
                                                            {(pred.confidence * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${pred.label === result.label
                                                                    ? CATEGORY_COLORS[pred.label] || "bg-purple-500"
                                                                    : "bg-muted-foreground/30"
                                                                }`}
                                                            style={{ width: `${pred.confidence * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Similar Judgements */}
                            {result.similar_judgements && result.similar_judgements.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5" />
                                            Similar Supreme Court Judgements
                                        </CardTitle>
                                        <CardDescription>
                                            From our database of 21,000+ Supreme Court cases
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {result.similar_judgements.map((j, i) => (
                                                <div
                                                    key={i}
                                                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">
                                                                {j.filename.replace(/_/g, " ").replace(/\.PDF$/i, "")}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                {j.text_preview}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {j.year && (
                                                                <Badge variant="outline">{j.year}</Badge>
                                                            )}
                                                            <Badge variant="secondary">{j.source}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
