"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  ArrowRight,
  FileText,
  Scale,
  Mic,
  CheckCircle,
  Brain,
  BookOpen,
  Sparkles,
  ChevronRight,
  Zap,
  Lock,
  Globe,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const num = parseInt(target.replace(/[^0-9]/g, ""));
    if (isNaN(num)) {
      setDisplay(target);
      return;
    }

    let current = 0;
    const increment = Math.ceil(num / 40);
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        clearInterval(timer);
        setDisplay(target);
      } else {
        setDisplay(current.toLocaleString());
      }
    }, 30);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{display}{suffix}</span>;
}

export function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navigation ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm -z-10" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">NyayaMitra</span>
                <span className="hidden sm:inline text-xs text-muted-foreground ml-2 font-medium">AI Legal Intelligence</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                  Get Started
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-gentle-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-gentle-pulse animation-delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl animate-gentle-pulse animation-delay-2000" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 glass-card text-sm font-medium text-muted-foreground mb-8 ${mounted ? 'animate-slide-down' : 'opacity-0'}`}>
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Powered by Legal-BERT · AI For Law Enforcement</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>

          {/* Headline */}
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
            <span className="gradient-text-primary">NyayaMitra</span>
            <br />
            <span className="text-foreground text-3xl sm:text-4xl lg:text-5xl font-bold">
              AI Digital Assistant for
            </span>
            <br />
            <span className="text-foreground text-3xl sm:text-4xl lg:text-5xl font-bold">
              Police Stations
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10 ${mounted ? 'animate-slide-up animation-delay-200' : 'opacity-0'}`}>
            Empowering Investigating Officers to draft flawless FIRs. Speak or write the incident, 
            and get instant, accurate IPC sections and landmark Supreme Court judgments.
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-14 ${mounted ? 'animate-slide-up animation-delay-300' : 'opacity-0'}`}>
            <Link href="/auth/signup">
              <Button size="lg" className="h-13 px-8 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:-translate-y-1 group">
                Officer Registration
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="h-13 px-8 text-base border-border/60 hover:bg-accent/50 transition-all duration-300 hover:-translate-y-0.5">
                Station Login
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className={`flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground ${mounted ? 'animate-fade-in animation-delay-500' : 'opacity-0'}`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Zero Section Errors</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Voice & Text Input</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Valid PDF Export</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>21K+ Case Laws</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────── */}
      <section className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 mb-4">
              <Zap className="w-3.5 h-3.5" />
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Solving the Legal Expert Shortage
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Designed to prevent investigation errors and ensure accurate application of law during FIR registration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {[
              {
                icon: FileText,
                title: "Flawless FIR Drafting",
                description: "Auto-identifies correct legal sections (IPC/BNS) based on the complainant's narrative with AI-powered analysis.",
                gradient: "from-blue-500 to-cyan-500",
                shadowColor: "shadow-blue-500/20",
              },
              {
                icon: Scale,
                title: "Landmark Judgments",
                description: "Instantly find and cite relevant Supreme Court cases that strengthen the investigation right at the FIR stage.",
                gradient: "from-emerald-500 to-teal-500",
                shadowColor: "shadow-emerald-500/20",
              },
              {
                icon: Mic,
                title: "Voice-to-FIR Dictation",
                description: "Just speak the details. NyayaMitra converts speech to text and instantly analyzes the legal implications.",
                gradient: "from-purple-500 to-pink-500",
                shadowColor: "shadow-purple-500/20",
              },
              {
                icon: Brain,
                title: "Legal-BERT Classification",
                description: "Fine-tuned BERT model trained on Indian legal corpus for precise section classification and case matching.",
                gradient: "from-amber-500 to-orange-500",
                shadowColor: "shadow-amber-500/20",
              },
              {
                icon: Globe,
                title: "Multi-Language Support",
                description: "Voice input in Hindi, English, and regional languages with instant translation and legal terminology mapping.",
                gradient: "from-rose-500 to-red-500",
                shadowColor: "shadow-rose-500/20",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Comprehensive reporting system with FIR statistics, section usage trends, and officer performance metrics.",
                gradient: "from-indigo-500 to-violet-500",
                shadowColor: "shadow-indigo-500/20",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative glass-card glass-card-hover rounded-2xl p-6 overflow-hidden"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-2xl`} />
                
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg ${feature.shadowColor} transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-400 border border-purple-500/20 bg-purple-500/5 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From incident description to a legally sound FIR in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30" />
            
            {[
              {
                step: "01",
                title: "Describe the Incident",
                description: "Type or dictate the complainant's account of the incident using voice-to-text in your preferred language.",
                icon: Mic,
                color: "text-indigo-400",
                borderColor: "border-indigo-500/30",
                bgColor: "bg-indigo-500/10",
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Legal-BERT classifies the crime category and identifies applicable IPC/BNS sections with confidence scores.",
                icon: Brain,
                color: "text-purple-400",
                borderColor: "border-purple-500/30",
                bgColor: "bg-purple-500/10",
              },
              {
                step: "03",
                title: "Generate FIR",
                description: "Review the AI-suggested sections, relevant case laws, and download a complete, legally valid FIR as PDF.",
                icon: FileText,
                color: "text-pink-400",
                borderColor: "border-pink-500/30",
                bgColor: "bg-pink-500/10",
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className={`w-14 h-14 mx-auto rounded-2xl ${step.bgColor} border ${step.borderColor} flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110`}>
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>
                <div className={`inline-block font-mono text-xs font-bold ${step.color} mb-2`}>
                  STEP {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Section ──────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Reliable Intelligence for Law Enforcement
            </h2>
            <p className="text-muted-foreground text-lg">
              Powered by advanced ML trained on real Indian jurisprudence.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-children">
            {[
              { value: "Instant", label: "Section Identification" },
              { value: "21K+", label: "Supreme Court Precedents" },
              { value: "110M", label: "Legal-BERT Parameters" },
              { value: "PDF", label: "Export Ready" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 text-center group hover:border-primary/20 transition-all duration-300">
                <div className="text-3xl sm:text-4xl font-bold gradient-text-primary mb-2">
                  {mounted ? <AnimatedCounter target={stat.value} /> : stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security & Trust ───────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
            
            <div className="relative">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
                <Lock className="h-7 w-7 text-white" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Equip Your Station with AI
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Ensure every FIR is legally sound. Prevent investigative errors arising from missing sections 
                and lack of immediate legal expertise.
              </p>

              <Link href="/auth/signup">
                <Button size="lg" className="h-13 px-10 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:-translate-y-1 group">
                  Register Your Station
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">NyayaMitra</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4 max-w-md">
                AI-powered legal intelligence platform combining Legal-BERT classification 
                with comprehensive Indian law databases for accurate FIR assistance.
              </p>
              <p className="text-xs text-muted-foreground/60">
                © {new Date().getFullYear()} NyayaMitra. Built with ❤️ for the legal community.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Features</h3>
              <ul className="space-y-2.5 text-sm">
                {["FIR Assistant", "Case Classifier", "Legal Database", "Voice Input", "Reports"].map((item) => (
                  <li key={item}>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Support</h3>
              <ul className="space-y-2.5 text-sm">
                {["Help Center", "Documentation", "Contact Us", "Privacy Policy"].map((item) => (
                  <li key={item}>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
