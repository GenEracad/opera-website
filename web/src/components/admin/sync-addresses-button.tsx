"use client";

import { useActionState } from "react";

import { syncAddresses, type SyncState } from "@/app/admin/actions";

/** Renames project and team addresses (URL ids) to match their current names. */
export function SyncAddressesButton() {
  const [state, formAction, pending] = useActionState<SyncState>(syncAddresses, {});

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-4">
      <button
        type="submit"
        disabled={pending}
        title="Atualiza os endereços (links) de projetos e equipa a partir dos nomes atuais. Os links antigos dos projetos continuam a funcionar."
        className="rounded-full border border-border px-4 py-2 font-mono text-xs tracking-widest text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
      >
        {pending ? "A atualizar…" : "Atualizar endereços"}
      </button>
      {state.message ? <span className="font-mono text-xs text-muted-foreground">{state.message}</span> : null}
    </form>
  );
}
