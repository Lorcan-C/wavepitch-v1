import React, { useState } from 'react';

import {
  CheckCircle,
  Copy,
  Download,
  FileText,
  HelpCircle,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { MeetingSummary } from '../../meetings/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface MeetingSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  summary: MeetingSummary | null;
  isLoading: boolean;
  meetingTitle: string;
}

export function MeetingSummaryDialog({
  isOpen,
  onClose,
  summary,
  isLoading,
  meetingTitle,
}: MeetingSummaryDialogProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const formatSummaryAsText = () => {
    if (!summary) return '';

    let text = `Meeting Summary: ${meetingTitle}\n`;
    text += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

    if (summary.keyIdeas.length > 0) {
      text += 'KEY IDEAS:\n';
      summary.keyIdeas.forEach((item, index) => {
        text += `${index + 1}. ${item}\n`;
      });
      text += '\n';
    }

    if (summary.decisions.length > 0) {
      text += 'DECISIONS MADE:\n';
      summary.decisions.forEach((decision, index) => {
        text += `${index + 1}. ${decision}\n`;
      });
      text += '\n';
    }

    if (summary.strategicQuestions.length > 0) {
      text += 'STRATEGIC QUESTIONS:\n';
      summary.strategicQuestions.forEach((question, index) => {
        text += `${index + 1}. ${question}\n`;
      });
      text += '\n';
    }

    return text;
  };

  const copyToClipboard = async (text: string, sectionName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionName);
      toast.success(`${sectionName} copied to clipboard`);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadSummary = () => {
    const text = formatSummaryAsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meetingTitle.replace(/[^a-z0-9]/gi, '_')}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded');
  };

  const SummarySection = ({
    title,
    items,
    icon: Icon,
  }: {
    title: string;
    items: string[];
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(items.join('\n'), title)}
          className="h-8 w-8 p-0"
        >
          {copiedSection === title ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No {title.toLowerCase()} identified
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meeting Summary
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Generating meeting summary...</p>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{meetingTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(formatSummaryAsText(), 'Full Summary')}
                  className="flex items-center gap-2"
                >
                  {copiedSection === 'Full Summary' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSummary}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              <SummarySection
                title="Key Ideas"
                items={summary.keyIdeas}
                icon={Lightbulb}
                sectionKey="keyIdeas"
              />

              <SummarySection
                title="Strategic Questions"
                items={summary.strategicQuestions}
                icon={HelpCircle}
                sectionKey="strategicQuestions"
              />

              <SummarySection
                title="Decisions Made"
                items={summary.decisions}
                icon={CheckCircle}
                sectionKey="decisions"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to generate summary. Please try again.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
