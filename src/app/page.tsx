"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lock, Mail, User, ArrowRight } from "lucide-react";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy credentials
    const validEmail = "admin@example.com";
    const validPassword = "password123";

    if (isLogin) {
      if (email === validEmail && password === validPassword) {
        router.push("/dashboard");
      } else {
        alert("Invalid email or password!");
      }
    } else {
      // For signup, just redirect
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 via-background to-muted/40 dark:from-background dark:via-background dark:to-muted/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isLogin ? "Enter your credentials to access your dashboard" : "Get started with your free account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 px-4"
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 px-4"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 px-4"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60 shadow-lg">
              {isLogin ? "Sign In" : "Create Account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <div className="mt-8">
            <Separator className="my-6" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold text-primary hover:text-primary/90 transition-colors"
                >
                  {isLogin ? "Sign Up Free" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
