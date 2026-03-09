"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <p className="text-center text-sm text-muted-foreground">
            If that email is registered, you will receive a password reset link.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button className="w-full" onClick={() => setSent(true)}>
              Send Reset Link
            </Button>
          </>
        )}
        <div className="text-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
