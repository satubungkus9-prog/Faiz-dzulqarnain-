import { Providers } from "@/app/providers";
import LoginPage from "@/app/page";
import DashboardPage from "@/app/dashboard/page";
import { usePathname } from "@/src/shims/next-navigation";

export default function App() {
  const pathname = usePathname();

  return (
    <Providers>
      {pathname.startsWith("/dashboard") ? <DashboardPage /> : <LoginPage />}
    </Providers>
  );
}
