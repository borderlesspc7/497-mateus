"use server";

import {
  getDashboardCounts as getDashboardCountsFromFirestore,
  getDashboardStats as getDashboardStatsFromFirestore,
} from "@/lib/firestore/repository";
import type { DashboardCounts, DashboardStats } from "@/lib/types/domain";

export async function getDashboardCounts(): Promise<DashboardCounts> {
  return getDashboardCountsFromFirestore();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return getDashboardStatsFromFirestore();
}
