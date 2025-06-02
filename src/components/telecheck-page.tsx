
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
    }
    
    // Ensure admin always has an approved record if they are the current user
    // or if no requests exist yet and admin is interacting
    if (storedEmail === ADMIN_EMAIL) {
        let adminRecord = requests.find(req => req.email === ADMIN_EMAIL);
        if (adminRecord) {
            if (adminRecord.status !== "approved") {
                adminRecord.status = "approved"; // Ensure admin is always approved
                adminRecord.requestedAt = new Date().toISOString();
            }
        } else {
            requests.push({ email: ADMIN_EMAIL, requestedAt: new Date().toISOString(), status: "approved" });
        }
    } else if (requests.length === 0 && storedEmail === null && ADMIN_EMAIL) { 
        // Scenario: No stored user, no requests, perhaps admin is first-time "visiting"
        // This case is less likely now with auto-approval on request, but good for robustness
    }


    setAccessRequests(requests); // Set requests before deriving current user status

    if (storedEmail) {
      const userRequest = requests.find(req => req.email === storedEmail);
      if (userRequest) {
        setCurrentUserStatus(userRequest.status);
      } else {
         // If it's the admin and their record was just created above, reflect approved status
        if (storedEmail === ADMIN_EMAIL) {
            setCurrentUserStatus("approved");
        } else {
            setCurrentUserStatus("needs_approval");
        }
      }
    } else {
      setCurrentUserStatus("needs_approval");
    }
  }, [saveAccessRequests]); // Removed ADMIN_EMAIL from dependency array as it's a constant


  const handleRequestAccessSubmit = (data: { email: string }) => {
    setIsLoading(true);
    
    const now = new Date().toISOString();
    let updatedRequests = [...accessRequests];
    const existingRequestIndex = updatedRequests.findIndex(req => req.email === data.email);
    let newStatusForCurrentUser: UserStatus = "pending_approval";

    if (data.email === ADMIN_EMAIL) {
      newStatusForCurrentUser = "approved"; // Auto-approve admin
      if (existingRequestIndex > -1) {
        updatedRequests[existingRequestIndex] = { ...updatedRequests[existingRequestIndex], status: "approved", requestedAt: now };
      } else {
        updatedRequests.push({ email: data.email, requestedAt: now, status: "approved" });
      }
      toast({
        title: "Admin Access Granted",
        description: "Welcome, Admin! Your access is automatically approved.",
        variant: "default",
      });
    } else {
      // Handle non-admin user requests
      if (existingRequestIndex > -1) {
        const existingRequest = updatedRequests[existingRequestIndex];
        if (existingRequest.status === 'revoked' || existingRequest.status === 'pending_approval') {
          updatedRequests[existingRequestIndex] = { ...existingRequest, status: "pending_approval", requestedAt: now };
          newStatusForCurrentUser = "pending_approval";
          toast({
            title: "Request Updated",
            description: `Your access request for ${data.email} has been re-submitted.`,
          });
        } else if (existingRequest.status === 'approved') {
          newStatusForCurrentUser = "approved";
          toast({
            title: "Already Approved",
            description: `Access for ${data.email} is already approved.`,
            variant: "default",
          });
        } else { // e.g. needs_approval, should not happen if existing
          newStatusForCurrentUser = existingRequest.status; 
           toast({
            title: "Request Status",
            description: `An existing request for ${data.email} is currently ${existingRequest.status}.`,
          });
        }
      } else {
        // New non-admin request
        updatedRequests.push({ email: data.email, requestedAt: now, status: "pending_approval" });
        newStatusForCurrentUser = "pending_approval";
        toast({
          title: "Request Submitted",
          description: `Your access request for ${data.email} has been sent to the admin.`,
        });
      }
    }

    saveAccessRequests(updatedRequests);
    localStorage.setItem("telecheck_currentUserEmail", data.email);
    setCurrentUserEmail(data.email);
    setCurrentUserStatus(newStatusForCurrentUser); 
    setIsLoading(false);
  };

  const handleAdminAction = (targetEmail: string, newStatus: UserStatus) => {
    let updatedRequests = accessRequests.map(req =>
      req.email === targetEmail ? { ...req, status: newStatus, requestedAt: new Date().toISOString() } : req
    );
     // If admin revokes their own access (for testing), ensure they can still re-approve
    if (targetEmail === ADMIN_EMAIL && newStatus !== "approved") {
       // This scenario is typically handled by dev buttons, but as a safeguard:
       // Admin should not be able to revoke their own access to a point where they cannot log back in
       // The main check ensures admin is always "approved" if they are the current user.
       // However, if we explicitly allow revoking admin for dev testing:
       // updatedRequests = updatedRequests.map(req => 
       //  req.email === ADMIN_EMAIL ? { ...req, status: newStatus } : req);
    }


    saveAccessRequests(updatedRequests);

    // If admin changes status of current non-admin user viewing the page
    if (targetEmail === currentUserEmail && currentUserEmail !== ADMIN_EMAIL) {
      setCurrentUserStatus(newStatus);
    }
    // If admin changes their own status AND they are the current user
    if (targetEmail === currentUserEmail && targetEmail === ADMIN_EMAIL) {
        setCurrentUserStatus(newStatus); // Reflect admin's own status change immediately
    }


    toast({
      title: `User Access ${newStatus === "approved" ? "Approved" : newStatus === "revoked" ? "Revoked" : "Updated"}`,
      description: `Access for ${targetEmail} has been set to ${newStatus.replace("_", " ")}.`,
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
      await new Promise(resolve => setTimeout(resolve, 250)); 

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
            message: "Simulated error checking this number.",
            phoneNumber: phoneNumber
          };
        }
      }
      currentResults.push(singleResult);
      processedCount++;
      const processingMessage: ResultState = { status: "processing", message: `Checked ${processedCount}/${numbersToProcess.length} numbers...` };
      setResults([processingMessage, ...currentResults.slice().reverse()]);
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
          {sortedRequests.length === 0 || (sortedRequests.length === 1 && sortedRequests[0].email === ADMIN_EMAIL && sortedRequests[0].status === 'approved') ? (
            <p className="text-muted-foreground text-center py-4">No other user access requests yet.</p>
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
                      {req.email !== ADMIN_EMAIL && req.status !== "approved" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAdminAction(req.email, "approved")}
                        >
                          Approve
                        </Button>
                      )}
                      {req.email !== ADMIN_EMAIL && req.status === "approved" && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleAdminAction(req.email, "revoked")}
                        >
                          Revoke
                        </Button>
                      )}
                       {req.email !== ADMIN_EMAIL && req.status === "pending_approval" && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleAdminAction(req.email, "revoked")} // Rejecting also sets to revoked
                        >
                          Reject
                        </Button>
                      )}
                       {req.email !== ADMIN_EMAIL && req.status === "revoked" && (
                         <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAdminAction(req.email, "pending_approval")}
                        >
                          Re-evaluate
                        </Button>
                       )}
                       {req.email === ADMIN_EMAIL && req.status !== "approved" && (
                         <Button 
                          size="sm" 
                          variant="default" // Admin can always re-approve themselves
                          onClick={() => handleAdminAction(req.email, "approved")}
                        >
                          Re-Approve Admin
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

    const isAdmin = currentUserEmail === ADMIN_EMAIL && currentUserStatus === "approved";

    if (currentUserStatus === "needs_approval" || currentUserStatus === "revoked") {
       // If admin's status is revoked (e.g. through dev tools), still show request form
      return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
    }

    if (currentUserStatus === "pending_approval" && currentUserEmail !== ADMIN_EMAIL) { // Admin doesn't see pending for self
      return <PendingApprovalMessage userEmail={currentUserEmail || undefined} adminEmail={ADMIN_EMAIL} />;
    }

    if (currentUserStatus === "approved") {
      return (
        <>
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
    // Fallback for unexpected status, or if needs_approval wasn't caught (e.g. admin pending)
    // If admin is current user and status is pending (should be auto-approved, but as fallback)
    if (currentUserEmail === ADMIN_EMAIL && currentUserStatus === "pending_approval") {
        return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
    }
    return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
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
              setCurrentUserStatus("needs_approval"); // Go back to initial state
              setResults([]);
              toast({title: "Dev: Full Reset", description: "All access requests and current user email cleared.", variant: "default"})
            }}>
              (Dev: Full Reset)
            </Button>
             <Button variant="link" size="sm" className="text-xs" onClick={() => {
                handleAdminAction(ADMIN_EMAIL, "approved");
                // Also ensure current user is admin and status is approved
                if (currentUserEmail !== ADMIN_EMAIL || currentUserStatus !== "approved") {
                    setCurrentUserEmail(ADMIN_EMAIL);
                    setCurrentUserStatus("approved");
                     // Ensure admin record exists and is approved
                    let adminRecord = accessRequests.find(req => req.email === ADMIN_EMAIL);
                    if (adminRecord) {
                        if (adminRecord.status !== "approved") {
                            saveAccessRequests(accessRequests.map(r => r.email === ADMIN_EMAIL ? {...r, status: "approved", requestedAt: new Date().toISOString()} : r));
                        }
                    } else {
                        saveAccessRequests([...accessRequests, {email: ADMIN_EMAIL, requestedAt: new Date().toISOString(), status: "approved"}]);
                    }
                }
                 toast({title: "Dev: Admin Re-Approved", description: `${ADMIN_EMAIL} set to approved.`, variant: "default"})
            }}>
              (Dev: Ensure Admin Approved)
            </Button>
             <Button variant="link" size="sm" className="text-xs" onClick={() => {
              if(currentUserEmail && currentUserEmail !== ADMIN_EMAIL){
                handleAdminAction(currentUserEmail, "approved");
                 toast({title: "Dev: Current User Approved", description: `${currentUserEmail} approved. Refresh if UI doesn't update.`, variant: "default"})
              } else if (currentUserEmail === ADMIN_EMAIL) {
                 toast({title: "Dev: Admin is Current User", description: `Admin is already approved. Use 'Ensure Admin Approved' if needed.`, variant: "default"})
              } else {
                 toast({title: "Dev: No Current User", description: `No user to approve. Request access first.`, variant: "destructive"})
              }
            }}>
              (Dev: Approve Current Non-Admin)
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}
    

    