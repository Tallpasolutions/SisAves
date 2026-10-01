import type { Metadata } from "next";
import { Egg } from "lucide-react";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Ovos" };

export default function Ovos() {
  return (
    <EmptyState
      icon={<Egg size={28} />}
      title="Ovos"
      description="Esta tela entra na próxima etapa da construção."
    />
  );
}
