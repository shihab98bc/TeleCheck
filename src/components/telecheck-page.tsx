
"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from 'xlsx';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { PhoneInputForm } from "@/components/telecheck/phone-input-form";
import { ResultDisplay, type ResultState } from "@/components/telecheck/result-display";
import { RequestAccessForm } from "@/components/telecheck/request-access-form";
import { PendingApprovalMessage } from "@/components/telecheck/pending-approval-message";
import { useToast } from "@/hooks/use-toast";
import { ListChecks, ShieldAlert, UserCheck, Users, ShieldCheck, UserCog, Download, FileSpreadsheet, MessageSquare, Phone, Send, ClipboardCopy, Hourglass } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ThemeToggleButton } from "@/components/theme-toggle-button";


const ADMIN_EMAIL = "shihab98bc@gmail.com";

type UserStatus = "loading" | "needs_approval" | "pending_approval" | "approved" | "revoked";

type AccessRequest = {
  email: string;
  requestedAt: string; // ISO string
  status: UserStatus;
  lastSeen?: string; // ISO string, for activity tracking
};

type DownloadFilters = {
  found: boolean;
  not_found: boolean;
  error: boolean;
};

function ContactAdminCard() {
  const WHATSAPP_NUMBER = "01755163404";
  const WHATSAPP_LINK = "https://wa.me/8801755163404"; 
  const TELEGRAM_USERNAME = "@shihab98bc";
  const TELEGRAM_LINK = "https://t.me/shihab98bc";
  const { toast } = useToast();

  const copyToClipboard = (text: string, type: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: `${type} Copied!`,
          description: `${text} copied to clipboard.`,
        });
      }).catch(err => {
        toast({
          title: "Copy Failed",
          description: "Could not copy to clipboard. You might need to enable clipboard permissions or be on a secure (HTTPS) connection.",
          variant: "destructive",
        });
        console.error('Failed to copy: ', err);
      });
    } else {
      toast({
        title: "Copy Not Supported",
        description: "Clipboard API not available in this browser or context.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mt-8 shadow-xl border-primary/70">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline text-primary">
          <MessageSquare className="mr-2 h-6 w-6" />
          Contact Administrator
        </CardTitle>
        <CardDescription>
          If you have any questions, need assistance, or want to report an issue, please reach out to the admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
          <div className="flex items-center">
            <Phone className="mr-3 h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">WhatsApp</p>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-base text-accent hover:underline break-all">
                {WHATSAPP_NUMBER}
              </a>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(WHATSAPP_NUMBER, "WhatsApp Number")} aria-label="Copy WhatsApp Number">
            <ClipboardCopy className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
          <div className="flex items-center">
            <Send className="mr-3 h-6 w-6 text-accent" />
            <div>
              <p className="text-sm font-medium text-foreground">Telegram</p>
              <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="text-base text-accent hover:underline break-all">
                {TELEGRAM_USERNAME}
              </a>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(TELEGRAM_USERNAME, "Telegram Username")} aria-label="Copy Telegram Username">
            <ClipboardCopy className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


export default function TeleCheckPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserStatus, setCurrentUserStatus] = useState<UserStatus>("loading");
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResultState[]>([]);
  const { toast } = useToast();

  const [downloadFilters, setDownloadFilters] = useState<DownloadFilters>({
    found: false,
    not_found: false,
    error: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isAdmin = isClient && currentUserEmail === ADMIN_EMAIL && currentUserStatus === "approved";

  const saveAccessRequests = useCallback((updatedRequests: AccessRequest[]) => {
    if (!isClient) return;
    setAccessRequests(updatedRequests);
    localStorage.setItem("telecheck_accessRequests", JSON.stringify(updatedRequests));
  }, [isClient]);

  const updateCurrentUserLastSeen = useCallback((requests: AccessRequest[], email: string | null) => {
    if (!isClient || !email) return requests;
    const userIndex = requests.findIndex(req => req.email === email);
    if (userIndex > -1 && requests[userIndex].status === "approved") {
      const updatedRequests = [...requests];
      updatedRequests[userIndex] = { ...updatedRequests[userIndex], lastSeen: new Date().toISOString() };
      return updatedRequests;
    }
    return requests;
  }, [isClient]);


  useEffect(() => {
    if (!isClient) { 
      return;
    }

    const storedEmail = localStorage.getItem("telecheck_currentUserEmail");
    setCurrentUserEmail(storedEmail);

    let loadedRequests: AccessRequest[] = [];
    const storedRequests = localStorage.getItem("telecheck_accessRequests");
    if (storedRequests) {
      try {
        loadedRequests = JSON.parse(storedRequests);
      } catch (e) {
        console.error("Failed to parse access requests from localStorage", e);
        loadedRequests = []; 
      }
    }
    
    let adminRecord = loadedRequests.find(req => req.email === ADMIN_EMAIL);
    if (adminRecord) {
        if (adminRecord.status !== "approved") {
            adminRecord.status = "approved"; 
            adminRecord.requestedAt = new Date().toISOString();
        }
    } else {
        loadedRequests.push({ email: ADMIN_EMAIL, requestedAt: new Date().toISOString(), status: "approved", lastSeen: new Date().toISOString() });
    }
    
    let finalRequests = [...loadedRequests];

    if (storedEmail) {
      const userRequest = finalRequests.find(req => req.email === storedEmail);
      if (userRequest) {
        setCurrentUserStatus(userRequest.status);
        if (userRequest.status === "approved") {
          finalRequests = updateCurrentUserLastSeen(finalRequests, storedEmail);
        }
      } else {
         setCurrentUserStatus("needs_approval");
      }
    } else {
      setCurrentUserStatus("needs_approval");
    }
    saveAccessRequests(finalRequests); 
  }, [isClient, saveAccessRequests, updateCurrentUserLastSeen]); 


  const handleRequestAccessSubmit = (data: { email: string }) => {
    if (!isClient) return;

    if (!data.email.toLowerCase().endsWith('@gmail.com')) {
      toast({
        title: "Access Denied",
        description: "Only gmail.com email addresses are allowed for access requests.",
        variant: "destructive",
      });
      return; 
    }
    
    setIsLoading(true);
    
    const now = new Date().toISOString();
    let updatedRequests = [...accessRequests]; 
    const existingRequestIndex = updatedRequests.findIndex(req => req.email === data.email);
    let newStatusForCurrentUser: UserStatus = "pending_approval";


    if (data.email === ADMIN_EMAIL) {
      newStatusForCurrentUser = "approved"; 
      if (existingRequestIndex > -1) {
        updatedRequests[existingRequestIndex] = { ...updatedRequests[existingRequestIndex], status: "approved", requestedAt: now, lastSeen: now };
      } else {
        updatedRequests.push({ email: data.email, requestedAt: now, status: "approved", lastSeen: now });
      }
      toast({
        title: "Admin Access Granted",
        description: "Welcome, Admin! Your access is automatically approved.",
        variant: "default",
      });
    } else {
      if (existingRequestIndex > -1) {
        const existingRequest = updatedRequests[existingRequestIndex];
        if (existingRequest.status === 'revoked' || existingRequest.status === 'pending_approval') {
          updatedRequests[existingRequestIndex] = { ...existingRequest, status: "pending_approval", requestedAt: now, lastSeen: existingRequest.lastSeen }; 
          newStatusForCurrentUser = "pending_approval";
          toast({
            title: "Request Updated",
            description: `Your access request for ${data.email} has been re-submitted.`,
          });
        } else if (existingRequest.status === 'approved') {
          newStatusForCurrentUser = "approved";
          updatedRequests[existingRequestIndex] = { ...existingRequest, lastSeen: now };
          toast({
            title: "Already Approved",
            description: `Access for ${data.email} is already approved. Activity updated.`,
            variant: "default",
          });
        } else { 
          newStatusForCurrentUser = existingRequest.status; 
           toast({
            title: "Request Status",
            description: `An existing request for ${data.email} is currently ${existingRequest.status}.`,
          });
        }
      } else {
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

  const handleAdminAction = (targetEmail: string, newStatus: "approved" | "revoked" | "pending_approval") => {
    if (!isClient || !isAdmin) return; 

    let toastTitle = "";
    let toastMessage = "";
    const originalRequest = accessRequests.find(r => r.email === targetEmail);
    const originalStatus = originalRequest?.status;

    let updatedRequests = accessRequests.map(req =>
      req.email === targetEmail ? { ...req, status: newStatus, requestedAt: new Date().toISOString() } : req
    );
    
    if (targetEmail === ADMIN_EMAIL && newStatus === "revoked") {
        const adminIsSelfRevoking = currentUserEmail === ADMIN_EMAIL;
        const otherApprovedAdmins = updatedRequests.filter(r => r.email === ADMIN_EMAIL && r.status === "approved" && r.email !== targetEmail).length;
        
        if (adminIsSelfRevoking && otherApprovedAdmins === 0) {
            const currentAdminRecord = accessRequests.find(r => r.email === ADMIN_EMAIL);
            if (currentAdminRecord && currentAdminRecord.status === 'approved') {
                 toast({
                    title: "Action Prevented",
                    description: "Cannot revoke the sole admin's access.",
                    variant: "destructive",
                });
                return;
            }
        }
    }

    if (newStatus === "approved") {
        const userIndex = updatedRequests.findIndex(req => req.email === targetEmail);
        if (userIndex > -1) {
            updatedRequests[userIndex].lastSeen = new Date().toISOString();
        }
        toastTitle = "User Access Approved";
        toastMessage = `Access for ${targetEmail} has been approved.`;
        if (targetEmail === ADMIN_EMAIL) {
          toastTitle = "Admin Access Re-affirmed";
          toastMessage = `Admin access for ${targetEmail} has been re-affirmed.`;
        }
    } else if (newStatus === "revoked") {
        if (originalStatus === 'pending_approval') {
            toastTitle = "Request Rejected";
            toastMessage = `Access request from ${targetEmail} has been rejected.`;
        } else { 
            toastTitle = "Access Revoked";
            toastMessage = `Access for ${targetEmail} has been revoked.`;
        }
    } else if (newStatus === "pending_approval") { 
        toastTitle = "User Re-evaluation";
        toastMessage = `${targetEmail} is now pending re-evaluation by the admin.`;
    }


    saveAccessRequests(updatedRequests);

    if (targetEmail === currentUserEmail) {
      setCurrentUserStatus(newStatus);
    }
    
    toast({
      title: toastTitle,
      description: toastMessage,
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
        
    setResults([{ status: "processing", message: `Checking ${numbersToProcess.length} phone number(s)...` }]);

    const currentResults: ResultState[] = [];
    let processedCount = 0;

    for (const phoneNumber of numbersToProcess) {
      await new Promise(resolve => setTimeout(resolve, 100)); 

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
      if (numbersToProcess.length > 1) { 
        const processingMessage: ResultState = { status: "processing", message: `Checked ${processedCount}/${numbersToProcess.length} numbers...` };
        setResults([processingMessage, ...currentResults.slice().reverse()]);
      } else {
        setResults([...currentResults.slice().reverse()]); 
      }
    }
    
    setResults(currentResults.slice().reverse());

    if (currentUserEmail && currentUserStatus === "approved") {
      const updatedReqs = updateCurrentUserLastSeen([...accessRequests], currentUserEmail);
      saveAccessRequests(updatedReqs);
    }

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

  const handleFilterChange = (filterName: keyof DownloadFilters) => {
    setDownloadFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const handleDownloadResults = () => {
    if (!isClient) return;
    const downloadable = results.filter(
      r => r.phoneNumber && (r.status === 'found' || r.status === 'not_found' || r.status === 'error')
    );

    const filteredForDownload = downloadable.filter(result => {
      if (!downloadFilters.found && !downloadFilters.not_found && !downloadFilters.error) return true; 
      if (downloadFilters.found && result.status === 'found') return true;
      if (downloadFilters.not_found && result.status === 'not_found') return true;
      if (downloadFilters.error && result.status === 'error') return true;
      return false;
    });

    if (filteredForDownload.length === 0) {
      toast({
        title: "No Results to Download",
        description: "No results match your selected filters, or there are no relevant results to download. If no filters are checked, all results will be downloaded.",
        variant: "destructive",
      });
      return;
    }

    const dataForSheet = filteredForDownload.map(res => ({
      'Phone Number': res.phoneNumber,
      'Status': res.status ? res.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
      'Message': res.message,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TeleCheck Results");
    XLSX.writeFile(workbook, `telecheck_results_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
        title: "Download Started",
        description: `${filteredForDownload.length} records are being downloaded.`,
        variant: "default",
      });
  };
  
  const renderHeaderContent = () => {
    let icon = <ListChecks className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-pulse" />;
    let title = "TeleCheck Bot";
    let subtitle = "Bulk check Telegram account status quickly and easily.";
    let adminNote;

    if (!isClient || currentUserStatus === "loading") {
       icon = <Hourglass className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-spin" />;
       title = "Loading Bot...";
       subtitle = "Please wait while we check your access status.";
    } else if (currentUserStatus === "approved") {
        icon = <UserCheck className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />;
        if (isAdmin) {
          title = "TeleCheck Bot - Admin";
          subtitle = "Manage user access and perform bulk checks.";
          adminNote = <p className="mt-2 text-sm text-green-500 font-medium">Admin access active.</p>;
        } else {
          title = "TeleCheck Bot";
          subtitle = "Access Approved! You can now use the checker.";
          adminNote = <p className="mt-2 text-sm text-green-500 font-medium">Access Approved. You can use the checker.</p>;
        }
    } else if (currentUserStatus === "pending_approval") {
        icon = <Hourglass className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500 animate-spin" />;
        title = "Request Pending";
        subtitle = "Your access to TeleCheck Bot is awaiting admin approval."
    } else if (currentUserStatus === "revoked") {
        icon = <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />;
        title = "Access Revoked";
        subtitle = "Your access to TeleCheck Bot has been revoked. Please contact the admin.";
    } else if (currentUserStatus === "needs_approval") {
        icon = <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />;
        title = "Access Required";
        subtitle = "Please request access to use the TeleCheck Bot."
    }

    return (
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {icon}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">{title}</h1>
        <p className="mt-2 text-md sm:text-lg text-muted-foreground">{subtitle}</p>
        {adminNote}
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (!isClient || !isAdmin) { 
      return null;
    }

    const sortedRequests = [...accessRequests].sort((a, b) => {
        const dateA = a.lastSeen ? parseISO(a.lastSeen).getTime() : 0;
        const dateB = b.lastSeen ? parseISO(b.lastSeen).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA; 
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(); 
    });

    return (
      <Card className="w-full max-w-5xl mt-10 mb-8 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <UserCog className="mr-3 h-8 w-8 text-primary" />
            Admin Panel - User Access Management
          </CardTitle>
          <CardDescription>
            Review and manage user access requests for the TeleCheck Bot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedRequests.length === 0 || (sortedRequests.length === 1 && sortedRequests[0].email === ADMIN_EMAIL && sortedRequests[0].status === 'approved') ? (
            <p className="text-muted-foreground text-center py-6">No other user access requests at the moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] sm:min-w-[250px] font-semibold">Email</TableHead>
                    <TableHead className="min-w-[180px] sm:min-w-[200px] font-semibold">Requested At</TableHead>
                    <TableHead className="min-w-[150px] sm:min-w-[180px] font-semibold">Last Seen</TableHead>
                    <TableHead className="min-w-[120px] font-semibold">Status</TableHead>
                    <TableHead className="text-right min-w-[220px] sm:min-w-[280px] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRequests.map((req) => (
                    <TableRow key={req.email} className="hover:bg-muted/30">
                      <TableCell className="font-medium break-all">{req.email}{req.email === ADMIN_EMAIL && " (Admin)"}</TableCell>
                      <TableCell>{new Date(req.requestedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {req.lastSeen ? (
                            <span title={new Date(req.lastSeen).toLocaleString()}>
                                {formatDistanceToNow(parseISO(req.lastSeen), { addSuffix: true })}
                            </span>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          req.status === "approved" ? "success" : 
                          req.status === "pending_approval" ? "warning" : 
                          req.status === "revoked" ? "destructive" : "outline"
                        } className="text-xs">
                          {req.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        {req.email !== ADMIN_EMAIL && req.status === "pending_approval" && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                              onClick={() => handleAdminAction(req.email, "approved")}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                              onClick={() => handleAdminAction(req.email, "revoked")} 
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {req.email !== ADMIN_EMAIL && req.status === "approved" && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                             className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                            onClick={() => handleAdminAction(req.email, "revoked")}
                          >
                            Revoke
                          </Button>
                        )}
                         {req.email !== ADMIN_EMAIL && req.status === "revoked" && (
                           <Button 
                            size="sm" 
                            variant="outline"
                             className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
                            onClick={() => handleAdminAction(req.email, "pending_approval")}
                          >
                            Re-evaluate
                          </Button>
                         )}
                         {req.email === ADMIN_EMAIL && req.status !== "approved" && ( 
                           <Button 
                            size="sm" 
                            variant="default" 
                             className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
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
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDownloadSection = () => {
    if (!isClient) return null; 

    const downloadableResultsExist = results.some(r => r.phoneNumber && (r.status === 'found' || r.status === 'not_found' || r.status === 'error'));
    if (!downloadableResultsExist || currentUserStatus !== "approved") {
      return null;
    }

    return (
      <Card className="w-full max-w-md mt-8 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <Download className="mr-2 h-6 w-6 text-primary" />
            Download Results
          </CardTitle>
          <CardDescription>
            Select statuses to include in your XLSX download. If none selected, all results will be downloaded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(['found', 'not_found', 'error'] as const).map((statusKey) => (
              <div key={statusKey} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-${statusKey}`}
                  checked={downloadFilters[statusKey]}
                  onCheckedChange={() => handleFilterChange(statusKey)}
                  aria-label={`Filter by ${statusKey.replace('_', ' ')}`}
                />
                <Label htmlFor={`filter-${statusKey}`} className="text-sm font-medium capitalize">
                  {statusKey.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
          <Button onClick={handleDownloadResults} className="w-full bg-primary hover:bg-primary/90">
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Download XLSX
          </Button>
        </CardContent>
      </Card>
    );
  };


  const renderContent = () => {
    if (!isClient || currentUserStatus === "loading") {
      return (
        <div className="flex flex-col items-center justify-center mt-10">
          <Hourglass className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-xl text-muted-foreground">Loading status...</p>
        </div>
      );
    }

    if (currentUserStatus === "needs_approval" || currentUserStatus === "revoked") {
      return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
    }

    if (currentUserStatus === "pending_approval" && !isAdmin && currentUserEmail !== ADMIN_EMAIL) { 
      return <PendingApprovalMessage userEmail={currentUserEmail || undefined} adminEmail={ADMIN_EMAIL} />;
    }
    
    if (currentUserStatus === "pending_approval" && currentUserEmail === ADMIN_EMAIL && !isAdmin) {
        return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
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
          {renderDownloadSection()}
          <ResultDisplay results={results} />
        </>
      );
    }
    
    return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      <header className="w-full flex justify-between items-start pt-6 sm:pt-8 pb-8 sm:pb-10 px-4 sm:px-0">
        <div className="flex-1"></div> 
        <div className="flex-1 flex justify-center">
          {isClient && renderHeaderContent()}
        </div>
        <div className="flex-1 flex justify-end">
          {isClient && <ThemeToggleButton />} 
        </div>
      </header>
      <main className="w-full flex flex-col items-center">
        {isAdmin && renderAdminPanel()}
        {isClient && renderContent()}
        {isClient && <ContactAdminCard /> }
      </main>
      <footer className="mt-12 mb-6 text-center text-muted-foreground">
        <p className="text-sm">
            Telegram API credentials are managed by the site administrator. Access to this tool requires admin approval.
        </p>
        <p className="text-xs mt-1">
            &copy; {new Date().getFullYear()} TeleCheck Bot. All rights reserved.
        </p>
        {isClient && process.env.NODE_ENV === 'development' && ( 
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="link" size="sm" className="text-xs" onClick={() => {
              if (isClient) { 
                localStorage.removeItem("telecheck_accessRequests");
                localStorage.removeItem("telecheck_currentUserEmail");
              }
              setCurrentUserEmail(null);
              setAccessRequests([]);
              setCurrentUserStatus("needs_approval"); 
              setResults([]);
              toast({title: "Dev: Full Reset", description: "All access requests and current user email cleared.", variant: "default"})
            }}>
              (Dev: Full Reset)
            </Button>
             <Button variant="link" size="sm" className="text-xs" onClick={() => {
                let updatedRequests = [...accessRequests];
                const adminIndex = updatedRequests.findIndex(req => req.email === ADMIN_EMAIL);
                if (adminIndex > -1) {
                    updatedRequests[adminIndex] = { ...updatedRequests[adminIndex], status: "approved", requestedAt: new Date().toISOString(), lastSeen: new Date().toISOString() };
                } else {
                    updatedRequests.push({email: ADMIN_EMAIL, requestedAt: new Date().toISOString(), status: "approved", lastSeen: new Date().toISOString() });
                }
                saveAccessRequests(updatedRequests);

                if (currentUserEmail !== ADMIN_EMAIL || currentUserStatus !== "approved") {
                    setCurrentUserEmail(ADMIN_EMAIL);
                    setCurrentUserStatus("approved");
                }
                 toast({title: "Dev: Ensure Admin Approved", description: `${ADMIN_EMAIL} set to approved.`, variant: "default"})
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
