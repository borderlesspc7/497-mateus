import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { canAccessConfiguracoes } from "@/lib/auth/roles";
import { getServerSessionUser } from "@/lib/auth/server";

export default async function MetasLayout({ children }: PropsWithChildren) {
  const session = await getServerSessionUser();
  if (!session || !canAccessConfiguracoes(session.role)) {
    redirect("/");
  }
  return children;
}
