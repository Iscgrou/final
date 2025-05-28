import TopNavigation from "./TopNavigation";
import SidebarNavigation from "./SidebarNavigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="flex">
        <SidebarNavigation />
        {children}
      </div>
    </div>
  );
}
