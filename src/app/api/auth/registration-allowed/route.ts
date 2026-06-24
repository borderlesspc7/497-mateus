import { NextResponse } from "next/server";
import { countUsuarios } from "@/lib/firestore/usuarios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const total = await countUsuarios();
    return NextResponse.json({ allowed: total === 0 });
  } catch {
    return NextResponse.json(
      {
        allowed: false,
        error:
          "Serviço indisponível. Verifique as credenciais do Firebase Admin no ambiente de produção.",
      },
      { status: 503 },
    );
  }
}
