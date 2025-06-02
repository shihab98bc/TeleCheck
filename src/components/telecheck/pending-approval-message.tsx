
"use client";

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
          Request Submitted
        </CardTitle>
        {userEmail && (
          <CardDescription className="text-base">
            Your access request for <span className="font-semibold text-accent">{userEmail}</span> has been submitted.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Hourglass className="mr-2 h-6 w-6 text-amber-500 animate-spin" />
          <p className="text-lg text-amber-500">Pending Admin Approval</p>
        </div>
        <p className="text-muted-foreground">
          The site administrator (<span className="font-medium">{adminEmail}</span>) has been notified.
          You will be able to use the TeleCheck Bot once your request is approved.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
            Please check back later.
        </p>
      </CardContent>
    </Card>
  );
}
