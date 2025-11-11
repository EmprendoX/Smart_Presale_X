"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { useToast } from "./ui/Toast";
import { api } from "@/lib/api";
import { Project, Round } from "@/lib/types";

export default function ReserveDialog({ project, round }: { project: Project; round: Round }) {
  const t = useTranslations("reserve");
  const tCommon = useTranslations("common");
  const tMessages = useTranslations("messages");
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; role: string; kycStatus: string }>({ id: "", role: "", kycStatus: "none" });
  const { show } = useToast();

  useEffect(() => {
    const raw = localStorage.getItem("sps_user");
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const kycNeeded = round.depositAmount >= 1000;
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("MX");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");

  const disabled = useMemo(() => slots < 1 || slots > round.slotsPerPerson, [slots, round.slotsPerPerson]);

  const submit = async () => {
    try {
      setLoading(true);
      const res = await api.createReservation({
        roundId: round.id,
        userId: user.id,
        slots,
        kyc: { fullName, country, phone, idNumber: kycNeeded ? idNumber : undefined }
      });

      if (!res.ok) throw new Error(res.error);

      const ok = await api.checkout(res.data.id);
      if (!ok.ok) throw new Error(ok.error);

      const payment = ok.data;
      const titleKey = payment.reservationStatus === "waitlisted"
        ? "paymentWaitlisted"
        : payment.nextAction
          ? "paymentActionRequired"
          : payment.reservationStatus === "confirmed"
            ? "paymentInitiated"
            : "paymentPending";

      const descriptionKey = payment.reservationStatus === "confirmed" && !payment.nextAction
        ? "success"
        : payment.nextAction
          ? "paymentActionRequired"
          : "paymentPending";

      show(tMessages(titleKey), tMessages(descriptionKey));
      setOpen(false);
    } catch (e: any) {
      show(e.message || tMessages("error"), tMessages("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t("button")}</Button>
      <Modal open={open} title={t("title")} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">{t("slots")}</label>
              <Input type="number" min={1} max={round.slotsPerPerson} value={slots} onChange={e => setSlots(parseInt(e.target.value || "1", 10))} />
              <p className="text-xs text-neutral-500 mt-1">{t("maxPerPerson", { max: round.slotsPerPerson })}</p>
            </div>
            <div>
              <label className="text-sm font-medium">{t("country")}</label>
              <Select value={country} onChange={e => setCountry(e.target.value)}>
                <option value="MX">México</option>
                <option value="US">Estados Unidos</option>
                <option value="DO">República Dominicana</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">{t("fullName")}</label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("phone")}</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          {kycNeeded && (
            <div>
              <label className="text-sm font-medium">{t("idNumber")}</label>
              <Input placeholder={t("idPlaceholder")} value={idNumber} onChange={e => setIdNumber(e.target.value)} />
              <p className="text-xs text-neutral-500 mt-1">{t("kycRequired")}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={submit} disabled={disabled || loading}>
              {loading ? t("processing") : t("submit")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}


