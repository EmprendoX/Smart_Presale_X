"use client";

import { createContext, useContext } from "react";
import type { Tenant, TenantSettings } from "@/lib/types";

type TenantContextValue = {
  tenant: Tenant | null;
  settings: TenantSettings | null;
};

const TenantContext = createContext<TenantContextValue>({ tenant: null, settings: null });

export function TenantProvider({ value, children }: { value: TenantContextValue; children: React.ReactNode }) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext);
}
