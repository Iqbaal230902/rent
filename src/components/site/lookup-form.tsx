"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function LookupForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mt-8 grid gap-4 rounded-[28px] bg-white p-6 ring-1 ring-line shadow-pop"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
          const res = await fetch("/api/lookup-booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, phone }),
          });
          const data = await res.json();
          if (!res.ok) setError(data.error);
          else router.push(data.url);
        } finally {
          setLoading(false);
        }
      }}
    >
      <Field label="Kode booking" htmlFor="code">
        <Input
          id="code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="PLZ-XXXXXX"
          className="font-mono tracking-wider"
        />
      </Field>
      <Field label="Nomor WhatsApp" htmlFor="phone">
        <Input id="phone" required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812xxxxxxx" />
      </Field>
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" size="lg" loading={loading}>
        <Search className="h-5 w-5" /> Cari booking
      </Button>
    </form>
  );
}
