"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";

type DemoUser = { id: string; name: string; role: "buyer" | "developer" | "admin"; kycStatus: "none" | "basic" | "verified" };

const DEMO_USERS: DemoUser[] = [
  { id: "u_buyer_1", name: "Ana (Comprador)", role: "buyer", kycStatus: "basic" },
  { id: "u_dev_1", name: "Carlos (Dev)", role: "developer", kycStatus: "verified" },
  { id: "u_admin_1", name: "Pat (Admin)", role: "admin", kycStatus: "verified" }
];

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<DemoUser>(DEMO_USERS[0]);
  
  // Hooks de next-intl con manejo de errores
  let t: ReturnType<typeof useTranslations>;
  let locale: string;
  let router: ReturnType<typeof useRouter>;
  let pathname: string;
  
  try {
    t = useTranslations("nav");
    locale = useLocale();
    router = useRouter();
    pathname = usePathname();
  } catch (error) {
    // Fallback si los hooks fallan
    console.error("Error en hooks de next-intl:", error);
    return (
      <header className="border-b">
        <div className="container flex items-center justify-between py-3">
          <div className="text-xl font-semibold">Smart <span className="text-brand">Pre‑Sale</span></div>
        </div>
      </header>
    );
  }

  // Solo usar localStorage después de montar (cliente)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("sps_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
        } else {
          localStorage.setItem("sps_user", JSON.stringify(DEMO_USERS[0]));
        }
      } catch (error) {
        console.error("Error leyendo localStorage:", error);
      }
    }
  }, []);

  // Prevenir loops infinitos en cambio de locale
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    
    try {
      const savedLocale = localStorage.getItem("sps_locale");
      if (savedLocale && savedLocale !== locale && (savedLocale === "es" || savedLocale === "en")) {
        // Solo cambiar si el locale guardado es diferente y válido
        const currentPath = pathname || "/";
        const pathWithoutLocale = currentPath.replace(/^\/(es|en)/, "") || "/";
        router.replace(pathWithoutLocale, { locale: savedLocale });
      }
    } catch (error) {
      console.error("Error en cambio de locale:", error);
    }
  }, [mounted, locale, pathname, router]);

  const onChange = (id: string) => {
    const u = DEMO_USERS.find(x => x.id === id);
    if (u) {
      setUser(u);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sps_user", JSON.stringify(u));
        } catch (error) {
          console.error("Error guardando usuario:", error);
        }
      }
    }
  };

  const changeLanguage = (newLocale: string) => {
    if (typeof window !== "undefined" && (newLocale === "es" || newLocale === "en")) {
      try {
        localStorage.setItem("sps_locale", newLocale);
        const currentPath = pathname || "/";
        const pathWithoutLocale = currentPath.replace(/^\/(es|en)/, "") || "/";
        router.replace(pathWithoutLocale, { locale: newLocale });
      } catch (error) {
        console.error("Error cambiando idioma:", error);
      }
    }
  };

  return (
    <header className="border-b">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-semibold">
            Smart <span className="text-brand">Pre‑Sale</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/" className="hover:underline">{t("projects")}</Link>
            <Link href="/dashboard" className="hover:underline">{t("myReservations")}</Link>
            <Link href="/dev" className="hover:underline">{t("devPanel")}</Link>
            <Link href="/community" className="hover:underline">{t("communities")}</Link>
            <Link href="/admin" className="hover:underline">{t("admin")}</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Select value={locale} onChange={e => changeLanguage(e.target.value)} aria-label={t("language")}>
            <option value="es">{t("spanish")}</option>
            <option value="en">{t("english")}</option>
          </Select>
          <Select value={user.id} onChange={e => onChange(e.target.value)} aria-label="Usuario demo">
            {DEMO_USERS.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Button variant="secondary" asChild>
            <a href="https://example.com/how-it-works" target="_blank" rel="noreferrer">{t("howItWorks")}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}


