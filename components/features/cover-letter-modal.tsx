"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckIcon, CopyIcon, FileTextIcon, AlertCircleIcon, RefreshCwIcon } from "lucide-react";

// Define minimal application shape needed by this modal
interface MinimalApplicationForCoverLetter {
  id: string;
  role: string;
  company: string;
  location?: string;
}

interface CoverLetterModalProps {
  application: MinimalApplicationForCoverLetter;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoverLetterModal({
  application,
  open,
  onOpenChange,
}: CoverLetterModalProps) {
  const [copied, setCopied] = useState(false);
  const [coverLetterContent, setCoverLetterContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchCoverLetter = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setCoverLetterContent("");

    try {
      const response = await fetch(`/api/applications/${application.id}/cover-letter`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true);
        } else {
          setError(data.message || "Failed to fetch cover letter");
        }
        return;
      }

      if (data.success && data.data?.content) {
        setCoverLetterContent(data.data.content);
      } else {
        setError("Invalid response format");
      }
    } catch (err) {
      setError("Network error occurred while fetching cover letter");
      console.error("Error fetching cover letter:", err);
    } finally {
      setIsLoading(false);
    }
  }, [application.id]);

  // Fetch cover letter from API when modal opens
  useEffect(() => {
    if (open && application.id) {
      fetchCoverLetter();
    }
  }, [open, application.id, fetchCoverLetter]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetterContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Cover Letter - {application.role}
          </DialogTitle>
          <DialogDescription>
            {application.company} • Generated cover letter
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto border border-border rounded-md p-6 bg-muted/30">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCoverLetter}
                  className="ml-2"
                >
                  <RefreshCwIcon className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {notFound && (
            <Alert>
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                No cover letter has been generated for this application yet. 
                Cover letters can be generated through the application details page.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && !notFound && coverLetterContent && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {coverLetterContent}
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={handleCopy} 
            className="gap-2"
            disabled={!coverLetterContent || isLoading}
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
