
"use client";

import type * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from "lucide-react";

export type ResultState = {
  status: "found" | "not_found" | "error" | "info" | "processing" | null;
  message: string;
  phoneNumber?: string;
};

type ResultDisplayProps = {
  results: ResultState[];
};

export function ResultDisplay({ results }: ResultDisplayProps) {
  if (!results || results.length === 0) {
    return null;
  }

  // Handle a single initial "Processing..." or "Checking N numbers..." message
  if (results.length === 1 && (results[0].status === "info" || results[0].status === "processing") && !results[0].phoneNumber) {
    const singleResult = results[0];
    return (
      <div className="w-full max-w-md mt-8">
        <Alert className="shadow-lg bg-card">
          <div className="flex items-center gap-2">
            {singleResult.status === "processing" ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Info className="h-5 w-5 text-blue-500" />}
            <AlertTitle className="text-lg font-headline">{singleResult.status === "processing" ? "Processing..." : "Information"}</AlertTitle>
          </div>
          <AlertDescription className="mt-2 text-base">
            {singleResult.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="w-full max-w-md mt-8 space-y-4">
      {results.map((result, index) => {
        // Skip rendering for placeholder "processing" messages if actual results are present
        if ((result.status === "info" || result.status === "processing") && !result.phoneNumber && results.filter(r => r.phoneNumber).length > 0) {
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
            case "processing":
                return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
            default:
              return null;
          }
        };

        const getAlertVariant = (): "default" | "destructive" => {
          if (result.status === "error") return "destructive";
          return "default";
        };

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
            case "processing":
              return "Processing...";
            default:
              return "Result";
          }
        };

        return (
          <Alert key={result.phoneNumber || `result-${index}`} variant={getAlertVariant()} className="shadow-lg bg-card">
            <div className="flex items-center gap-2">
              {getIcon()}
              <AlertTitle className="text-lg font-headline">{getTitle()}</AlertTitle>
            </div>
            {result.phoneNumber && <AlertDescription className="mt-1 text-sm text-muted-foreground">For number: {result.phoneNumber}</AlertDescription>}
            <AlertDescription className="mt-2 text-base">
              {result.message}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
