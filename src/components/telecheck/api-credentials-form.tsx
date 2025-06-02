
"use client";

// This component is no longer used as API credentials are now managed server-side by the admin.
// Keeping the file for historical reference or potential future re-purposing if needed.
// If you are sure it's not needed, you can delete this file.

import type * as React from "react";
// Removed imports as they are not used to prevent build errors if this file were accidentally imported.
// import { useState } from "react";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
// import { KeyRound, ShieldCheck, HelpCircle, ExternalLink } from "lucide-react";
// import Image from 'next/image';

// const formSchema = z.object({
//   apiId: z.string().min(1, "API ID is required."),
//   apiHash: z.string().min(1, "API Hash is required."),
// });

// type ApiCredentialsFormProps = {
//   onSubmit: (data: z.infer<typeof formSchema>) => void;
//   defaultValues?: z.infer<typeof formSchema>;
// };

export function ApiCredentialsForm() { // Removed props: { onSubmit, defaultValues }: ApiCredentialsFormProps
  // const form = useForm<z.infer<typeof formSchema>>({
  //   resolver: zodResolver(formSchema),
  //   defaultValues: defaultValues || { apiId: "", apiHash: "" },
  // });

  return (
    <div className="p-4 border border-dashed rounded-md bg-muted/50 text-muted-foreground">
      <p className="text-sm text-center">
        The API Credentials form has been removed. API access is now managed by the site administrator.
      </p>
    </div>
  );
}

  