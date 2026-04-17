import { LoginForm } from "./login-form";
import { Activity } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Dialysis Tracker</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
