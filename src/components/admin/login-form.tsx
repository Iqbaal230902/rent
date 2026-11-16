"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/client-api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const r = await api("/api/auth/login", { body: { email, password } });
        setLoading(false);
        if (!r.ok) return setError(r.error);
        router.replace("/admin");
        router.refresh();
      }}
    >
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" size="lg" loading={loading}>
        <LogIn className="h-5 w-5" /> Masuk
      </Button>
    </form>
  );
}
