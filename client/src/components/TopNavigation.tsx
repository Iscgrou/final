import { Button } from "@/components/ui/button";
import { CloudUpload, User } from "lucide-react";

export default function TopNavigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center ml-3">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">سیستم مدیریت فاکتور VPN</h1>
            </div>
          </div>
          
          {/* User Profile and Actions */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              size="sm"
            >
              <CloudUpload className="w-4 h-4 ml-2" />
              پشتیبان‌گیری
            </Button>
            <div className="relative">
              <button className="flex items-center text-gray-700 hover:text-gray-900 transition-colors">
                <User className="w-6 h-6" />
                <span className="mr-2 hidden md:block">مدیر سیستم</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
