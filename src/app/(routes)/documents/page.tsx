/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Search,
  Sparkles,
  Calendar,
  Globe,
  Type,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { secret_keys } from "@/actions/api-key";

type UploadType = "pdf" | "docx" | "txt" | "website" | "text";

interface RagDocument {
  id: string;
  name: string;
  type: string;
  created_at: string;
  status: string;
  metadata?: any;
}

export default function Documents() {
  const [uploadType, setUploadType] = useState<UploadType>("pdf");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<RagDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [plainText, setPlainText] = useState("");
  const [ragId, setRagId] = useState("");
  const [apiKey, setApiKey] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  useEffect(() => {
    if (ragId && apiKey) {
      fetchDocuments();
    }
  }, [ragId, apiKey]);

  const loadApiKeys = async () => {
    try {
      const keys = await secret_keys();
      setApiKey(keys.lyzr_api_key);
      setRagId(keys.lyzr_rag_id);
    } catch (error) {
      console.error("Failed to load API keys:", error);
      toast.error("Failed to load configuration");
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/train?ragId=${ragId}&apiKey=${apiKey}`
      );
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      
      // Transform string array to document objects
      if (Array.isArray(data)) {
        const transformedDocs = data.map((name: string) => {
          // Extract file extension as type
          const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() : 'unknown';
          
          return {
            id: name,
            name: name,
            type: extension || 'unknown',
            created_at: new Date().toISOString(),
            status: 'active',
            metadata: {}
          };
        });
        setDocuments(transformedDocs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!ragId || !apiKey) {
      toast.error("Missing configuration. Please check your environment variables.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("type", uploadType);
    formData.append("ragId", ragId);
    formData.append("apiKey", apiKey);
    formData.append("file", file);

    try {
      const response = await fetch("/api/train", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      // const result = await response.json();
      toast.success(`${file.name} uploaded and trained successfully!`);
      setShowUploadDialog(false);
      await fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleWebsiteSubmit = async () => {
    if (!websiteUrl || !ragId || !apiKey) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("type", "website");
    formData.append("ragId", ragId);
    formData.append("apiKey", apiKey);
    formData.append("url", websiteUrl);

    try {
      const response = await fetch("/api/train", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add website");
      }

      toast.success("Website content added and trained successfully!");
      setWebsiteUrl("");
      setShowUploadDialog(false);
      await fetchDocuments();
    } catch (error) {
      console.error("Website submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add website");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!plainText || !ragId || !apiKey) {
      toast.error("Please enter some text");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("type", "text");
    formData.append("ragId", ragId);
    formData.append("apiKey", apiKey);
    formData.append("text", plainText);

    try {
      const response = await fetch("/api/train", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add text");
      }

      toast.success("Text content added and trained successfully!");
      setPlainText("");
      setShowUploadDialog(false);
      await fetchDocuments();
    } catch (error) {
      console.error("Text submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add text");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDoc || !ragId || !apiKey) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/train?ragId=${ragId}&apiKey=${apiKey}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentNames: [selectedDoc.name]
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete document");
      }

      toast.success(`${selectedDoc.name} deleted successfully!`);
      setShowDeleteDialog(false);
      setShowAnalysis(false);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "active":
        return "default";
      case "pending":
      case "processing":
        return "secondary";
      case "error":
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // const getUploadIcon = (type: UploadType) => {
  //   switch (type) {
  //     case "website":
  //       return <Globe className="h-5 w-5" />;
  //     case "text":
  //       return <Type className="h-5 w-5" />;
  //     default:
  //       return <FileText className="h-5 w-5" />;
  //   }
  // };

  const filteredDocuments = documents.filter((doc) =>
    doc.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Document Management</h1>
            <p className="mt-2 text-muted-foreground">
              Upload and manage regulatory documents in your knowledge base
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4" />
            Add Content
          </Button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <CardTitle className="mb-2">No documents yet</CardTitle>
            <CardDescription>
              Upload your first document to get started
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="hover-lift h-full">
                <CardHeader>
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant={getStatusColor(doc.status) as any}>
                      {doc.status || "active"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{doc.name}</CardTitle>
                  <CardDescription className="flex flex-col gap-1">
                    <span className="capitalize">{doc.type}</span>
                    <span className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 inline-flex gap-x-2">
                  <Button
                    variant="secondary"
                    className="gap-2 w-[49%]"
                    onClick={() => {
                      setSelectedDoc(doc);
                      setShowAnalysis(true);
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-[49%] gap-2"
                    onClick={() => {
                      setSelectedDoc(doc);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Content to Knowledge Base</DialogTitle>
            <DialogDescription>
              Choose the type of content you want to add
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Type Selection */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { value: "pdf", label: "PDF", icon: FileText },
                { value: "docx", label: "DOCX", icon: FileText },
                { value: "txt", label: "TXT", icon: FileText },
                { value: "website", label: "Website", icon: Globe },
                { value: "text", label: "Text", icon: Type },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={uploadType === type.value ? "default" : "outline"}
                  className="flex flex-col h-20 gap-2"
                  onClick={() => setUploadType(type.value as UploadType)}
                >
                  <type.icon className="h-5 w-5" />
                  <span className="text-xs">{type.label}</span>
                </Button>
              ))}
            </div>

            {/* Upload Forms */}
            {["pdf", "docx", "txt"].includes(uploadType) && (
              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={uploadType === "pdf" ? ".pdf" : uploadType === "docx" ? ".docx,.doc" : ".txt"}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Card className="border-2">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                      <Loader2 className="h-12 w-12 text-primary mb-3 animate-spin" />
                      <p className="text-sm font-medium">
                        Uploading and training document...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please wait while we process your file
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    className="border-dashed border-2 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-8">
                      <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">
                        Click to upload {uploadType.toUpperCase()} file
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        or drag and drop
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {uploadType === "website" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Website URL
                  </label>
                  <Input
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleWebsiteSubmit}
                  disabled={isUploading || !websiteUrl}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Add Website
                    </>
                  )}
                </Button>
              </div>
            )}

            {uploadType === "text" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Plain Text Content
                  </label>
                  <Textarea
                    placeholder="Enter or paste your text content here..."
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleTextSubmit}
                  disabled={isUploading || !plainText}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Type className="h-4 w-4 mr-2" />
                      Add Text
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Details Modal */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Document Details
            </DialogTitle>
            <DialogDescription>{selectedDoc?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Type:</span>
                <p className="mt-1 capitalize">{selectedDoc?.type}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <div className="mt-1">
                  <Badge variant={getStatusColor(selectedDoc?.status || "") as any}>
                    {selectedDoc?.status || "active"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Created:</span>
                <p className="mt-1">
                  {selectedDoc?.created_at
                    ? new Date(selectedDoc.created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">ID:</span>
                <p className="mt-1 text-xs font-mono truncate">{selectedDoc?.id}</p>
              </div>
            </div>

            {/* {selectedDoc?.metadata && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Metadata:</span>
                <Card className="mt-2">
                  <CardContent className="p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedDoc.metadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )} */}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedDoc?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
