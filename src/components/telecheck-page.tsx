
"use client";

import React, { useState, useEffect } from "react";
import { PhoneInputForm } from "@/components/telecheck/phone-input-form";
import { ResultDisplay, type ResultState } from "@/components/telecheck/result-display";
import { RequestAccessForm } from "@/components/telecheck/request-access-form";
import { PendingApprovalMessage } from "@/components/telecheck/pending-approval-message";
import { useToast } from "@/hooks/use-toast";
import { ListChecks, ShieldAlert, UserCheck } from "lucide-react"; 
import { Button } from "@/components/ui/button";

const MAX_NUMBERS_BULK_CHECK = 500;
const ADMIN_EMAIL = "shihab98bc@gmail.com"; 

type UserStatus = "needs_approval" | "pending_approval" | "approved" | "loading";

export default function TeleCheckPage() {
  const [userStatus, setUserStatus] = useState<UserStatus>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResultState[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedStatus = localStorage.getItem("telecheck_userStatus") as UserStatus | null;
    const storedEmail = localStorage.getItem("telecheck_userEmail");

    if (storedStatus) {
      setUserStatus(storedStatus);
      if (storedEmail) {
        setUserEmail(storedEmail);
      }
    } else {
      setUserStatus("needs_approval");
    }
  }, []);

  const handleRequestAccessSubmit = (data: { email: string }) => {
    setIsLoading(true);
    // Simulate API call to request access
    console.log(`Access request submitted for: ${data.email} to admin: ${ADMIN_EMAIL}`);
    setTimeout(() => {
      localStorage.setItem("telecheck_userStatus", "pending_approval");
      localStorage.setItem("telecheck_userEmail", data.email);
      setUserStatus("pending_approval");
      setUserEmail(data.email);
      setIsLoading(false);
      toast({
        title: "Request Submitted",
        description: `Your access request for ${data.email} has been sent to the admin.`,
        variant: "default",
      });
    }, 1500);
  };

  const handlePhoneNumberSubmit = async (data: { phoneNumbers: string }) => {
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
  
  const renderHeader = () => {
    let icon = <ListChecks className="h-16 w-16 text-primary animate-pulse" />;
    let title = "TeleCheck Bot";
    let subtitle = "Bulk check Telegram account status quickly and easily.";
    let adminNote;

    if (userStatus === "approved") {
        icon = <UserCheck className="h-16 w-16 text-green-500" />;
        adminNote = <p className="mt-3 text-sm text-green-500">Admin Access Approved. You can use the checker.</p>;
    } else if (userStatus === "pending_approval") {
        icon = <ListChecks className="h-16 w-16 text-amber-500" />;
        title = "Request Pending";
        subtitle = "Your access to TeleCheck Bot is awaiting admin approval."
    } else if (userStatus === "needs_approval") {
        icon = <ShieldAlert className="h-16 w-16 text-destructive" />;
        title = "Access Required";
        subtitle = "Please request access to use the TeleCheck Bot."
    }


    return (
      <header className="my-10 text-center">
        <div className="flex items-center justify-center mb-4">
          {icon}
        </div>
        <h1 className="text-5xl font-bold font-headline text-primary">{title}</h1>
        <p className="mt-2 text-xl text-muted-foreground">{subtitle}</p>
        {adminNote}
      </header>
    );
  };


  const renderContent = () => {
    if (userStatus === "loading") {
      return (
        <div className="flex flex-col items-center justify-center mt-10">
          <ListChecks className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-xl text-muted-foreground">Loading status...</p>
        </div>
      );
    }

    if (userStatus === "needs_approval") {
      return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
    }

    if (userStatus === "pending_approval") {
      return <PendingApprovalMessage userEmail={userEmail || undefined} adminEmail={ADMIN_EMAIL} />;
    }

    if (userStatus === "approved") {
      return (
        <>
          <PhoneInputForm onSubmit={handlePhoneNumberSubmit} isLoading={isLoading} />
          <ResultDisplay results={results} />
        </>
      );
    }
    return null; // Should not happen
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      {renderHeader()}
      <main className="w-full flex flex-col items-center">
        {renderContent()}
      </main>
      <footer className="mt-12 mb-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TeleCheck Bot. Access requires admin approval.</p>
         {/* For demonstration: a way to reset the simulated status */}
        {process.env.NODE_ENV === 'development' && (
          <Button variant="link" size="sm" className="mt-2" onClick={() => {
            localStorage.removeItem("telecheck_userStatus");
            localStorage.removeItem("telecheck_userEmail");
            setUserStatus("needs_approval");
            setUserEmail(null);
            setResults([]);
            toast({title: "Status Reset", description: "User status has been reset to 'needs_approval'.", variant: "default"})
          }}>
            (Dev: Reset Access Status)
          </Button>
        )}
      </footer>
    </div>
  );
}
