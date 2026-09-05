"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Folder, User, Zap } from "lucide-react";

interface NavItemProps {
  label: string;
  href: string;
  icon: typeof Folder;
  isActive?: boolean;
}

function NavItem({ label, href, icon: Icon, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center min-h-[48px] px-2 py-1 transition-all cursor-pointer ${
        isActive ? "text-[#7C5CFF]" : "text-[#8E8D99] hover:text-white"
      }`}
    >
      <div
        className={`flex size-6 items-center justify-center transition-transform duration-200 ${
          isActive ? "scale-110 drop-shadow-[0_0_12px_rgba(124,92,255,0.85)]" : ""
        }`}
      >
        <Icon className="size-5" />
      </div>
      <span
        className={`text-[11px] font-mono tracking-wider uppercase mt-1 transition-colors ${
          isActive ? "text-[#7C5CFF] font-bold" : "text-[#8E8D99]"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function ProviderBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[80px] z-50 flex justify-around items-end pb-4 px-2 pointer-events-auto"
      style={{
        background: "linear-gradient(180deg, rgba(8,8,10,0) 0%, rgba(8,8,10,0.95) 45%, rgba(8,8,10,1) 100%)",
        backdropFilter: "blur(12px)",
      }}
      aria-label="Navegación del profesional"
    >
      <NavItem
        label="Rubro"
        icon={Folder}
        href="/provider/profile"
        isActive={pathname === "/provider/categories" || pathname === "/provider/profile"}
      />
      <NavItem
        label="Mis Solicitudes"
        icon={ClipboardList}
        href="/provider"
        isActive={pathname === "/provider/requests"}
      />
      <NavItem
        label="Pedidos"
        icon={Zap}
        href="/provider"
        isActive={pathname === "/provider"}
      />
      <NavItem
        label="Perfil"
        icon={User}
        href="/provider/profile"
        isActive={pathname === "/provider/profile" || pathname.startsWith("/provider/kyc")}
      />
    </nav>
  );
}
