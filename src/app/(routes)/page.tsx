"use client"

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Brain, 
  Shield, 
  Zap,
  ArrowRight,
  Sparkles,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Agentic RAG Framework",
    description: "Multi-agent reasoning with real-time regulatory intelligence"
  },
  {
    icon: Shield,
    title: "Unified Knowledge Intelligence",
    description: "Seamlessly integrate RBI, SEBI, and internal policies"
  },
  {
    icon: Zap,
    title: "Autonomous Reasoning",
    description: "Self-improving compliance workflows with explainable AI"
  }
];

const stats = [
  { 
    label: "Total Documents", 
    value: "1,234", 
    change: "+12.5%",
    trend: "up",
    icon: Activity
  },
  { 
    label: "Risk Alerts", 
    value: "48", 
    change: "-8.2%",
    trend: "down",
    icon: AlertTriangle
  },
  { 
    label: "Compliance Rate", 
    value: "94.8%", 
    change: "+2.3%",
    trend: "up",
    icon: CheckCircle2
  },
  { 
    label: "Avg Response Time", 
    value: "2.4s", 
    change: "-15%",
    trend: "down",
    icon: Clock
  }
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-y-auto bg-background">
      {/* Hero Section with Gradient Background */}
      <section className="relative overflow-hidden">
        {/* Gradient orb effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
        
        <div className="container relative z-10 mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-5xl text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Powered by Agentic AI</span>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Give your big idea the{" "}
              <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                design it deserves
              </span>
            </h1>

            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Empowering compliance teams with real-time, explainable intelligence.
              <br className="hidden md:block" />
              Transform your financial governance with AI-powered insights.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/workspace">
                <Button size="lg" className="gap-2 shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Dashboard */}
      {/* <section className="border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-border bg-card hover:bg-accent/5 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <h3 className="text-3xl font-bold tracking-tight">
                            {stat.value}
                          </h3>
                          <span className={`text-sm font-medium ${
                            stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20 px-10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Built for Modern Compliance
            </h2>
            <p className="text-lg text-muted-foreground">
              Next-generation intelligence for financial institutions
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group h-full border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card/30 py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to transform your compliance workflow?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join leading financial institutions using FinRegent for AI-powered governance.
            </p>
            <Link href="/workspace">
              <Button size="lg" className="gap-2 shadow-lg">
                Ask FinRegent
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">FinRegent</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Agentic AI for Financial Governance & Compliance
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
