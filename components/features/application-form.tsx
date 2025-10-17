"use client";

import { useState } from "react";
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
import {
  CalendarIcon,
  BuildingIcon,
  BriefcaseIcon,
  FileTextIcon,
  UploadIcon,
} from "lucide-react";

interface ApplicationFormProps {
  application?: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Application>) => void;
  mode?: "create" | "edit" | "status";
}

export function ApplicationForm({
  application,
  open,
  onOpenChange,
  onSubmit,
  mode = "create",
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
    deadline:
      application?.deadline || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks default
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  const handleChange = (field: keyof Application, value: string | Date | ApplicationStatus) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
              >
                Cancel
              </Button>
              <Button type="submit">Update Status</Button>
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
          <div className="space-y-4 py-4">
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
              />
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Select
                  value={formData.jobType}
                  onValueChange={(value) => handleChange("jobType", value)}
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
              />
            </div>

            {/* Deadline */}
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
              />

              <p className="text-xs text-muted-foreground">
                Default is 4 weeks from today. You&apos;ll receive reminders as the
                deadline approaches.
              </p>
            </div>

            {/* Resume Upload (placeholder) */}
            <div className="space-y-2">
              <Label htmlFor="resume">
                <UploadIcon className="h-4 w-4 inline mr-2" />
                Resume
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your resume (PDF, DOC, DOCX)
              </p>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === "create" ? "Add Application" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
