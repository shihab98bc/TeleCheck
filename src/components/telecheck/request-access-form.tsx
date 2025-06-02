
"use client";

import type * as React from "react";
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
import { Mail, Send } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type RequestAccessFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
};

export function RequestAccessForm({ onSubmit, isLoading }: RequestAccessFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <Mail className="mr-2 h-8 w-8 text-primary" />
          Request Access
        </CardTitle>
        <CardDescription>
          Please enter your email to request access to TeleCheck Bot. Your request will be sent to the admin for approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Your Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="Enter your email address" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
              {isLoading ? (
                <>
                  <Send className="mr-2 h-5 w-5 animate-ping" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Request Access
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
