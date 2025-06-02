
"use client";

// This component is no longer used as the admin approval system has been removed.
// Users get immediate access after email submission.
// Keeping the file for historical reference or potential future re-purposing if needed.
// If you are sure it's not needed, you can delete this file.

import type * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hourglass, MailCheck } from "lucide-react";

type PendingApprovalMessageProps = {
  userEmail?: string;
  adminEmail: string;
};

export function PendingApprovalMessage({ userEmail, adminEmail }: PendingApprovalMessageProps) {
  return (
    <Card className="w-full max-w-md shadow-xl bg-card">
      <CardHeader className="items-center text-center">
        <MailCheck className="h-12 w-12 text-primary mb-3" />
        <CardTitle className="text-2xl font-headline">
          Access Granted!
        </CardTitle>
        {userEmail && (
          <CardDescription className="text-base">
            You can now use the TeleCheck Bot with <span className="font-semibold text-accent">{userEmail}</span>.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          The admin approval step has been removed. Enjoy using the tool!
        </p>
      </CardContent>
    </Card>
  );
}
