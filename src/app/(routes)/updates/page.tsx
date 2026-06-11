/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Filter,
  Building2,
  Scale,
  AlertCircle,
  Loader2,
  RefreshCw,
  Link,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";

interface Update {
  id: string;
  title: string;
  source: "RBI" | "SEBI" | "IRDAI";
  severity: "low" | "medium" | "critical";
  date: string;
  summary: string;
  category: string;
  citationUrl: string;
}

const CACHE_KEY = "regulatory_updates_cache";
const CACHE_TIMESTAMP_KEY = "regulatory_updates_timestamp";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function Updates() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);
  const [filter, setFilter] = useState<"all" | "RBI" | "SEBI">("all");
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load updates from cache
  const loadFromCache = (): Update[] | null => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        // Check if cache is still valid (within 24 hours)
        if (now - timestamp < CACHE_DURATION) {
          return JSON.parse(cachedData);
        }
      }
    } catch (error) {
      console.error("Error loading from cache:", error);
    }
    return null;
  };

  // Save updates to cache
  const saveToCache = (data: Update[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  };

  // Fetch regulatory updates from Lyzr agent
  const fetchUpdates = async (forceRefresh = false) => {
    if (!user?.id) return;

    // If not forcing refresh, try to load from cache first
    if (!forceRefresh) {
      const cachedUpdates = loadFromCache();
      if (cachedUpdates && cachedUpdates.length > 0) {
        setUpdates(cachedUpdates);
        setIsLoading(false);
        return;
      }
    }

    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Call the API route
      const response = await fetch("/api/updates");

      if (!response.ok) {
        throw new Error("Failed to fetch updates");
      }

      const data = await response.json();

      if (data.success && data.updates && data.updates.length > 0) {
        setUpdates(data.updates);
        saveToCache(data.updates);

        if (forceRefresh) {
          toast({
            title: "Updates refreshed",
            description: `Successfully fetched ${data.count} regulatory updates`,
          });
        }
      } else {
        toast({
          title: "No updates found",
          description: "Could not fetch regulatory updates at this time.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching updates:", error);
      toast({
        title: "Error",
        description: "Failed to fetch regulatory updates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load updates on mount
  useEffect(() => {
    fetchUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchUpdates(true);
  };

  const filteredUpdates =
    filter === "all"
      ? updates
      : updates.filter((u) => u.source === filter);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Regulatory Updates</h1>
            <p className="mt-2 text-muted-foreground">
              Stay informed about the latest compliance changes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Updates List */}
        <div className="lg:col-span-2">
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as any)}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="all">All Sources</TabsTrigger>
              <TabsTrigger value="RBI" className="gap-2">
                <Building2 className="h-4 w-4" />
                RBI
              </TabsTrigger>
              <TabsTrigger value="SEBI" className="gap-2">
                <Scale className="h-4 w-4" />
                SEBI
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUpdates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  No regulatory updates found
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUpdates.map((update, idx) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card
                    className="hover-lift cursor-pointer"
                    onClick={() => setSelectedUpdate(update)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge
                              variant={getSeverityColor(update.severity) as any}
                            >
                              {update.severity}
                            </Badge>
                            <Badge variant="outline">{update.source}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.date).toLocaleDateString()}
                            </span>
                          </div>
                          <CardTitle className="text-lg">
                            {update.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {update.summary}
                          </CardDescription>
                        </div>
                        {update.severity === "critical" && (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            {selectedUpdate ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="mb-3 flex items-center gap-2">
                      <Badge
                        variant={
                          getSeverityColor(selectedUpdate.severity) as any
                        }
                      >
                        {selectedUpdate.severity}
                      </Badge>
                      <Badge variant="outline">{selectedUpdate.source}</Badge>
                    </div>
                    <CardTitle className="text-xl">
                      {selectedUpdate.title}
                    </CardTitle>
                    <CardDescription>
                      Published{" "}
                      {new Date(selectedUpdate.date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedUpdate.summary}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Category</h4>
                      <Badge variant="secondary">
                        {selectedUpdate.category}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Impact Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        This regulation affects customer onboarding processes
                        and requires updates to internal compliance workflows
                        within 90 days.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        window.open(selectedUpdate.citationUrl, "_blank");
                      }}
                      className="w-full gap-2"
                    >
                      <Link className="h-4 w-4" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="flex h-64 items-center justify-center">
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Select an update to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
