"use client";

import {
  Shield,
  ArrowRight,
  Star,
  FileText,
  Scale,
  Mic,
  Zap,
  TrendingUp,
  Lock,
  CheckCircle,
  Brain,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">NyayaMitra</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-4">
              <Brain className="w-4 h-4 mr-2" />
              Powered by Legal-BERT · AI For Law Enforcement
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">NyayaMitra</span>
              <br />
              <span className="text-3xl md:text-4xl">AI Digital Assistant for Police Stations</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Empowering Investigating Officers (IOs) to draft flawless FIRs. Just speak or write the incident, and get instant, accurate IPC sections and landmark Supreme Court judgments to ensure justice is never compromised.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg shadow-xl hover:shadow-2xl transition-all duration-300">
                  Officer Registration
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:border-blue-500 px-8 py-3 text-lg">
                  Station Login
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Zero Section Errors
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Voice & Text Input
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Valid PDF Export
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Solving the Legal Expert Shortage at Police Stations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Designed specifically to prevent investigation errors and ensure accurate application of law during FIR registration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Flawless FIR Drafting</CardTitle>
                <CardDescription>
                  Automatically identifies and suggests the absolutely correct legal sections (IPC, etc.) based on the complainant's narrative.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Landmark Judgments Database</CardTitle>
                <CardDescription>
                  Instantly find and cite relevant Supreme Court cases that strengthen the investigation right at the FIR stage.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Voice-to-FIR Dictation</CardTitle>
                <CardDescription>
                  Just speak the details of the incident. NyayaMitra converts speech to text and instantly analyzes the legal implications.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Reliable Intelligence for Law Enforcement
            </h2>
            <p className="text-xl text-blue-100">
              Powered by advanced ML trained on real Indian jurisprudence.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">Instant</div>
              <div className="text-blue-100">Section Identification</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">21K+</div>
              <div className="text-blue-100">Supreme Court Precedents</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">110M</div>
              <div className="text-blue-100">Legal-BERT Parameters</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">PDF</div>
              <div className="text-blue-100">Export Ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Equip Your Station with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Ensure every FIR is legally sound. Prevent investigative errors arising from missing sections and lack of immediate legal expertise.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300">
                Register Your Station
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">NyayaMitra</span>
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered legal intelligence platform that combines Legal-BERT classification with comprehensive Indian law databases.
              </p>
              <div className="flex space-x-4">
                <div className="text-sm text-gray-400">
                  © 2026 NyayaMitra. Built with ❤️ for the legal community.
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>FIR Assistant</li>
                <li>Case Classifier</li>
                <li>Legal Database</li>
                <li>Voice Input</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
