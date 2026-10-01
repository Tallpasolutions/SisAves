import type { Metadata } from "next";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Casais" };

export default function Casais() {
  return (
    <EmptyState
      icon={<Users size={28} />}
      title="Casais"
      description="Esta tela entra na próxima etapa da construção."
    />
  );
}
