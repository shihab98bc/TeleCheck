
"use client";

import type * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

export type ResultState = {
  status: "found" | "not_found" | "error" | "info" | null;
  message: string;
  phoneNumber?: string;
};

type ResultDisplayProps = {
  result: ResultState;
};

export function ResultDisplay({ result }: ResultDisplayProps) {
  if (!result.status) {
    return null;
  }

  const getIcon = () => {
    switch (result.status) {
      case "found":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "not_found":
        return <XCircle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getAlertVariant = (): "default" | "destructive" => {
    if (result.status === "error") return "destructive";
    return "default";
  }

  const getTitle = () => {
    switch (result.status) {
      case "found":
        return "Account Found";
      case "not_found":
        return "Account Not Found";
      case "error":
        return "Error";
      case "info":
        return "Information";
      default:
        return "Result";
    }
  }

  return (
    <div className="w-full max-w-md mt-8">
      <Alert variant={getAlertVariant()} className="shadow-lg">
        <div className="flex items-center gap-2">
          {getIcon()}
          <AlertTitle className="text-lg font-headline">{getTitle()}</AlertTitle>
        </div>
        {result.phoneNumber && <AlertDescription className="mt-1 text-sm">For number: {result.phoneNumber}</AlertDescription>}
        <AlertDescription className="mt-2 text-base">
          {result.message}
        </AlertDescription>
      </Alert>
    </div>
  );
}
