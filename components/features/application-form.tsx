"use client";

import { useState, useEffect } from "react";
import {
  type Application,
  type ApplicationStatus,
} from "@/lib/data/job-applications-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  BuildingIcon,
  BriefcaseIcon,
  FileTextIcon,
  UploadIcon,
  LoaderIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { uploadApi } from "@/lib/api-client";
import { toast } from "sonner";

interface ApplicationFormProps {
  application?: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Application>) => void;
  mode?: "create" | "edit" | "status";
  loading?: boolean;
}

export function ApplicationForm({
  application,
  open,
  onOpenChange,
  onSubmit,
  mode = "create",
  loading = false,
}: ApplicationFormProps) {
  const [formData, setFormData] = useState<Partial<Application>>({
    company: application?.company || "",
    role: application?.role || "",
    jobDescription: application?.jobDescription || "",
    location: application?.location || "",
    jobType: application?.jobType || "Full-time",
    salary: application?.salary || "",
    status: application?.status || "Active",
    notes: application?.notes || "",
    resumeUrl: application?.resumeUrl || "",
    deadline:
      application?.deadline || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks default
  });

  // File upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // Check if resume is uploaded to enable/disable other fields
  const isResumeUploaded = Boolean(formData.resumeUrl && uploadedFileName);
  const areFieldsEnabled = isResumeUploaded || uploadLoading;

  // Clear form data when dialog closes (for create mode)
  useEffect(() => {
    if (!open && mode === "create") {
      setFormData({
        company: "",
        role: "",
        jobDescription: "",
        location: "",
        jobType: "Full-time",
        salary: "",
        status: "Active",
        notes: "",
        resumeUrl: "",
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks default
      });
      setUploadedFileName(null);
    }
  }, [open, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
    
    // Validate that a resume is uploaded
    if (!formData.resumeUrl || !uploadedFileName) {
      toast.error('Please upload a resume before submitting');
      return;
    }
    
    onSubmit(formData);
  };

  const handleChange = (field: keyof Application, value: string | Date | ApplicationStatus) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only DOC or DOCX files');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadLoading(true);
    
    try {
      const response = await uploadApi.uploadFile(file, 'resume');
      
      if (response.success && response.data) {
        const uploadData = response.data as { url: string; filename: string; size: number; contentType: string };
        setFormData(prev => ({ ...prev, resumeUrl: uploadData.url }));
        setUploadedFileName(file.name);
        toast.success('Resume uploaded successfully');
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload resume');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, resumeUrl: "" }));
    setUploadedFileName(null);
    // Clear the file input
    const fileInput = document.getElementById('resume') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Status update mode - simplified form
  if (mode === "status") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Update the status of your application to {application?.company}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleChange("status", value as ApplicationStatus)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Interview">
                      Interview Scheduled
                    </SelectItem>
                    <SelectItem value="Offer">Offer Received</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === "Interview" && (
                <div className="space-y-2">
                  <Label htmlFor="interviewDate">
                    Interview Date (Optional)
                  </Label>
                  <Input
                    id="interviewDate"
                    type="datetime-local"
                    onChange={(e) =>
                      handleChange("interviewDate", new Date(e.target.value))
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this status update..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Full form for create/edit
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Application" : "Edit Application"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Track a new job application. All fields marked with * are required."
              : "Update your application details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Required Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">Required Information</h3>
                <Separator className="flex-1" />
              </div>
              
              {/* Resume Upload */}
              <div className="space-y-2">
                <Label htmlFor="resume">
                  <UploadIcon className="h-4 w-4 inline mr-2" />
                  Resume *
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="resume"
                    type="file"
                    accept=".doc,.docx"
                    className="flex-1"
                    onChange={handleFileChange}
                    disabled={uploadLoading}
                    required
                  />
                  {uploadedFileName && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveFile}
                      disabled={uploadLoading}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {uploadLoading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
                {uploadedFileName && !uploadLoading && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckIcon className="h-4 w-4" />
                    {uploadedFileName}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload your resume (DOC, DOCX only) - Required
                </p>
                {!areFieldsEnabled && (
                  <p className="text-xs text-amber-600 font-medium">
                    Please upload your resume first to enable other fields
                  </p>
                )}
                {uploadLoading && (
                  <p className="text-xs text-blue-600 font-medium">
                    Resume uploading... You can fill out other fields while waiting
                  </p>
                )}
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company">
                  <BuildingIcon className="h-4 w-4 inline mr-2" />
                  Company Name *
                </Label>
                <Input
                  id="company"
                  placeholder="e.g., TechCorp"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  required
                  disabled={!areFieldsEnabled}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  <BriefcaseIcon className="h-4 w-4 inline mr-2" />
                  Job Title *
                </Label>
                <Input
                  id="role"
                  placeholder="e.g., Senior Frontend Engineer"
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  required
                  disabled={!areFieldsEnabled}
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="jobDescription">
                  <FileTextIcon className="h-4 w-4 inline mr-2" />
                  Job Description *
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description or key requirements..."
                  value={formData.jobDescription}
                  onChange={(e) => handleChange("jobDescription", e.target.value)}
                  rows={4}
                  required
                  disabled={!areFieldsEnabled}
                />
              </div>

              {/* Application Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline">
                  <CalendarIcon className="h-4 w-4 inline mr-2" />
                  Application Deadline *
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={
                    formData.deadline instanceof Date
                      ? formData.deadline.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleChange("deadline", new Date(e.target.value))
                  }
                  required
                  disabled={!areFieldsEnabled}
                />

                <p className="text-xs text-muted-foreground">
                  Default is 4 weeks from today. You&apos;ll receive reminders as the
                  deadline approaches.
                </p>
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">Optional Information</h3>
                <Separator className="flex-1" />
              </div>

              {/* Location and Job Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Remote, NYC"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    disabled={!areFieldsEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) => handleChange("jobType", value)}
                    disabled={!areFieldsEnabled}
                  >
                    <SelectTrigger id="jobType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Salary */}
              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input
                  id="salary"
                  placeholder="e.g., $120k - $150k"
                  value={formData.salary}
                  onChange={(e) => handleChange("salary", e.target.value)}
                  disabled={!areFieldsEnabled}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes or reminders..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                  disabled={!areFieldsEnabled}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isResumeUploaded}>
              {loading ? (
                <>
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "create" ? "Adding..." : "Saving..."}
                </>
              ) : uploadLoading ? (
                <>
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                  Uploading Resume...
                </>
              ) : (
                mode === "create" ? "Add Application" : "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
