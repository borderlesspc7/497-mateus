"use server";

import { getDashboardCounts as getDashboardCountsFromFirestore } from "@/lib/firestore/repository";
import type { DashboardCounts } from "@/lib/types/domain";

export async function getDashboardCounts(): Promise<DashboardCounts> {
  return getDashboardCountsFromFirestore();
}
