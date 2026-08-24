"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ReportModalProps {
  userName: string;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Inappropriate content",
  "Harassment or abuse",
  "Spam",
  "Impersonation",
  "Underage user",
  "Sexual content",
  "Other",
];

export function ReportModal({ userName, onSubmit, onClose }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  const handleSubmit = () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason;
    if (!reason) {
      alert("Please select a reason");
      return;
    }
    onSubmit(reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-b from-background to-background/95 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-bold">Report {userName}</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Help us keep PiAzar safe. Tell us what's wrong.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full p-3 text-left rounded-lg font-medium transition ${
                selectedReason === reason
                  ? "bg-red-500/20 border-2 border-red-500 text-red-500"
                  : "bg-muted hover:bg-muted/80 border-2 border-transparent"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        {selectedReason === "Other" && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Describe the issue..."
            rows={3}
            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
          />
        )}

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200">
          Your report is anonymous and will be reviewed by our moderation team.
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
          >
            Submit Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
