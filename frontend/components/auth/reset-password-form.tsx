"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api/auth";

const schema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters."),
    new_password2: z.string(),
  })
  .refine((v) => v.new_password === v.new_password2, {
    message: "Passwords do not match.",
    path: ["new_password2"],
  });

type FormValues = z.infer<typeof schema>;

type ResetErrors = { token?: string[]; new_password?: string[]; new_password2?: string[] };

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!uid || !token) return;
    try {
      await authApi.confirmPasswordReset({ uid, token, ...values });
      toast.success("Password reset. Please sign in with your new password.");
      router.push("/login");
    } catch (error: unknown) {
      const err = error as { status?: number; data?: ResetErrors };
      if (err?.data?.new_password) {
        setError("new_password", { message: err.data.new_password.join(" ") });
      } else if (err?.data?.new_password2) {
        setError("new_password2", { message: err.data.new_password2.join(" ") });
      } else {
        toast.error(
          err?.data?.token?.[0] ??
            (err?.status === 429 ? "Too many attempts. Please try again later." : "Could not reset password.")
        );
      }
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Choose a New Password</CardTitle>
        <CardDescription>Enter and confirm your new password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uid || !token ? (
          <p className="text-center text-sm text-muted-foreground">
            This reset link is incomplete. Please request a new one.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" type="password" autoComplete="new-password" {...register("new_password")} />
              {errors.new_password && (
                <p className="text-sm text-destructive">{errors.new_password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password2">Confirm New Password</Label>
              <Input id="new_password2" type="password" autoComplete="new-password" {...register("new_password2")} />
              {errors.new_password2 && (
                <p className="text-sm text-destructive">{errors.new_password2.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
        <div className="flex justify-center gap-4 text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Request a new link
          </Link>
          <Link href="/login" className="text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
