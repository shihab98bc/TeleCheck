
"use client";

import type * as React from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { KeyRound, ShieldCheck, HelpCircle, ExternalLink } from "lucide-react";
import Image from 'next/image';

const formSchema = z.object({
  apiId: z.string().min(1, "API ID is required."),
  apiHash: z.string().min(1, "API Hash is required."),
});

type ApiCredentialsFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  defaultValues?: z.infer<typeof formSchema>;
};

export function ApiCredentialsForm({ onSubmit, defaultValues }: ApiCredentialsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || { apiId: "", apiHash: "" },
  });

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <ShieldCheck className="mr-2 h-8 w-8 text-primary" />
          API Authentication
        </CardTitle>
        <CardDescription>
          Enter your Telegram App API ID and Hash. These are not stored on our servers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">API ID</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Enter your API ID" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiHash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">API Hash</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="Enter your API Hash" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
              Set Credentials
            </Button>
          </form>
        </Form>

        <Accordion type="single" collapsible className="w-full mt-6">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center text-base">
                <HelpCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                How to find your API ID and Hash?
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p>To get your API ID and API Hash, you need to register an application on the Telegram Core website:</p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Go to <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">my.telegram.org/apps <ExternalLink className="ml-1 h-3 w-3" /></a>.</li>
                <li>Log in with your Telegram account phone number.</li>
                <li>You will receive a confirmation code via Telegram. Enter it on the website.</li>
                <li>Fill out the "New Application" form:
                  <ul className="list-disc list-inside space-y-1 pl-4 mt-1">
                    <li><strong>App title:</strong> You can enter any name, e.g., "TeleCheckBotAccess".</li>
                    <li><strong>Short name:</strong> A short name, e.g., "telecheckbot".</li>
                    <li><strong>URL:</strong> Not critical for this purpose, you can use "localhost".</li>
                    <li><strong>Platform:</strong> Choose "Desktop" or "Other".</li>
                    <li><strong>Description:</strong> Optional.</li>
                  </ul>
                </li>
                <li>Click "Create application".</li>
                <li>You will then see your <strong>api_id</strong> and <strong>api_hash</strong>. Copy these values.</li>
              </ol>
              <p className="mt-2"><strong>Important:</strong> Keep your API Hash secret, like a password!</p>
              <div className="mt-4 p-3 border border-dashed border-border rounded-lg bg-card/50">
                <p className="text-base font-medium mb-2">Visual Guide (Example):</p>
                <p className="text-xs text-muted-foreground mb-2">This is a placeholder. In a real app, you could embed a tutorial video here.</p>
                <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="block relative aspect-video w-full rounded-md overflow-hidden group shadow-md">
                  <Image 
                    src="https://placehold.co/600x338.png?text=API+Key+Tutorial+Video" 
                    alt="Video tutorial placeholder for getting Telegram API keys"
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="video tutorial"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-80"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                   <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Click to visit Telegram Apps page
                  </div>
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </CardContent>
    </Card>
  );
}

