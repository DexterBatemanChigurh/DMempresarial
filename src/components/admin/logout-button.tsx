"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { authClient } from "./auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      loading={pending}
      loadingLabel="Saindo…"
    >
      Sair
    </Button>
  );
}
