"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, FileTextIcon } from "lucide-react";
import { type Application } from "@/lib/data/job-applications-data";

interface CoverLetterModalProps {
  application: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoverLetterModal({
  application,
  open,
  onOpenChange,
}: CoverLetterModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate a sample cover letter based on application data
  const generateCoverLetter = () => {
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${application.role} position at ${application.company}. With my extensive experience in software development and passion for innovative technology solutions, I am confident that I would be a valuable addition to your team.

Throughout my career, I have developed a deep expertise in modern web technologies and best practices. My experience aligns perfectly with the requirements outlined in your job description, and I am particularly excited about the opportunity to contribute to ${application.company}'s mission.

Key highlights of my qualifications include:

• Proven track record of delivering high-quality software solutions
• Strong proficiency in modern development frameworks and tools
• Excellent problem-solving and analytical skills
• Collaborative team player with strong communication abilities
• Commitment to continuous learning and professional development

I am particularly drawn to ${application.company} because of your reputation for innovation and excellence in the industry. The ${application.role} position represents an ideal opportunity for me to leverage my skills while continuing to grow professionally.

${application.location ? `I am excited about the opportunity to work in ${application.location} and contribute to your team's success.` : "I am excited about the opportunity to contribute to your team's success."}

I would welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to ${application.company}'s continued success. Thank you for considering my application.

Sincerely,
[Your Name]`;
  };

  const coverLetterContent = generateCoverLetter();

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
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {coverLetterContent}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopy} className="gap-2">
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
