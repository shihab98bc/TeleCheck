
"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from 'xlsx';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { PhoneInputForm } from "@/components/telecheck/phone-input-form";
import { ResultDisplay, type ResultState } from "@/components/telecheck/result-display";
import { RequestAccessForm } from "@/components/telecheck/request-access-form";
import { PendingApprovalMessage } from "@/components/telecheck/pending-approval-message";
import { useToast } from "@/hooks/use-toast";
import { ListChecks, ShieldAlert, UserCheck, Users, ShieldCheck, UserCog, Download, FileSpreadsheet, MessageSquare, Phone, Send, ClipboardCopy, Hourglass, MailCheck, MoreHorizontal } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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

  const isAdmin = isClient && currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && currentUserStatus === "approved";

  const saveAccessRequests = useCallback((updatedRequests: AccessRequest[]) => {
    if (!isClient) return;
    setAccessRequests(updatedRequests);
    localStorage.setItem("telecheck_accessRequests", JSON.stringify(updatedRequests));
  }, [isClient]);

  const updateCurrentUserLastSeen = useCallback((requests: AccessRequest[], email: string | null) => {
    if (!isClient || !email) return requests;
    const userIndex = requests.findIndex(req => req.email.toLowerCase() === email.toLowerCase());
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
        loadedRequests = []; // Start with empty if parsing fails
      }
    }
    
    // Ensure admin user always exists and is approved
    let adminRecord = loadedRequests.find(req => req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (adminRecord) {
        if (adminRecord.status !== "approved") {
            adminRecord.status = "approved"; // Correct status if found but not approved
            adminRecord.requestedAt = adminRecord.requestedAt || new Date().toISOString(); // Set requestedAt if missing
        }
        adminRecord.lastSeen = adminRecord.lastSeen || new Date().toISOString(); // Ensure lastSeen is set
    } else {
        // Admin not found, add them
        loadedRequests.push({ email: ADMIN_EMAIL, requestedAt: new Date().toISOString(), status: "approved", lastSeen: new Date().toISOString() });
    }
    
    let finalRequests = [...loadedRequests];

    if (storedEmail) {
      const userRequest = finalRequests.find(req => req.email.toLowerCase() === storedEmail.toLowerCase());
      if (userRequest) {
        setCurrentUserStatus(userRequest.status);
        if (userRequest.status === "approved") {
          finalRequests = updateCurrentUserLastSeen(finalRequests, storedEmail);
        }
      } else {
         // User email stored, but no matching request found (e.g. after a reset on another client)
         // Treat as needing approval to allow them to re-request
         setCurrentUserStatus("needs_approval");
      }
    } else {
      setCurrentUserStatus("needs_approval");
    }
    saveAccessRequests(finalRequests); // Save potentially modified (admin ensured) requests
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

    // Re-fetch from localStorage to ensure working with the most current data
    let currentStoredRequestsData: AccessRequest[] = [];
    const storedRequestsStr = localStorage.getItem("telecheck_accessRequests");
    if (storedRequestsStr) {
        try {
            currentStoredRequestsData = JSON.parse(storedRequestsStr);
        } catch (e) {
            console.error("Failed to parse access requests from localStorage in handleRequestAccessSubmit", e);
            // Fallback to component state if parsing fails, though this might be slightly stale
            currentStoredRequestsData = [...accessRequests]; 
        }
    } else {
      currentStoredRequestsData = [...accessRequests]; // Or an empty array if nothing in state yet
    }
    
    // Ensure admin user is always present and approved in the list being modified
    let adminInCurrentData = currentStoredRequestsData.find(req => req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!adminInCurrentData) {
        currentStoredRequestsData.push({ email: ADMIN_EMAIL, requestedAt: now, status: "approved", lastSeen: now });
    } else if (adminInCurrentData.status !== "approved") {
        adminInCurrentData.status = "approved"; 
        adminInCurrentData.requestedAt = adminInCurrentData.requestedAt || now; 
        adminInCurrentData.lastSeen = adminInCurrentData.lastSeen || now;
    }


    let updatedRequests = [...currentStoredRequestsData];
    const existingRequestIndex = updatedRequests.findIndex(req => req.email.toLowerCase() === data.email.toLowerCase());
    let newStatusForCurrentUser: UserStatus = "pending_approval";


    if (data.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      newStatusForCurrentUser = "approved";
      if (existingRequestIndex > -1) {
        updatedRequests[existingRequestIndex] = { ...updatedRequests[existingRequestIndex], status: "approved", requestedAt: updatedRequests[existingRequestIndex].requestedAt || now, lastSeen: now };
      } else {
        // This case should ideally be handled by the admin-ensure logic above, but as a fallback:
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
        // If user exists and status is anything but approved, set to pending_approval on new request
        if (existingRequest.status !== 'approved') {
          updatedRequests[existingRequestIndex] = { ...existingRequest, status: "pending_approval", requestedAt: now, lastSeen: existingRequest.lastSeen };
          newStatusForCurrentUser = "pending_approval";
          toast({
            title: "Request Re-submitted",
            description: `Your access request for ${data.email} has been re-submitted and is pending approval.`,
          });
        } else { // User is already approved
          newStatusForCurrentUser = "approved";
          updatedRequests[existingRequestIndex] = { ...existingRequest, lastSeen: now }; 
          toast({
            title: "Already Approved",
            description: `Access for ${data.email} is already approved. Your activity has been updated.`,
            variant: "default",
          });
        }
      } else { // New user request
        updatedRequests.push({ email: data.email, requestedAt: now, status: "pending_approval" });
        newStatusForCurrentUser = "pending_approval";
        toast({
          title: "Request Submitted",
          description: `Your access request for ${data.email} has been sent to the admin for review.`,
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
    const originalRequest = accessRequests.find(r => r.email.toLowerCase() === targetEmail.toLowerCase());
    const originalStatus = originalRequest?.status;

    let updatedRequests = accessRequests.map(req =>
      req.email.toLowerCase() === targetEmail.toLowerCase() 
      ? { ...req, status: newStatus, requestedAt: newStatus === 'pending_approval' && originalStatus === 'revoked' ? new Date().toISOString() : req.requestedAt } 
      : req
    );
    
    if (targetEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() && newStatus === "revoked") {
        const adminIsSelfRevoking = currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        // Check against the state *before* this potential update
        const otherApprovedAdmins = accessRequests.filter(r => r.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && r.status === "approved" && r.email.toLowerCase() !== targetEmail.toLowerCase()).length;
        const currentAdminRecord = accessRequests.find(r => r.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

        if (adminIsSelfRevoking && otherApprovedAdmins === 0 && currentAdminRecord && currentAdminRecord.status === 'approved') {
            toast({
                title: "Action Prevented",
                description: "Cannot revoke the sole admin's access.",
                variant: "destructive",
            });
            return; 
        }
    }

    if (newStatus === "approved") {
        const userIndex = updatedRequests.findIndex(req => req.email.toLowerCase() === targetEmail.toLowerCase());
        if (userIndex > -1 && !updatedRequests[userIndex].lastSeen) { // Set lastSeen if approved and not already set
            updatedRequests[userIndex].lastSeen = new Date().toISOString(); 
        }
        toastTitle = "User Access Approved";
        toastMessage = `Access for ${targetEmail} has been approved.`;
        if (targetEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
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
    } else if (newStatus === "pending_approval") { // Typically from 'revoked' to 'pending_approval'
        toastTitle = "User Re-evaluation";
        toastMessage = `${targetEmail} is now pending re-evaluation by the admin. Their request date has been updated.`;
    }

    saveAccessRequests(updatedRequests);

    // If the admin is acting on their own account (e.g. admin accidentally revoked self and is being re-approved by a (non-existent) super-admin or dev tool)
    if (targetEmail.toLowerCase() === currentUserEmail?.toLowerCase()) {
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

    setResults([{ status: "processing", message: `Checking ${numbersToProcess.length} phone number(s)...`, phoneNumber: undefined }]);

    const currentResults: ResultState[] = [];
    let processedCount = 0;

    for (const phoneNumber of numbersToProcess) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call delay

      let singleResult: ResultState;
      const isValidPhoneNumber = /^\+?[1-9]\d{1,14}$/.test(phoneNumber);

      if (!isValidPhoneNumber) {
        singleResult = {
            status: "error",
            message: "Invalid phone number format.",
            phoneNumber: phoneNumber
        };
      } else {
        // Simulate API response
        const randomNumber = Math.random();
        if (randomNumber < 0.6) { // 60% chance found
          singleResult = {
            status: "found",
            message: `A Telegram account exists for this number.`,
            phoneNumber: phoneNumber
          };
        } else if (randomNumber < 0.9) { // 30% chance not_found (total 90%)
          singleResult = {
            status: "not_found",
            message: `No Telegram account found for this number.`,
            phoneNumber: phoneNumber
          };
        } else { // 10% chance error
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
        const processingMessage: ResultState = { status: "processing", message: `Checked ${processedCount}/${numbersToProcess.length} numbers...`, phoneNumber: undefined };
        setResults([processingMessage, ...currentResults.slice().reverse()]); // Show current processing message first
      } else {
        setResults([...currentResults.slice().reverse()]);
      }
    }

    // Final update to results, removing the "processing..." message if it was the only one.
    if(currentResults.length === 1 && results.length === 1 && results[0].status === "processing" && !results[0].phoneNumber) {
        setResults(currentResults);
    } else {
        setResults(currentResults.slice().reverse());
    }


    // Update last seen for the current user
    if (currentUserEmail && currentUserStatus === "approved") {
      const updatedReqs = updateCurrentUserLastSeen([...accessRequests], currentUserEmail); // Pass a copy to avoid direct state mutation before save
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
      if (!downloadFilters.found && !downloadFilters.not_found && !downloadFilters.error) return true; // If no filters selected, download all
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
    let icon: React.ReactNode = <Hourglass className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-spin" />;
    let title = "Loading Bot...";
    let subtitle = "Please wait while we check your access status.";
    let adminNote;

    if(isClient) {
      if (currentUserStatus === "approved") {
          icon = <UserCheck className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />;
          if (isAdmin) {
            title = "TeleCheck Bot - Admin";
            subtitle = "Manage user access and perform bulk checks.";
            adminNote = <p className="mt-2 text-sm text-green-500 font-medium">Admin access active.</p>;
          } else {
            title = "TeleCheck Bot";
            subtitle = "Access Approved! You can now use the checker.";
            // adminNote = <p className="mt-2 text-sm text-green-500 font-medium">Access Approved. You can use the checker.</p>;
          }
      } else if (currentUserStatus === "pending_approval") {
          icon = <MailCheck className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500" />;
          title = "Request Pending Review";
          subtitle = "Your access to TeleCheck Bot is awaiting admin approval."
      } else if (currentUserStatus === "revoked") {
          icon = <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />;
          title = "Access Revoked";
          subtitle = "Your access to TeleCheck Bot has been revoked. Please contact the admin.";
      } else if (currentUserStatus === "needs_approval") { // Default for loading or needs_approval
          icon = <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />;
          title = "Access Required";
          subtitle = "Please request access to use the TeleCheck Bot."
      }
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
        // Prioritize pending_approval
        if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
        if (b.status === 'pending_approval' && a.status !== 'pending_approval') return 1;
        
        // Then sort by lastSeen (most recent first)
        const dateA = a.lastSeen ? parseISO(a.lastSeen).getTime() : 0;
        const dateB = b.lastSeen ? parseISO(b.lastSeen).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        
        // Fallback to requestedAt if lastSeen is same or not present (most recent first)
        const requestedDateA = parseISO(a.requestedAt).getTime();
        const requestedDateB = parseISO(b.requestedAt).getTime();
        return requestedDateB - requestedDateA;
    });

    return (
      <Card className="w-full max-w-5xl mt-10 mb-8 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <UserCog className="mr-3 h-8 w-8 text-primary" />
            Admin Panel - User Management
          </CardTitle>
          <CardDescription>
            Approve, deny, or revoke user access. Monitor user activity via 'Last Seen'. Pending requests are listed for review.
            Use Tab and Enter/Space on the 'Actions' menu for keyboard navigation.
            Note: User data is stored locally in your browser. Real-time updates from other users require a backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedRequests.length === 0 || (sortedRequests.length === 1 && sortedRequests[0].email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && sortedRequests[0].status === 'approved') ? (
            <p className="text-muted-foreground text-center py-6">No other user access requests or user data at the moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] sm:min-w-[250px] font-semibold">Email</TableHead>
                    <TableHead className="min-w-[180px] sm:min-w-[200px] font-semibold">Requested At</TableHead>
                    <TableHead className="min-w-[150px] sm:min-w-[180px] font-semibold">Last Seen</TableHead>
                    <TableHead className="min-w-[120px] font-semibold">Status</TableHead>
                    <TableHead className="text-right min-w-[100px] sm:min-w-[120px] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRequests.map((req) => (
                    <TableRow key={req.email} className="hover:bg-muted/30">
                      <TableCell className="font-medium break-all">{req.email}{req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && " (Admin)"}</TableCell>
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
                        } className="text-xs px-2 py-0.5 whitespace-nowrap">
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label={`Actions for ${req.email}`}>
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {req.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && req.status === "pending_approval" && (
                              <>
                                <DropdownMenuItem onClick={() => handleAdminAction(req.email, "approved")}>
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAdminAction(req.email, "revoked")} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {req.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && req.status === "approved" && (
                              <DropdownMenuItem onClick={() => handleAdminAction(req.email, "revoked")} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                Revoke Access
                              </DropdownMenuItem>
                            )}
                             {req.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && req.status === "revoked" && (
                               <DropdownMenuItem onClick={() => handleAdminAction(req.email, "pending_approval")}>
                                Re-evaluate (Set to Pending)
                              </DropdownMenuItem>
                             )}
                             {req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && req.status !== "approved" && (
                               <DropdownMenuItem onClick={() => handleAdminAction(req.email, "approved")}>
                                Re-Approve Admin
                              </DropdownMenuItem>
                             )}
                             {req.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && req.status === "approved" && (
                                <DropdownMenuItem disabled>No further actions</DropdownMenuItem>
                             )}
                             {req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && req.status === "approved" && (
                                <DropdownMenuItem disabled>Admin (Approved)</DropdownMenuItem>
                             )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
    if (!isClient || currentUserStatus !== "approved") return null;

    const downloadableResultsExist = results.some(r => r.phoneNumber && (r.status === 'found' || r.status === 'not_found' || r.status === 'error'));
    if (!downloadableResultsExist) {
      return null; // Don't render if no results of interest
    }

    return (
      <Card className="w-full max-w-md mt-8 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <Download className="mr-2 h-6 w-6 text-primary" />
            Download Results
          </CardTitle>
          <CardDescription>
            Select statuses to include in your XLSX download. If none selected, all relevant results will be downloaded.
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

    // If user is admin and their status became pending_approval somehow (e.g. dev reset), show request form to re-approve self.
    if (currentUserStatus === "pending_approval" && currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
    }
    
    if (currentUserStatus === "pending_approval" && !isAdmin) { // For non-admin users
      return <PendingApprovalMessage userEmail={currentUserEmail || undefined} adminEmail={ADMIN_EMAIL} />;
    }


    if (currentUserStatus === "approved") {
      return (
        <>
           {/* This card is only for non-admin approved users */}
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

    // Fallback, should ideally be covered by above conditions
    return <RequestAccessForm onSubmit={handleRequestAccessSubmit} isLoading={isLoading} />;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      <header className="w-full flex justify-between items-start pt-6 sm:pt-8 pb-8 sm:pb-10 px-4 sm:px-0">
        <div className="flex-1"></div> {/* For spacing, keeps title centered */}
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
        <p className="text-xs mt-1">
            &copy; {new Date().getFullYear()} TeleCheck Bot. All rights reserved.
        </p>
      
        {isClient && process.env.NODE_ENV === 'development' && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="link" size="sm" className="text-xs" onClick={() => {
              if (isClient) {
                localStorage.removeItem("telecheck_accessRequests");
                localStorage.removeItem("telecheck_currentUserEmail");
                // After removing, re-initialize state to reflect this clearing
                setAccessRequests([]); // Clear component state
                setCurrentUserEmail(null);
                setCurrentUserStatus("needs_approval"); // Default state after reset
                setResults([]);
                // Force a re-evaluation of admin user presence in the next effect run
                // by ensuring the base useEffect logic runs again as if it's a fresh load.
                // This usually happens naturally, but explicit state set helps.
                 const adminNow = new Date().toISOString();
                 const initialAdminRequest = [{ email: ADMIN_EMAIL, requestedAt: adminNow, status: "approved", lastSeen: adminNow }];
                 saveAccessRequests(initialAdminRequest); // Prime with admin
                 if (currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                    setCurrentUserStatus("approved");
                 }

              }
              toast({title: "Dev: Full Reset", description: "User data cleared. Admin re-initialized.", variant: "default"})
            }}>
              (Dev: Full Reset)
            </Button>
             <Button variant="link" size="sm" className="text-xs" onClick={() => {
                if (!isClient) return;
                let updatedRequests = [...accessRequests]; // Work on a copy
                const adminIndex = updatedRequests.findIndex(req => req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
                const adminNow = new Date().toISOString();
                if (adminIndex > -1) {
                    updatedRequests[adminIndex] = { ...updatedRequests[adminIndex], status: "approved", requestedAt: updatedRequests[adminIndex].requestedAt || adminNow, lastSeen: adminNow };
                } else {
                    updatedRequests.push({email: ADMIN_EMAIL, requestedAt: adminNow, status: "approved", lastSeen: adminNow });
                }
                saveAccessRequests(updatedRequests);

                // If current user is not admin, or admin but not approved, set to admin and approved
                if (currentUserEmail?.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || currentUserStatus !== "approved") {
                    localStorage.setItem("telecheck_currentUserEmail", ADMIN_EMAIL);
                    setCurrentUserEmail(ADMIN_EMAIL);
                    setCurrentUserStatus("approved");
                }
                 toast({title: "Dev: Ensure Admin Approved & Set", description: `${ADMIN_EMAIL} set to approved. Current user set to admin.`, variant: "default"})
            }}>
              (Dev: Ensure Admin Approved & Set)
            </Button>
             <Button variant="link" size="sm" className="text-xs" onClick={() => {
              if(!isClient) return;
              if(currentUserEmail && currentUserEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()){
                handleAdminAction(currentUserEmail, "approved");
                 toast({title: "Dev: Current User Approved", description: `${currentUserEmail} approved. Refresh if UI doesn't update immediately.`, variant: "default"})
              } else if (currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
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
    

    