"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useLogin, usePrivy } from "@privy-io/react-auth"
import Image from "next/image"
import { FcGoogle } from "react-icons/fc"
import { SiGmail } from "react-icons/si"
import { FaGithub } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import LoginFormSkeleton from "./LoginSkeleton"
type LoginMethod = "google" | "github" | "email"
export default function LoginForm() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/deploy");
    }
  }, [ready, authenticated, router]);
  const [loadingProvider, setLoadingProvider] = useState<LoginMethod | null>(null);
  const { login } = useLogin({
    onComplete: ({ user, isNewUser, wasAlreadyAuthenticated }) => {
      console.log("Login success", { user, isNewUser, wasAlreadyAuthenticated });
      router.push("/deploy");
    },
    onError: (error) => {
      console.error("Login error", error);
      setLoadingProvider(null); 
    },
  });

  const handleLogin = (method: LoginMethod) => {
    setLoadingProvider(method);
    login({ loginMethods: [method] });
  };

  const loginMethods: { id: LoginMethod; label: string; icon: ReactNode }[] = [
    { id: "google", label: "Login with Google", icon: <FcGoogle /> },
    { id: "github", label: "Login with GitHub", icon: <FaGithub /> },
    { id: "email", label: "Email", icon: <SiGmail /> },
  ]

  if (!ready) {
    return <LoginFormSkeleton />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-2 relative h-24 w-24">
          <Image
            alt="COMPLYR Logo"
            className="block dark:hidden object-contain"
            src="/complyrlogo-dark.svg"
            fill
          />
          <Image
            alt="COMPLYR Logo"
            className="hidden dark:block object-contain"
            src="/complyrlogo-light.svg"
            fill
          />
        </div>
        <h1 className="text-4xl font-bold">Welcome Back!</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Choose your preferred method to continue.
        </p>
      </div>

      <div className="grid gap-4">
        {loginMethods.map((method) => (
          <Button
            key={method.id}
            type="button"
            onClick={() => handleLogin(method.id)}
            variant="outline"
            className="w-full"
            aria-label={`Continue with ${method.id}`}
            disabled={loadingProvider !== null}
          >
            <span className="mr-2 inline-flex items-center" aria-hidden>
              {method.icon}
            </span>
            {loadingProvider === method.id ? 'Signing in…' : method.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
