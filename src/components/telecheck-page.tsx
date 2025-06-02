
"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from 'xlsx';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { PhoneInputForm } from "@/components/telecheck/phone-input-form";
import { ResultDisplay, type ResultState } from "@/components/telecheck/result-display";
import { RequestAccessForm } from "@/components/telecheck/request-access-form";
// PendingApprovalMessage is no longer needed
import { useToast } from "@/hooks/use-toast";
import { ListChecks, ShieldAlert, UserCheck, Users, ShieldCheck, UserCog, Download, FileSpreadsheet, MessageSquare, Phone, Send, ClipboardCopy, Hourglass, LogIn, MoreHorizontal, Trash2 } from "lucide-react";
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

type UserStatus = "loading" | "needs_email_entry" | "approved";

type AccessRequest = {
  email: string;
  registeredAt: string; // Renamed from requestedAt
  status: "approved"; // Status will always be 'approved' after email submission for non-admins
  lastSeen?: string;
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
        // Ensure all loaded requests conform to the new AccessRequest type (status: "approved")
        const parsedRequests = JSON.parse(storedRequests) as Array<any>;
        loadedRequests = parsedRequests.map(req => ({
            ...req,
            status: "approved", // Force status to approved for existing records
            registeredAt: req.registeredAt || req.requestedAt || new Date().toISOString() // Handle potential old field name
        })).filter(req => req.email); // Ensure email exists
      } catch (e) {
        console.error("Failed to parse access requests from localStorage", e);
        loadedRequests = [];
      }
    }
    
    let adminRecord = loadedRequests.find(req => req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (adminRecord) {
        adminRecord.status = "approved"; 
        adminRecord.registeredAt = adminRecord.registeredAt || new Date().toISOString();
        adminRecord.lastSeen = adminRecord.lastSeen || new Date().toISOString();
    } else {
        loadedRequests.push({ email: ADMIN_EMAIL, registeredAt: new Date().toISOString(), status: "approved", lastSeen: new Date().toISOString() });
    }
    
    let finalRequests = [...loadedRequests];

    if (storedEmail) {
      const userRequest = finalRequests.find(req => req.email.toLowerCase() === storedEmail.toLowerCase());
      if (userRequest && userRequest.status === "approved") {
        setCurrentUserStatus("approved");
        finalRequests = updateCurrentUserLastSeen(finalRequests, storedEmail);
      } else {
         setCurrentUserStatus("needs_email_entry");
      }
    } else {
      setCurrentUserStatus("needs_email_entry");
    }
    saveAccessRequests(finalRequests);
  }, [isClient, saveAccessRequests, updateCurrentUserLastSeen]);


  const handleRegisterEmailSubmit = (data: { email: string }) => { // Renamed from handleRequestAccessSubmit
    if (!isClient) return;

    setIsLoading(true);
    const now = new Date().toISOString();

    if (!data.email.toLowerCase().endsWith('@gmail.com')) {
      toast({
        title: "Invalid Email Provider",
        description: "Only gmail.com email addresses are allowed.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    let currentStoredRequestsData: AccessRequest[] = [];
    const storedRequestsStr = localStorage.getItem("telecheck_accessRequests");
    if (storedRequestsStr) {
        try {
            const parsed = JSON.parse(storedRequestsStr) as Array<any>;
            currentStoredRequestsData = parsed.map(req => ({
                ...req,
                status: "approved",
                registeredAt: req.registeredAt || req.requestedAt || new Date().toISOString()
            })).filter(req => req.email);
        } catch (e) {
            currentStoredRequestsData = [...accessRequests]; 
        }
    } else {
      currentStoredRequestsData = [...accessRequests];
    }
    
    let adminInCurrentData = currentStoredRequestsData.find(req => req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!adminInCurrentData) {
        currentStoredRequestsData.push({ email: ADMIN_EMAIL, registeredAt: now, status: "approved", lastSeen: now });
    } else {
        adminInCurrentData.status = "approved"; 
        adminInCurrentData.registeredAt = adminInCurrentData.registeredAt || now; 
        adminInCurrentData.lastSeen = adminInCurrentData.lastSeen || now;
    }

    let updatedRequests = [...currentStoredRequestsData];
    const existingRequestIndex = updatedRequests.findIndex(req => req.email.toLowerCase() === data.email.toLowerCase());

    if (existingRequestIndex > -1) {
      // User exists, update lastSeen and ensure status is approved
      updatedRequests[existingRequestIndex] = { 
        ...updatedRequests[existingRequestIndex], 
        status: "approved", 
        lastSeen: now,
        registeredAt: updatedRequests[existingRequestIndex].registeredAt || now // ensure registeredAt is set
      };
      toast({
        title: "Welcome Back!",
        description: `Access for ${data.email} confirmed. Your activity has been updated.`,
        variant: "default",
      });
    } else { 
      // New user registration
      updatedRequests.push({ email: data.email, registeredAt: now, status: "approved", lastSeen: now });
      toast({
        title: "Access Granted!",
        description: `You can now use TeleCheck Bot with ${data.email}.`,
      });
    }

    saveAccessRequests(updatedRequests);
    localStorage.setItem("telecheck_currentUserEmail", data.email);
    setCurrentUserEmail(data.email);
    setCurrentUserStatus("approved");
    setIsLoading(false);
  };

  const handleAdminAction = (targetEmail: string, action: "remove_user_from_list") => {
    if (!isClient || !isAdmin || targetEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        if (targetEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()){
            toast({
                title: "Action Prevented",
                description: "Cannot remove the admin account from the list.",
                variant: "destructive"
            });
        }
        return;
    }

    let toastTitle = "";
    let toastMessage = "";

    if (action === "remove_user_from_list") {
        const updatedRequests = accessRequests.filter(req => req.email.toLowerCase() !== targetEmail.toLowerCase());
        saveAccessRequests(updatedRequests);
        toastTitle = "User Removed from List";
        toastMessage = `${targetEmail} has been removed from the user list.`;
        
        // If admin removes the currently logged-in user (and it's not the admin themselves)
        // This scenario is unlikely if only admin can remove, but as a safeguard.
        if (targetEmail.toLowerCase() === currentUserEmail?.toLowerCase()) {
          setCurrentUserEmail(null);
          setCurrentUserStatus("needs_email_entry");
          localStorage.removeItem("telecheck_currentUserEmail");
        }
    } else {
        // Should not happen with current UI
        console.warn("Unknown admin action:", action);
        return;
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
        const processingMessage: ResultState = { status: "processing", message: `Checked ${processedCount}/${numbersToProcess.length} numbers...`, phoneNumber: undefined };
        setResults([processingMessage, ...currentResults.slice().reverse()]); 
      } else {
        setResults([...currentResults.slice().reverse()]);
      }
    }

    if(currentResults.length === 1 && results.length === 1 && results[0].status === "processing" && !results[0].phoneNumber) {
        setResults(currentResults);
    } else {
        setResults(currentResults.slice().reverse());
    }

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
    let icon: React.ReactNode = <Hourglass className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-spin" />;
    let title = "Loading Bot...";
    let subtitle = "Please wait while we check your access status.";
    let adminNote;

    if(isClient) {
      if (currentUserStatus === "approved") {
          icon = <UserCheck className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />;
          if (isAdmin) {
            title = "TeleCheck Bot - Admin";
            subtitle = "View user activity and perform bulk checks.";
            adminNote = <p className="mt-2 text-sm text-green-500 font-medium">Admin access active.</p>;
          } else {
            title = "TeleCheck Bot";
            subtitle = "Access Granted! You can now use the checker.";
          }
      } else if (currentUserStatus === "needs_email_entry") { 
          icon = <LogIn className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />;
          title = "Welcome to TeleCheck Bot";
          subtitle = "Please enter your Gmail address to use the checker."
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
        const dateA = a.lastSeen ? parseISO(a.lastSeen).getTime() : 0;
        const dateB = b.lastSeen ? parseISO(b.lastSeen).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        
        const registeredDateA = parseISO(a.registeredAt).getTime();
        const registeredDateB = parseISO(b.registeredAt).getTime();
        return registeredDateB - registeredDateA;
    });

    const displayRequests = sortedRequests.filter(req => req.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase());

    return (
      <Card className="w-full max-w-5xl mt-10 mb-8 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <UserCog className="mr-3 h-8 w-8 text-primary" />
            Admin Panel - User Activity Log
          </CardTitle>
          <CardDescription>
            View users who have accessed the tool and their last activity. You can remove users from this list.
            Note: User data is stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No other user activity recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] sm:min-w-[250px] font-semibold">Email</TableHead>
                    <TableHead className="min-w-[180px] sm:min-w-[200px] font-semibold">Registered At</TableHead>
                    <TableHead className="min-w-[150px] sm:min-w-[180px] font-semibold">Last Seen</TableHead>
                    <TableHead className="text-right min-w-[100px] sm:min-w-[120px] font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRequests.map((req) => (
                    <TableRow key={req.email} className="hover:bg-muted/30">
                      <TableCell className="font-medium break-all">{req.email}</TableCell>
                      <TableCell>{new Date(req.registeredAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {req.lastSeen ? (
                            <span title={new Date(req.lastSeen).toLocaleString()}>
                                {formatDistanceToNow(parseISO(req.lastSeen), { addSuffix: true })}
                            </span>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label={`Actions for ${req.email}`}>
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAdminAction(req.email, "remove_user_from_list")} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove User from List
                            </DropdownMenuItem>
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

    if (currentUserStatus === "needs_email_entry") {
      return <RequestAccessForm onSubmit={handleRegisterEmailSubmit} isLoading={isLoading} />;
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
    return <RequestAccessForm onSubmit={handleRegisterEmailSubmit} isLoading={isLoading} />;
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
        <p className="text-xs mt-1">
            &copy; {new Date().getFullYear()} TeleCheck Bot. All rights reserved.
        </p>
      
        {isClient && process.env.NODE_ENV === 'development' && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="link" size="sm" className="text-xs" onClick={() => {
              if (isClient) {
                localStorage.removeItem("telecheck_accessRequests");
                localStorage.removeItem("telecheck_currentUserEmail");
                setAccessRequests([]); 
                setCurrentUserEmail(null);
                setCurrentUserStatus("needs_email_entry"); 
                setResults([]);
                 const adminNow = new Date().toISOString();
                 const initialAdminRequest = [{ email: ADMIN_EMAIL, registeredAt: adminNow, status: "approved", lastSeen: adminNow }] as AccessRequest[];
                 saveAccessRequests(initialAdminRequest);
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
                let updatedRequests = [...accessRequests];
                const adminIndex = updatedRequests.findIndex(req => req.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
                const adminNow = new Date().toISOString();
                if (adminIndex > -1) {
                    updatedRequests[adminIndex] = { ...updatedRequests[adminIndex], status: "approved", registeredAt: updatedRequests[adminIndex].registeredAt || adminNow, lastSeen: adminNow };
                } else {
                    updatedRequests.push({email: ADMIN_EMAIL, registeredAt: adminNow, status: "approved", lastSeen: adminNow });
                }
                saveAccessRequests(updatedRequests);

                if (currentUserEmail?.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || currentUserStatus !== "approved") {
                    localStorage.setItem("telecheck_currentUserEmail", ADMIN_EMAIL);
                    setCurrentUserEmail(ADMIN_EMAIL);
                    setCurrentUserStatus("approved");
                }
                 toast({title: "Dev: Ensure Admin Set & Approved", description: `${ADMIN_EMAIL} set to approved. Current user set to admin.`, variant: "default"})
            }}>
              (Dev: Ensure Admin Set & Approved)
            </Button>
            {/* Removed Dev: Approve Current Non-Admin button as it's no longer relevant */}
          </div>
        )}
      </footer>
    </div>
  );
}
  
