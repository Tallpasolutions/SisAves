import type { Metadata } from "next";
import { Bird } from "lucide-react";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Plantel" };

export default function Plantel() {
  return (
    <EmptyState
      icon={<Bird size={28} />}
      title="Plantel"
      description="Esta tela entra na próxima etapa da construção."
    />
  );
}
