import { getDashboardStats } from "@/actions/dashboard";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default async function Home() {
  const stats = await getDashboardStats();
  return <DashboardHome stats={stats} />;
}
