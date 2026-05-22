"use server";

import { listConsorciadosMini as listConsorciadosMiniDocs } from "@/lib/firestore/repository";
import type { ConsorciadoMini } from "@/lib/types/domain";

export async function listConsorciadosMini(): Promise<ConsorciadoMini[]> {
  return listConsorciadosMiniDocs();
}
