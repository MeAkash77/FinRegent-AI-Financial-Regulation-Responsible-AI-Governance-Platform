"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserProfile, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark, experimental__simple } from "@clerk/themes";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const theme = useTheme();
  const userId = useUser();
  const { toast } = useToast();
  const [cronJobEnabled, setCronJobEnabled] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  console.log(userId)

  // Fetch current cron job status only once on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/cron");
        if (response.ok) {
          const data = await response.json();
          setCronJobEnabled(data.cronJobEnabled);
          setSourceUrl(data.sourceUrl || "");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load cron job settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Update cron job status
  const handleCronToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/settings/cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cronJobEnabled: checked,
          sourceUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCronJobEnabled(data.cronJobEnabled);
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update cron job settings",
        variant: "destructive",
      });
      // Revert the toggle
      setCronJobEnabled(!checked);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update source URL
  const handleSourceUrlUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/settings/cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cronJobEnabled,
          sourceUrl,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Source URL updated successfully",
        });
      } else {
        throw new Error("Failed to update source URL");
      }
    } catch (error) {
      console.error("Error updating source URL:", error);
      toast({
        title: "Error",
        description: "Failed to update source URL",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your preferences and account settings
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <UserProfile
              routing="hash"
              appearance={{
                baseTheme: theme.theme === "dark" ? dark : experimental__simple,
                elements: {
                  rootBox: "w-full",
                  card: "border shadow-sm w-full",
                  scrollBox: "w-full",
                  navbar: "w-full",
                  pageScrollBox: "w-full",
                }
              }}
            />
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Activate Cron Job
                </CardTitle>
                <CardDescription>
                  Enable automatic link extraction and KB training (runs every 2 weeks)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cron-job">Enable Cron Job</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically extract links and train knowledge base every 2 weeks
                    </p>
                  </div>
                  <Switch
                    id="cron-job"
                    checked={cronJobEnabled}
                    onCheckedChange={handleCronToggle}
                    disabled={isLoading || isUpdating}
                  />
                </div>
                
                {cronJobEnabled && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="source-url">Source URL</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      URL to extract links from for KB training
                    </p>
                    <div className="flex gap-2">
                      <Input
                        id="source-url"
                        type="url"
                        placeholder="https://example.com/docs"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        disabled={isLoading || isUpdating}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSourceUrlUpdate}
                        disabled={isLoading || isUpdating || !sourceUrl.trim()}
                        size="sm"
                      >
                        Update
                      </Button>
                    </div>
                    {sourceUrl && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Current URL will be used for the next scheduled extraction
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
