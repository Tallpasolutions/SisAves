import type { Metadata } from "next";
import { Menu } from "lucide-react";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Mais" };

export default function Mais() {
  return (
    <EmptyState
      icon={<Menu size={28} />}
      title="Mais"
      description="Esta tela entra na próxima etapa da construção."
    />
  );
}
