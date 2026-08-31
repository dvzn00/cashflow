"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Downloads the statement through fetch rather than a plain link, so a failure
 * surfaces as a message instead of the browser saving an error page as a .pdf.
 */
export function ExportButton({
  month,
  disabled,
}: {
  month: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    try {
      const response = await fetch(
        `/api/reports/export-pdf?month=${encodeURIComponent(month)}`,
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "Não foi possível gerar o PDF.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `cashflow-extrato-${month}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Extrato gerado.");
    } catch {
      toast.error("Não foi possível gerar o PDF. Verifique sua conexão.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button onClick={download} disabled={pending || disabled}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Gerando…
        </>
      ) : (
        <>
          <Download className="size-4" aria-hidden />
          Gerar PDF
        </>
      )}
    </Button>
  );
}
