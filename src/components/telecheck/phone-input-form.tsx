
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Search, Loader2, Users } from "lucide-react";

const formSchema = z.object({
  phoneNumbers: z.string().min(1, "Please enter at least one phone number."),
});

type PhoneInputFormProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
};

export function PhoneInputForm({ onSubmit, isLoading }: PhoneInputFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { phoneNumbers: "" },
  });

  return (
    <Card className="w-full max-w-md mt-8 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <Users className="mr-2 h-8 w-8 text-primary" />
          Bulk Check Account Status
        </CardTitle>
        <CardDescription>
          Enter phone numbers, one per line or separated by commas (e.g., +1234567890, +442071234567).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phoneNumbers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Phone Numbers</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter phone numbers here, e.g.:
+1234567890
+442071234567,
+919876543210"
                      {...field}
                      className="min-h-[120px] resize-y"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3 transition-all duration-300 ease-in-out">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Bulk Check
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
