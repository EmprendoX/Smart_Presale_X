"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";
import { SecondaryListing, Currency } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";

export default function SecondaryMarketPanel({ 
  projectId, 
  roundId, 
  currency 
}: { 
  projectId: string; 
  roundId: string; 
  currency: Currency;
}) {
  const t = useTranslations("project.secondary");
  const tCommon = useTranslations("common");
  const tMessages = useTranslations("messages");
  const locale = useLocale();
  const { show } = useToast();
  const [user, setUser] = useState<{ id: string; role: string }>({ id: "", role: "" });
  const [listings, setListings] = useState<SecondaryListing[]>([]);
  const [mySlots, setMySlots] = useState(0); // slots confirmados del usuario

  const load = async (uid: string) => {
    try {
      const res = await fetch(`/api/secondary?projectId=${projectId}`).then(r => r.json());
      if (res.ok) setListings(res.data);

      const my = await fetch(`/api/reservations?userId=${uid}`).then(r => r.json());
      if (my.ok) {
        const slots = (my.data as any[])
          .filter((r: any) => r.roundId === roundId && r.status === "confirmed")
          .reduce((a: number, r: any) => a + r.slots, 0);
        setMySlots(slots);
      }
    } catch (e: any) {
      console.error("Error loading secondary market:", e);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("sps_user");
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      load(u.id);
    }
  }, [projectId, roundId]);

  // Crear listing
  const [sellSlots, setSellSlots] = useState(1);
  const [ask, setAsk] = useState(0);

  const create = async () => {
    if (sellSlots < 1 || sellSlots > mySlots || ask <= 0) {
      show(t("invalidData"), tMessages("error"));
      return;
    }

    const res = await fetch("/api/secondary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, roundId, sellerUserId: user.id, slots: sellSlots, ask, currency })
    }).then(r => r.json());

    if (!res.ok) return show(res.error, tMessages("error"));
    show(t("listingPublished"), tMessages("success"));
    load(user.id);
    setSellSlots(1);
    setAsk(0);
  };

  const buy = async (id: string) => {
    const res = await fetch(`/api/secondary/${id}/fill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerUserId: user.id })
    }).then(r => r.json());

    if (!res.ok) return show(res.error, tMessages("error"));
    show(t("purchaseCompleted"), tMessages("success"));
    load(user.id);
  };

  const active = useMemo(() => listings.filter(l => l.status === "active"), [listings]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="font-medium mb-2">{t("sellSlots")}</div>
        <div className="text-sm text-neutral-600 mb-3">{t("confirmedSlots")}: <b>{mySlots}</b></div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm block mb-1">{t("slotsToSell")}</label>
            <Input 
              type="number" 
              min={1} 
              max={mySlots} 
              value={sellSlots} 
              onChange={e => setSellSlots(parseInt(e.target.value || "1", 10))} 
            />
          </div>
          <div>
            <label className="text-sm block mb-1">{t("askPrice")} ({currency})</label>
            <Input 
              type="number" 
              min={0} 
              value={ask} 
              onChange={e => setAsk(parseFloat(e.target.value || "0"))} 
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={create} 
              disabled={!mySlots || sellSlots < 1 || sellSlots > mySlots || ask <= 0}
            >
              {t("publish")}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="font-medium mb-2">{t("activeOffers")}</div>
        <div className="grid gap-3">
          {active.map(l => (
            <div key={l.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="text-sm">
                #{l.id.slice(0,6)} • {l.slots} {t("slotsLabel")} • {t("askPriceLabel")}: <b>{fmtCurrency(l.ask, l.currency, locale)}</b>
              </div>
              <Button onClick={() => buy(l.id)} size="sm">{t("buy")}</Button>
            </div>
          ))}
          {active.length === 0 && <div className="text-sm text-neutral-600">{t("noActiveListings")}</div>}
        </div>
      </div>
    </div>
  );
}

