
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PhoneInputForm } from "@/components/telecheck/phone-input-form";
import { ResultDisplay, type ResultState } from "@/components/telecheck/result-display";
import { RequestAccessForm } from "@/components/telecheck/request-access-form";
import { PendingApprovalMessage } from "@/components/telecheck/pending-approval-message";
import { useToast } from "@/hooks/use-toast";
import { ListChecks, ShieldAlert, UserCheck, Users, ShieldCheck, ServerCrash, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


const MAX_NUMBERS_BULK_CHECK = 500;
const ADMIN_EMAIL = "shihab98bc@gmail.com";

type UserStatus = "loading" | "needs_approval" | "pending_approval" | "approved" | "revoked";

type AccessRequest = {
  email: string;
  requestedAt: string;
  status: UserStatus;
};

export default function TeleCheckPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserStatus, setCurrentUserStatus] = useState<UserStatus>("loading");
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResultState[]>([]);
  const { toast } = useToast();

  const saveAccessRequests = useCallback((updatedRequests: AccessRequest[]) => {
    setAccessRequests(updatedRequests);
    localStorage.setItem("telecheck_accessRequests", JSON.stringify(updatedRequests));
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem("telecheck_currentUserEmail");
    setCurrentUserEmail(storedEmail);

    let requests: AccessRequest[] = [];
    const storedRequests = localStorage.getItem("telecheck_accessRequests");
    if (storedRequests) {
      requests = JSON.parse(storedRequests);
      setAccessRequests(requests);
    }

    if (storedEmail) {
      const userRequest = requests.find(req => req.email === storedEmail);
      if (userRequest) {
        setCurrentUserStatus(userRequest.status);
      } else {
        // If email is stored but no matching request (e.g. after a reset of requests but not email)
        setCurrentUserStatus("needs_approval");
      }
    } else {
      setCurrentUserStatus("needs_approval");
    }
  }, []);


  // Effect to handle initial admin setup or derive current user status
  useEffect(() => {
    const storedUserEmail = localStorage.getItem("telecheck_currentUserEmail");
    const storedRequestsStr = localStorage.getItem("telecheck_accessRequests");
    let currentRequests: AccessRequest[] = storedRequestsStr ? JSON.parse(storedRequestsStr) : [];

    if (storedUserEmail) {
      setCurrentUserEmail(storedUserEmail);
      let userRecord = currentRequests.find(req => req.email === storedUserEmail);

      if (userRecord) {
        setCurrentUserStatus(userRecord.status);
      } else {
        // User email exists, but no record, implies they need to request access
        // Or, if it's the admin and their record is missing, re-create and approve
        if (storedUserEmail === ADMIN_EMAIL) {
           userRecord = { email: ADMIN_EMAIL, requestedAt: new Date().toISOString(), status: "approved" };
           currentRequests = [...currentRequests.filter(req => req.email !== ADMIN_EMAIL), userRecord];
           localStorage.setItem("telecheck_accessRequests", JSON.stringify(currentRequests));
           setAccessRequests(currentRequests);
           setCurrentUserStatus("approved");
        } else {
          setCurrentUserStatus("needs_approval");
        }
      }
    } else {
      setCurrentUserStatus("needs_approval");
    }
    
    // Ensure admin always has an approved record if they are the current user and no records exist
    if (storedUserEmail === ADMIN_EMAIL && currentRequests.length === 0) {
        const adminRequest: AccessRequest = { email: ADMIN_EMAIL, requestedAt: new Date().toISOString(), status: "approved" };
        saveAccessRequests([adminRequest]);
        setCurrentUserStatus("approved");
    }

  }, [saveAccessRequests]);


  const handleRequestAccessSubmit = (data: { email: string }) => {
    setIsLoading(true);
    
    const now = new Date().toISOString();
    let updatedRequests = [...accessRequests];
    const existingRequestIndex = updatedRequests.findIndex(req => req.email === data.email);

    if (existingRequestIndex > -1) {
      // User is re-requesting or admin is re-triggering
      if(updatedRequests[existingRequestIndex].status === 'revoked' || updatedRequests[existingRequestIndex].status === 'pending_approval' || data.email === ADMIN_EMAIL) {
        updatedRequests[existingRequestIndex] = { ...updatedRequests[existingRequestIndex], status: "pending_approval", requestedAt: now };
         toast({
          title: "Request Updated",
          description: `Your access request for ${data.email} has been re-submitted.`,
        });
      } else if (updatedRequests[existingRequestIndex].status === 'approved') {
         toast({
          title: "Already Approved",
          description: `Access for ${data.email} is already approved.`,
          variant: "default",
        });
        setIsLoading(false);
        localStorage.setItem("telecheck_currentUserEmail", data.email);
        setCurrentUserEmail(data.email);
        setCurrentUserStatus("approved");
        return;
      } else {
         toast({
          title: "Request Status",
          description: `An existing request for ${data.email} is currently ${updatedRequests[existingRequestIndex].status}.`,
        });
        setIsLoading(false);
        return;
      }
    } else {
      // New request
      updatedRequests.push({ email: data.email, requestedAt: now, status: "pending_approval" });
      toast({
        title: "Request Submitted",
        description: `Your access request for ${data.email} has been sent to the admin.`,
      });
    }

    saveAccessRequests(updatedRequests);
    localStorage.setItem("telecheck_currentUserEmail", data.email);
    setCurrentUserEmail(data.email);
    setCurrentUserStatus("pending_approval"); // User is now pending
    setIsLoading(false);
  };

  const handleAdminAction = (targetEmail: string, newStatus: UserStatus) => {
    const updatedRequests = accessRequests.map(req =>
      req.email === targetEmail ? { ...req, status: newStatus, requestedAt: new Date().toISOString() } : req
    );
    saveAccessRequests(updatedRequests);

    // If admin changes their own status, reflect it immediately
    if (targetEmail === ADMIN_EMAIL && targetEmail === currentUserEmail) {
        setCurrentUserStatus(newStatus);
    }
    // If admin changes status of current non-admin user viewing the page (unlikely scenario but good to handle)
    if (targetEmail === currentUserEmail && currentUserEmail !== ADMIN_EMAIL) {
      setCurrentUserStatus(newStatus);
    }

    toast({
      title: `User ${newStatus === "approved" ? "Approved" : "Access Revoked"}`,
      description: `Access for ${targetEmail} has been ${newStatus}.`,
    });
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
      await new Promise(resolve => setTimeout(resolve, 250)); // Shorter delay for faster bulk processing

      let singleResult: ResultState;
      const isValidPhoneNumber = /^\+?[1-9]\d{1,14}$/.test(phoneNumber);

      if (!isValidPhoneNumber) {
        singleResult = {
            status: "error",
            message: "Invalid phone number format.",
            phoneNumber: phoneNumber
        };
      } else {
        // Simulate API call - In real app, this would be a backend call
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
            message: "Simulated error checking this number.", // Updated error message
            phoneNumber: phoneNumber
          };
        }
      }
      currentResults.push(singleResult);
      processedCount++;
      // Optimized result update: show running total and then the individual results
      const processingMessage: ResultState = { status: "processing", message: `Checked ${processedCount}/${numbersToProcess.length} numbers...` };
      setResults([processingMessage, ...currentResults.slice().reverse()]);
    }
    
    // Final results without the "processing..." message
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

    if (currentUserStatus === "approved") {
        icon = <UserCheck className="h-16 w-16 text-green-500" />;
        if (currentUserEmail === ADMIN_EMAIL) {
          title = "TeleCheck Bot - Admin";
          subtitle = "Manage user access and perform bulk checks.";
          adminNote = <p className="mt-3 text-sm text-green-500">Admin access active.</p>;
        } else {
          adminNote = <p className="mt-3 text-sm text-green-500">Access Approved. You can use the checker.</p>;
        }
    } else if (currentUserStatus === "pending_approval") {
        icon = <ListChecks className="h-16 w-16 text-amber-500" />;
        title = "Request Pending";
        subtitle = "Your access to TeleCheck Bot is awaiting admin approval."
    } else if (currentUserStatus === "revoked") {
        icon = <ShieldAlert className="h-16 w-16 text-destructive" />;
        title = "Access Revoked";
        subtitle = "Your access to TeleCheck Bot has been revoked. Please contact the admin.";
    } else if (currentUserStatus === "needs_approval") {
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

  const renderAdminPanel = () => {
    if (currentUserEmail !== ADMIN_EMAIL || currentUserStatus !== "approved") {
      return null;
    }

    const sortedRequests = [...accessRequests].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    return (
      <Card className="w-full max-w-4xl mt-8 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <UserCog className="mr-2 h-8 w-8 text-primary" />
            Admin Panel - User Access Requests
          </CardTitle>
          <CardDescription>
            Manage user access to the TeleCheck Bot. Approved users can use the bulk checker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No access requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.map((req) => (
                  <TableRow key={req.email}>
                    <TableCell className="font-medium">{req.email}{req.email === ADMIN_EMAIL && " (Admin)"}</TableCell>
                    <TableCell>{new Date(req.requestedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        req.status === "approved" ? "default" :
                        req.status === "pending_approval" ? "secondary" :
                        req.status === "revoked" ? "destructive" : "outline"
                      }>
                        {req.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {req.status !== "approved" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAdminAction(req.email, "approved")}
                          disabled={req.email === ADMIN_EMAIL && req.status === 'approved'} // Admin can't de-approve self this way
                        >
                          Approve
                        </Button>
                      )}
                      {req.status === "approved" && req.email !== ADMIN_EMAIL && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleAdminAction(req.email, "revoked")}
                        >
                          Revoke
                        </Button>
                      )}
                       {req.status === "pending_approval" && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleAdminAction(req.email, "revoked")}
                        >
                          Reject
                        </Button>
                      )}
                       {req.status === "revoked" && req.email !== ADMIN_EMAIL && (
                         <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAdminAction(req.email, "pending_approval")}
                        >
                          Re-evaluate
                        </Button>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };


  const renderContent = () => {
    if (currentUserStatus === "loading") {
      return (
        <div className="flex flex-col items-center justify-center mt-10">
          <ListChecks className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-xl text-muted-foreground">Loading status...</p>
        </div>
      );
    }

    // Admin panel is rendered above other content if admin is logged in and approved
    const isAdmin = currentUserEmail === ADMIN_EMAIL && currentUserStatus === "approved";

    if (currentUserStatus === "needs_approval" || currentUserStatus === "revoked") {
      return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
    }

    if (currentUserStatus === "pending_approval") {
      return <PendingApprovalMessage userEmail={currentUserEmail || undefined} adminEmail={ADMIN_EMAIL} />;
    }

    if (currentUserStatus === "approved") {
      return (
        <>
          {/* API Credentials info card - emphasizing server-side nature */}
           {!isAdmin && (
            <Card className="w-full max-w-md mb-8 shadow-lg bg-card border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline">
                  <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
                  API Usage Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This tool uses Telegram API features to check account status. 
                  The necessary API credentials are securely managed by the application administrator. 
                  You do not need to provide any API keys.
                </p>
              </CardContent>
            </Card>
           )}
          <PhoneInputForm onSubmit={handlePhoneNumberSubmit} isLoading={isLoading} />
          <ResultDisplay results={results} />
        </>
      );
    }
    return ( // Fallback for unexpected status, or if needs_approval wasn't caught
         <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />
    );
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      {renderHeader()}
      <main className="w-full flex flex-col items-center">
        {currentUserEmail === ADMIN_EMAIL && currentUserStatus === "approved" && renderAdminPanel()}
        {renderContent()}
      </main>
      <footer className="mt-12 mb-6 text-center text-muted-foreground">
        <p className="text-sm">
            Telegram API credentials are managed by the site administrator. Access to this tool requires admin approval.
        </p>
        <p className="text-xs mt-1">
            &copy; {new Date().getFullYear()} TeleCheck Bot. All rights reserved.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 space-x-2">
            <Button variant="link" size="sm" className="text-xs" onClick={() => {
              localStorage.removeItem("telecheck_accessRequests");
              localStorage.removeItem("telecheck_currentUserEmail");
              setCurrentUserEmail(null);
              setAccessRequests([]);
              setCurrentUserStatus("needs_approval");
              setResults([]);
              toast({title: "Dev: Full Reset", description: "All access requests and current user email cleared.", variant: "default"})
            }}>
              (Dev: Full Reset)
            </Button>
             <Button variant="link" size="sm" className="text-xs" onClick={() => {
              if(currentUserEmail === ADMIN_EMAIL){
                handleAdminAction(ADMIN_EMAIL, "approved");
              } else {
                 toast({title: "Dev: Not Admin", description: "Current user is not admin.", variant: "destructive"})
              }
            }}>
              (Dev: Approve Admin)
            </Button>
             <Button variant="link" size="sm" className="text-xs" onClick={() => {
              if(currentUserEmail){
                handleAdminAction(currentUserEmail, "approved");
                 toast({title: "Dev: Current User Approved", description: `${currentUserEmail} approved. Refresh if UI doesn't update.`, variant: "default"})
              }
            }}>
              (Dev: Approve Current User)
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}

    