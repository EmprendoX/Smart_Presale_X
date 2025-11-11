"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AutomationWorkflow, Project } from "@/lib/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

const automationTriggers: AutomationWorkflow["trigger"][] = ["new_lead", "new_reservation", "milestone", "manual"];
const automationChannels: AutomationWorkflow["channel"][] = ["email", "whatsapp", "slack", "crm"];

const statusColors: Record<AutomationWorkflow["status"], "neutral" | "yellow" | "green"> = {
  draft: "neutral",
  paused: "yellow",
  active: "green"
};

type AutomationForm = {
  name: string;
  description: string;
  trigger: AutomationWorkflow["trigger"];
  channel: AutomationWorkflow["channel"];
  projectId: string;
};

export function AutomationManager() {
  const t = useTranslations("admin.automations");
  const tCommon = useTranslations("common");
  const { show } = useToast();

  const [automations, setAutomations] = useState<AutomationWorkflow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AutomationForm>({
    name: "",
    description: "",
    trigger: "new_lead",
    channel: "email",
    projectId: ""
  });

  const load = async () => {
    setLoading(true);
    const [automationRes, projectRes] = await Promise.all([
      api.listAutomations(),
      fetch("/api/projects").then(res => res.json()).catch(() => ({ ok: false, data: [] }))
    ]);

    if (automationRes.ok) {
      setAutomations(automationRes.data);
    } else {
      show(automationRes.error, tCommon("error"));
    }

    if (projectRes.ok) {
      setProjects(projectRes.data as Project[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = automations.length;
    const active = automations.filter(auto => auto.status === "active").length;
    const channels = new Set(automations.map(auto => auto.channel));
    return { total, active, channels: channels.size };
  }, [automations]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload: Partial<AutomationWorkflow> = {
      name: form.name,
      description: form.description,
      trigger: form.trigger,
      channel: form.channel,
      projectId: form.projectId || undefined
    };

    const res = await api.createAutomation(payload);
    if (res.ok) {
      show(t("created"), tCommon("success"));
      setForm({ name: "", description: "", trigger: "new_lead", channel: "email", projectId: "" });
      load();
    } else {
      show(res.error, tCommon("error"));
    }
    setSaving(false);
  };

  const cycleStatus = async (automation: AutomationWorkflow) => {
    const order: AutomationWorkflow["status"][] = ["draft", "active", "paused"];
    const index = order.indexOf(automation.status);
    const next = order[(index + 1) % order.length];
    const res = await api.updateAutomation(automation.id, { status: next });
    if (res.ok) {
      show(t("statusUpdated"), tCommon("success"));
      load();
    } else {
      show(res.error, tCommon("error"));
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{t("total")}</p>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{t("active")}</p>
            <div className="text-2xl font-semibold">{stats.active}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{t("channels")}</p>
            <div className="text-2xl font-semibold">{stats.channels}</div>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("createTitle")}</h2>
          <p className="text-sm text-neutral-600">{t("createDescription")}</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
            <Input
              label={t("form.namePlaceholder")}
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
              required
            />
            <Select
              label={t("form.trigger")}
              value={form.trigger}
              onChange={event => setForm(prev => ({ ...prev, trigger: event.target.value as AutomationWorkflow["trigger"] }))}
            >
              {automationTriggers.map(trigger => (
                <option key={trigger} value={trigger}>
                  {t(`triggers.${trigger}`)}
                </option>
              ))}
            </Select>
            <Select
              label={t("form.channel")}
              value={form.channel}
              onChange={event => setForm(prev => ({ ...prev, channel: event.target.value as AutomationWorkflow["channel"] }))}
            >
              {automationChannels.map(channel => (
                <option key={channel} value={channel}>
                  {t(`channels_${channel}`)}
                </option>
              ))}
            </Select>
            <Select
              label={t("form.project")}
              value={form.projectId}
              onChange={event => setForm(prev => ({ ...prev, projectId: event.target.value }))}
            >
              <option value="">{t("form.anyProject")}</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2">
              <Input
                label={t("form.descriptionPlaceholder")}
                value={form.description}
                onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving || !form.name.trim()}>
                {saving ? tCommon("loading") : t("form.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("tableTitle")}</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-neutral-500">{tCommon("loading")}</p>
          ) : automations.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("empty")}</p>
          ) : (
            <div className="space-y-3">
              {automations.map(automation => (
                <div key={automation.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">{automation.name}</div>
                      <div className="text-xs text-neutral-500">
                        {t(`triggers.${automation.trigger}`)} · {t(`channels_${automation.channel}`)}
                      </div>
                      {automation.description && (
                        <div className="mt-1 text-xs text-neutral-500">{automation.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={statusColors[automation.status]}>
                        {t(`status.${automation.status}`)}
                      </Badge>
                      <Button size="sm" variant="secondary" onClick={() => cycleStatus(automation)}>
                        {t("cycle")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
