"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase";

export function SignedInRedirect() {
  const router = useRouter();

  useEffect(() => {
    void getCurrentUser().then((user) => {
      if (user) router.replace("/snippets");
    });
  }, [router]);

  return null;
}
