import { getDashboardCounts } from "@/actions/dashboard";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default async function Home() {
  const counts = await getDashboardCounts();
  return <DashboardHome initialCounts={counts} />;
}
