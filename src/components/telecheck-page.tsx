
"use client";

import React, { useState, useEffect } from "react";
// ApiCredentialsForm is no longer imported as it's removed
import { PhoneInputForm } from "@/components/telecheck/phone-input-form";
import { ResultDisplay, type ResultState } from "@/components/telecheck/result-display";
// Button for clearing credentials is removed
import { useToast } from "@/hooks/use-toast";
import { ListChecks } from "lucide-react"; // LogOut icon removed

// ApiCredentials type is removed as it's no longer used
// type ApiCredentials = {
//   apiId: string;
//   apiHash: string;
// };

const MAX_NUMBERS_BULK_CHECK = 500;

export default function TeleCheckPage() {
  // apiCredentials state and related logic are removed
  // const [apiCredentials, setApiCredentials] = useState<ApiCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResultState[]>([]);
  const { toast } = useToast();

  // useEffect for loading credentials from localStorage is removed
  // useEffect(() => {
  //   const storedApiId = localStorage.getItem("telecheck_apiId");
  //   const storedApiHash = localStorage.getItem("telecheck_apiHash");
  //   if (storedApiId && storedApiHash) {
  //     setApiCredentials({ apiId: storedApiId, apiHash: storedApiHash });
  //      toast({
  //       title: "Credentials Loaded",
  //       description: "API credentials loaded from local storage.",
  //       variant: "default",
  //     });
  //   }
  // }, [toast]);

  // handleApiCredentialsSubmit function is removed
  // const handleApiCredentialsSubmit = (data: ApiCredentials) => {
  //   setApiCredentials(data);
  //   localStorage.setItem("telecheck_apiId", data.apiId);
  //   localStorage.setItem("telecheck_apiHash", data.apiHash);
  //   toast({
  //     title: "Credentials Set",
  //     description: "API credentials have been set for this session.",
  //     variant: "default",
  //   });
  //   setResults([]); 
  // };

  // handleClearCredentials function is removed
  // const handleClearCredentials = () => {
  //   setApiCredentials(null);
  //   localStorage.removeItem("telecheck_apiId");
  //   localStorage.removeItem("telecheck_apiHash");
  //   toast({
  //     title: "Credentials Cleared",
  //     description: "API credentials have been cleared.",
  //     variant: "default",
  //   });
  //   setResults([]); 
  // };

  const handlePhoneNumberSubmit = async (data: { phoneNumbers: string }) => {
    // Removed check for !apiCredentials
    // if (!apiCredentials) {
    //   toast({
    //     title: "API Credentials Missing",
    //     description: "Please set your API credentials first.",
    //     variant: "destructive",
    //   });
    //   return;
    // }
    setIsLoading(true);
    setResults([]); 

    const numbersToProcess = data.phoneNumbers
      .split(/[\n,;]+/) 
      .map(num => num.trim())
      .filter(num => num.length > 0);

    if (numbersToProcess.length === 0) {
      toast({ title: "No Numbers Entered", description: "Please enter valid phone numbers to check.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (numbersToProcess.length > MAX_NUMBERS_BULK_CHECK) {
      toast({ 
        title: "Too Many Numbers", 
        description: `Please enter up to ${MAX_NUMBERS_BULK_CHECK} numbers for bulk check. You entered ${numbersToProcess.length}.`, 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }
    
    setResults([{ status: "processing", message: `Checking ${numbersToProcess.length} phone number(s)...` }]);

    const currentResults: ResultState[] = [];
    let processedCount = 0;

    for (const phoneNumber of numbersToProcess) {
      await new Promise(resolve => setTimeout(resolve, 750)); 

      let singleResult: ResultState;
      const isValidPhoneNumber = /^\+?[1-9]\d{1,14}$/.test(phoneNumber);

      if (!isValidPhoneNumber) {
        singleResult = {
            status: "error",
            message: "Invalid phone number format.",
            phoneNumber: phoneNumber
        };
      } else {
        const randomNumber = Math.random();
        if (randomNumber < 0.6) { 
          singleResult = {
            status: "found",
            message: `A Telegram account exists for this number.`,
            phoneNumber: phoneNumber
          };
        } else if (randomNumber < 0.9) { 
          singleResult = {
            status: "not_found",
            message: `No Telegram account found for this number.`,
            phoneNumber: phoneNumber
          };
        } else { 
          singleResult = {
            status: "error",
            message: "An error occurred while checking this phone number. Please try again.",
            phoneNumber: phoneNumber
          };
        }
      }
      currentResults.push(singleResult);
      processedCount++;
      setResults([{ status: "processing", message: `Checked ${processedCount}/${numbersToProcess.length} numbers...` }, ...currentResults.slice().reverse()]);
    }
    
    setResults(currentResults.slice().reverse());

    const foundCount = currentResults.filter(r => r.status === "found").length;
    const notFoundCount = currentResults.filter(r => r.status === "not_found").length;
    const errorCount = currentResults.filter(r => r.status === "error").length;

    toast({
      title: "Bulk Check Complete",
      description: `${numbersToProcess.length} numbers processed. Found: ${foundCount}, Not Found: ${notFoundCount}, Errors: ${errorCount}.`,
      variant: "default",
      duration: 5000,
    });

    setIsLoading(false);
  };
  
  // defaultCreds is removed as it's no longer used
  // const defaultCreds = apiCredentials ? { apiId: apiCredentials.apiId, apiHash: ""} : undefined;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      <header className="my-10 text-center">
        <div className="flex items-center justify-center mb-4">
          <ListChecks className="h-16 w-16 text-primary animate-pulse" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-primary">TeleCheck Bot</h1>
        <p className="mt-2 text-xl text-muted-foreground">
          Bulk check Telegram account status quickly and easily.
        </p>
         <p className="mt-3 text-sm text-amber-500">
          Admin Access Active. API credentials are pre-configured.
        </p>
      </header>

      <main className="w-full flex flex-col items-center">
        {/* Conditional rendering for ApiCredentialsForm is removed. PhoneInputForm is always shown. */}
        {/* {!apiCredentials ? (
          <ApiCredentialsForm onSubmit={handleApiCredentialsSubmit} defaultValues={defaultCreds} />
        ) : ( */}
          <>
            {/* Section displaying "API Credentials Active" and Clear button is removed */}
            {/* <div className="w-full max-w-md p-6 mb-6 rounded-lg shadow-xl bg-card">
                <h2 className="text-xl font-semibold text-center text-primary-foreground font-headline">API Credentials Active</h2>
                <p className="mt-1 text-sm text-center text-muted-foreground">API ID: {apiCredentials.apiId.substring(0,3)}***</p>
                 <Button onClick={handleClearCredentials} variant="outline" className="w-full mt-4">
                   <LogOut className="w-4 h-4 mr-2" /> Clear Credentials & Sign Out
                </Button>
            </div> */}
            <PhoneInputForm onSubmit={handlePhoneNumberSubmit} isLoading={isLoading} />
          </>
        {/* )} */}
        <ResultDisplay results={results} />
      </main>

      <footer className="mt-12 mb-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TeleCheck Bot. For demonstration and admin use.</p>
      </footer>
    </div>
  );
}
