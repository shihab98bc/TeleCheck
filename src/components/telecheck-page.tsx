
"use client";

import React, { useState, useEffect } from "react";
import { ApiCredentialsForm } from "@/components/telecheck/api-credentials-form";
import { PhoneInputForm } from "@/components/telecheck/phone-input-form";
import { ResultDisplay, type ResultState } from "@/components/telecheck/result-display";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, LogOut } from "lucide-react";

type ApiCredentials = {
  apiId: string;
  apiHash: string;
};

export default function TeleCheckPage() {
  const [apiCredentials, setApiCredentials] = useState<ApiCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResultState>({ status: null, message: "" });
  const { toast } = useToast();

  useEffect(() => {
    // Attempt to load credentials from localStorage on component mount
    const storedApiId = localStorage.getItem("telecheck_apiId");
    const storedApiHash = localStorage.getItem("telecheck_apiHash");
    if (storedApiId && storedApiHash) {
      setApiCredentials({ apiId: storedApiId, apiHash: storedApiHash });
       toast({
        title: "Credentials Loaded",
        description: "API credentials loaded from local storage.",
        variant: "default",
      });
    }
  }, [toast]);

  const handleApiCredentialsSubmit = (data: ApiCredentials) => {
    setApiCredentials(data);
    // Store credentials in localStorage for persistence (client-side only)
    localStorage.setItem("telecheck_apiId", data.apiId);
    localStorage.setItem("telecheck_apiHash", data.apiHash);
    toast({
      title: "Credentials Set",
      description: "API credentials have been set for this session.",
      variant: "default",
    });
    setResult({ status: null, message: "" }); // Clear previous results
  };

  const handleClearCredentials = () => {
    setApiCredentials(null);
    localStorage.removeItem("telecheck_apiId");
    localStorage.removeItem("telecheck_apiHash");
    toast({
      title: "Credentials Cleared",
      description: "API credentials have been cleared.",
      variant: "default",
    });
     setResult({ status: null, message: "" }); // Clear results
  };

  const handlePhoneNumberSubmit = async (data: { phoneNumber: string }) => {
    if (!apiCredentials) {
      toast({
        title: "API Credentials Missing",
        description: "Please set your API credentials first.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setResult({ status: "info", message: `Checking status for ${data.phoneNumber}...`, phoneNumber: data.phoneNumber });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mocked responses
    const randomNumber = Math.random();
    if (randomNumber < 0.6) { // 60% chance of account found
      setResult({
        status: "found",
        message: `A Telegram account exists for the phone number ${data.phoneNumber}.`,
        phoneNumber: data.phoneNumber
      });
      toast({
        title: "Account Found",
        description: `Telegram account exists for ${data.phoneNumber}.`,
        variant: "default",
      });
    } else if (randomNumber < 0.9) { // 30% chance of account not found
      setResult({
        status: "not_found",
        message: `No Telegram account found for the phone number ${data.phoneNumber}.`,
        phoneNumber: data.phoneNumber
      });
      toast({
        title: "Account Not Found",
        description: `No Telegram account found for ${data.phoneNumber}.`,
        variant: "default",
      });
    } else { // 10% chance of error
      setResult({
        status: "error",
        message: "An error occurred while checking the phone number. Please try again.",
        phoneNumber: data.phoneNumber
      });
      toast({
        title: "Error",
        description: "Failed to check account status.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };
  
  const defaultCreds = apiCredentials ? { apiId: apiCredentials.apiId, apiHash: ""} : undefined;


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-4">
          <Send className="h-16 w-16 text-primary animate-pulse" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-primary">TeleCheck Bot</h1>
        <p className="mt-2 text-xl text-muted-foreground">
          Check Telegram account status quickly and easily.
        </p>
      </header>

      <main className="w-full flex flex-col items-center">
        {!apiCredentials ? (
          <ApiCredentialsForm onSubmit={handleApiCredentialsSubmit} />
        ) : (
          <>
            <div className="w-full max-w-md p-6 mb-6 rounded-lg shadow-xl bg-card">
                <h2 className="text-xl font-semibold text-center text-primary-foreground font-headline">API Credentials Active</h2>
                <p className="mt-1 text-sm text-center text-muted-foreground">API ID: {apiCredentials.apiId.substring(0,3)}***</p>
                 <Button onClick={handleClearCredentials} variant="outline" className="w-full mt-4">
                   <LogOut className="w-4 h-4 mr-2" /> Clear Credentials & Sign Out
                </Button>
            </div>
            <PhoneInputForm onSubmit={handlePhoneNumberSubmit} isLoading={isLoading} />
          </>
        )}
        <ResultDisplay result={result} />
      </main>

      <footer className="mt-12 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TeleCheck Bot. For demonstration purposes only.</p>
      </footer>
    </div>
  );
}
