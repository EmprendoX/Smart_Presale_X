"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { fmtCurrency } from "@/lib/format";
import {
  ProjectStatus,
  AutomationWorkflow,
  IntelligentAgent,
  Community,
  ListingType
} from "@/lib/types";
import { api } from "@/lib/api";

const automationTriggers: AutomationWorkflow["trigger"][] = [
  "new_lead",
  "new_reservation",
  "milestone",
  "manual"
];

const automationChannels: AutomationWorkflow["channel"][] = ["email", "whatsapp", "slack", "crm"];

const personaOptions: IntelligentAgent["persona"][] = ["sales", "concierge", "community", "operations"];

const automationStatusColors: Record<AutomationWorkflow["status"], "neutral" | "green" | "yellow"> = {
  draft: "neutral",
  active: "green",
  paused: "yellow"
};

const agentStatusColors: Record<IntelligentAgent["status"], "neutral" | "green" | "yellow"> = {
  training: "neutral",
  ready: "green",
  paused: "yellow"
};

type ProjectWithRound = {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  listingType: ListingType;
  stage?: string;
  availabilityStatus?: string;
  automationReady?: boolean;
  agentIds?: string[];
  round?: any;
  createdAt: string;
  currency?: "USD" | "MXN";
};

type NewAutomationForm = {
  name: string;
  trigger: AutomationWorkflow["trigger"];
  channel: AutomationWorkflow["channel"];
  projectId: string;
  description: string;
};

type NewAgentForm = {
  name: string;
  persona: IntelligentAgent["persona"];
  playbook: string;
  languages: string;
  handoffEmail: string;
};

export default function Admin() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tMessages = useTranslations("messages");
  const tForms = useTranslations("forms");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const { show } = useToast();

  const [projects, setProjects] = useState<ProjectWithRound[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null);

  const [automations, setAutomations] = useState<AutomationWorkflow[]>([]);
  const [loadingAutomations, setLoadingAutomations] = useState(false);
  const [creatingAutomation, setCreatingAutomation] = useState(false);
  const [newAutomation, setNewAutomation] = useState<NewAutomationForm>({
    name: "",
    trigger: "new_lead",
    channel: "email",
    projectId: "",
    description: ""
  });

  const [agents, setAgents] = useState<IntelligentAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [newAgent, setNewAgent] = useState<NewAgentForm>({
    name: "",
    persona: "sales",
    playbook: "",
    languages: "es, en",
    handoffEmail: ""
  });

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    scope: "campaign" as Community["scope"],
    projectId: "",
    roundId: "",
    tags: "",
    coverImage: ""
  });

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects").then(r => r.json());
      if (res.ok) setProjects(res.data);
      else show(res.error, tMessages("error"));
    } catch (error: any) {
      show(error.message || t("messages.loadError"), tMessages("error"));
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadAutomations = async () => {
    setLoadingAutomations(true);
    const res = await api.listAutomations();
    if (res.ok) setAutomations(res.data);
    else show(res.error, tMessages("error"));
    setLoadingAutomations(false);
  };

  const loadAgents = async () => {
    setLoadingAgents(true);
    const res = await api.listAgents();
    if (res.ok) setAgents(res.data);
    else show(res.error, tMessages("error"));
    setLoadingAgents(false);
  };

  const loadCommunities = async () => {
    setLoadingCommunities(true);
    const res = await api.listCommunities();
    if (res.ok) setCommunities(res.data);
    else show(res.error, tMessages("error"));
    setLoadingCommunities(false);
  };

  useEffect(() => {
    loadProjects();
    loadAutomations();
    loadAgents();
    loadCommunities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (newCommunity.scope !== "campaign") return;
    const project = projects.find(p => p.id === newCommunity.projectId);
    const nextRoundId = project?.round?.id || "";
    setNewCommunity(prev => {
      if (prev.roundId === nextRoundId) return prev;
      return { ...prev, roundId: nextRoundId };
    });
  }, [newCommunity.scope, newCommunity.projectId, projects]);

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter(project => project.status === statusFilter);
  }, [projects, statusFilter]);

  const projectStats = useMemo(() => {
    const total = projects.length;
    const draft = projects.filter(p => p.status === "draft").length;
    const review = projects.filter(p => p.status === "review").length;
    const published = projects.filter(p => p.status === "published").length;
    const presale = projects.filter(p => p.listingType === "presale").length;
    const sale = projects.filter(p => p.listingType === "sale").length;
    return { total, draft, review, published, presale, sale };
  }, [projects]);

  const presaleProjects = useMemo(() => projects.filter(project => project.listingType === "presale"), [projects]);
  const selectedCommunityProject = useMemo(
    () => presaleProjects.find(project => project.id === newCommunity.projectId) || null,
    [presaleProjects, newCommunity.projectId]
  );

  const listingBadge = (listingType: ListingType) => (
    <Badge color={listingType === "presale" ? "green" : "neutral"}>
      {listingType === "presale" ? t("listingType.presale") : t("listingType.sale")}
    </Badge>
  );

  const publishProject = async (id: string) => {
    if (!confirm(t("publishConfirm"))) return;
    setUpdatingProjectId(id);
    try {
      const res = await api.publishProject(id);
      if (!res.ok) throw new Error(res.error);
      show(t("messages.projectPublished"), tMessages("success"));
      await loadProjects();
    } catch (error: any) {
      show(error.message || t("messages.updateError"), tMessages("error"));
    } finally {
      setUpdatingProjectId(null);
    }
  };

  const updateProjectStatus = async (id: string, status: ProjectStatus) => {
    setUpdatingProjectId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      }).then(r => r.json());
      if (!res.ok) throw new Error(res.error);
      show(t("messages.projectUpdated", { status: tStatus(status) }), tMessages("success"));
      await loadProjects();
    } catch (error: any) {
      show(error.message || t("messages.updateError"), tMessages("error"));
    } finally {
      setUpdatingProjectId(null);
    }
  };

  const closeRound = async (roundId?: string | null) => {
    if (!roundId) return;
    if (!confirm(t("closeRoundConfirm"))) return;
    const res = await api.closeRound(roundId);
    if (res.ok) {
      show(t("roundClosed", { status: res.data.status }), tMessages("success"));
      loadProjects();
    } else {
      show(res.error, tMessages("error"));
    }
  };

  const toggleAutomation = async (automation: AutomationWorkflow) => {
    const nextStatus = automation.status === "active" ? "paused" : "active";
    const res = await api.updateAutomation(automation.id, { status: nextStatus });
    if (res.ok) {
      show(t("automations.statusUpdated"), tMessages("success"));
      loadAutomations();
    } else {
      show(res.error, tMessages("error"));
    }
  };

  const handleCreateAutomation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingAutomation(true);
    try {
      const payload = {
        name: newAutomation.name,
        description: newAutomation.description,
        trigger: newAutomation.trigger,
        channel: newAutomation.channel,
        projectId: newAutomation.projectId || undefined
      };
      const res = await api.createAutomation(payload);
      if (!res.ok) throw new Error(res.error);
      show(t("automations.created"), tMessages("success"));
      setNewAutomation({ name: "", trigger: "new_lead", channel: "email", projectId: "", description: "" });
      loadAutomations();
    } catch (error: any) {
      show(error.message || t("messages.saveError"), tMessages("error"));
    } finally {
      setCreatingAutomation(false);
    }
  };

  const handleCreateAgent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingAgent(true);
    try {
      const payload = {
        name: newAgent.name,
        persona: newAgent.persona,
        playbook: newAgent.playbook,
        handoffEmail: newAgent.handoffEmail || undefined,
        languages: newAgent.languages
          .split(",")
          .map(v => v.trim())
          .filter(Boolean)
      };
      const res = await api.createAgent(payload as any);
      if (!res.ok) throw new Error(res.error);
      show(t("agents.created"), tMessages("success"));
      setNewAgent({ name: "", persona: "sales", playbook: "", languages: "es, en", handoffEmail: "" });
      loadAgents();
    } catch (error: any) {
      show(error.message || t("messages.saveError"), tMessages("error"));
    } finally {
      setCreatingAgent(false);
    }
  };

  const markAgentReady = async (agent: IntelligentAgent) => {
    const nextStatus = agent.status === "ready" ? "paused" : "ready";
    const res = await api.updateAgent(agent.id, { status: nextStatus });
    if (res.ok) {
      show(t("agents.statusUpdated"), tMessages("success"));
      loadAgents();
    } else {
      show(res.error, tMessages("error"));
    }
  };

  const projectTab = (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-600">{t("projects.subtitle")}</p>
        </div>
        <Select value={statusFilter} onChange={event => setStatusFilter(event.target.value as any)}>
          <option value="all">{t("filters.all")}</option>
          <option value="draft">{t("filters.draft")}</option>
          <option value="review">{t("filters.review")}</option>
          <option value="published">{t("filters.published")}</option>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4"><div className="text-xs text-neutral-600">{t("stats.totalProjects")}</div><div className="text-2xl font-semibold">{projectStats.total}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-neutral-600">{t("stats.presale")}</div><div className="text-2xl font-semibold">{projectStats.presale}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-neutral-600">{t("stats.sale")}</div><div className="text-2xl font-semibold">{projectStats.sale}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-neutral-600">{t("stats.published")}</div><div className="text-2xl font-semibold text-green-600">{projectStats.published}</div></CardContent></Card>
      </div>

      {loadingProjects ? (
        <p className="text-sm text-neutral-600">{tCommon("loading")}</p>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-neutral-600">
            {statusFilter === "all" ? t("noProjects") : t("noProjectsFiltered", { status: tStatus(statusFilter) })}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map(project => {
            const round = project.round;
            return (
              <Card key={project.id}>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-lg">{project.name}</div>
                      {listingBadge(project.listingType)}
                      {project.automationReady && <Badge color="green">{t("projects.automationReady")}</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-600">
                      <span>{t("created")}: {new Date(project.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "es-MX")}</span>
                      {project.stage && <span>· {project.stage}</span>}
                      {project.availabilityStatus && <span>· {t("projects.availability", { status: project.availabilityStatus })}</span>}
                    </div>
                    {project.agentIds?.length ? (
                      <div className="mt-1 text-xs text-neutral-500">
                        {t("projects.assignedAgents", { count: project.agentIds.length })}: {project.agentIds.join(", ")}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {project.status !== "published" && (
                      <Button size="sm" disabled={updatingProjectId === project.id} onClick={() => publishProject(project.id)}>
                        {updatingProjectId === project.id ? t("publishing") : t("publish")}
                      </Button>
                    )}
                    {project.status === "review" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={updatingProjectId === project.id}
                        onClick={() => updateProjectStatus(project.id, "draft")}
                      >
                        {updatingProjectId === project.id ? t("updating") : t("backToDraft")}
                      </Button>
                    )}
                    {project.status === "published" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={updatingProjectId === project.id}
                        onClick={() => updateProjectStatus(project.id, "review")}
                      >
                        {updatingProjectId === project.id ? t("updating") : t("unpublish")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <span className="text-neutral-500">{t("projects.type")}: </span>{project.listingType === "presale" ? t("listingType.presale") : t("listingType.sale")}
                    </div>
                    {project.stage && (
                      <div>
                        <span className="text-neutral-500">{t("projects.stage")}: </span>{project.stage}
                      </div>
                    )}
                    {project.currency && (
                      <div>
                        <span className="text-neutral-500">{t("projects.deposit")}: </span>
                        {round ? fmtCurrency(round.depositAmount, project.currency, locale) : "—"}
                      </div>
                    )}
                  </div>

                  {round ? (
                    <>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div>
                          <span className="text-neutral-500">{t("roundGoal")}:</span>{" "}
                          <span className="font-medium">
                            {round.goalType === "reservations"
                              ? `${round.goalValue} ${t("reservations")}`
                              : fmtCurrency(round.goalValue, project.currency || "USD", locale)}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">{t("deadline")}:</span>{" "}
                          <span className="font-medium">
                            {new Date(round.deadlineAt).toLocaleDateString(locale === "en" ? "en-US" : "es-MX", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                        {round.groupSlots && (
                          <div>
                            <span className="text-neutral-500">{t("presaleGroup")}:</span>{" "}
                            <span className="font-medium">{round.groupSlots} {t("slots")}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 border-t pt-3">
                        <Button size="sm" variant="secondary" onClick={() => closeRound(round.id)}>
                          {t("closeRound")}
                        </Button>
                        <a
                          className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
                          href={`/api/ics-round?roundId=${round.id}`}
                          download
                        >
                          {t("downloadIcs")}
                        </a>
                        <Link href={`/p/${project.slug}`} className="text-sm text-brand hover:underline" target="_blank" rel="noreferrer">
                          {t("viewProject")}
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-md border border-dashed p-3 text-sm text-neutral-600">
                      {t("noRound")}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const automationsTab = (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-neutral-600">{t("automations.total")}</div>
            <div className="text-2xl font-semibold">{automations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-neutral-600">{t("automations.active")}</div>
            <div className="text-2xl font-semibold text-green-600">{automations.filter(a => a.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-neutral-600">{t("automations.channels")}</div>
            <div className="text-2xl font-semibold">{Array.from(new Set(automations.map(a => a.channel))).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("automations.createTitle")}</h2>
          <p className="text-sm text-neutral-600">{t("automations.createDescription")}</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateAutomation}>
            <div className="md:col-span-2">
              <Input
                value={newAutomation.name}
                onChange={event => setNewAutomation(prev => ({ ...prev, name: event.target.value }))}
                placeholder={t("automations.form.namePlaceholder")}
                required
              />
            </div>
            <Select
              value={newAutomation.trigger}
              onChange={event => setNewAutomation(prev => ({ ...prev, trigger: event.target.value as AutomationWorkflow["trigger"] }))}
            >
              {automationTriggers.map(trigger => (
                <option key={trigger} value={trigger}>{t(`automations.triggers.${trigger}`)}</option>
              ))}
            </Select>
            <Select
              value={newAutomation.channel}
              onChange={event => setNewAutomation(prev => ({ ...prev, channel: event.target.value as AutomationWorkflow["channel"] }))}
            >
              {automationChannels.map(channel => (
                <option key={channel} value={channel}>{t(`automations.channels_${channel}`)}</option>
              ))}
            </Select>
            <Select
              value={newAutomation.projectId}
              onChange={event => setNewAutomation(prev => ({ ...prev, projectId: event.target.value }))}
            >
              <option value="">{t("automations.form.anyProject")}</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </Select>
            <textarea
              className="md:col-span-2 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              rows={3}
              placeholder={t("automations.form.descriptionPlaceholder")}
              value={newAutomation.description}
              onChange={event => setNewAutomation(prev => ({ ...prev, description: event.target.value }))}
            />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={creatingAutomation || !newAutomation.name.trim()}>
                {creatingAutomation ? tCommon("loading") : t("automations.form.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {loadingAutomations ? (
          <p className="text-sm text-neutral-600">{tCommon("loading")}</p>
        ) : automations.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-neutral-600">{t("automations.empty")}</CardContent></Card>
        ) : (
          automations.map(auto => (
            <Card key={auto.id}>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{auto.name}</h3>
                    <Badge color={automationStatusColors[auto.status]}>{t(`automations.status.${auto.status}`)}</Badge>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {t(`automations.triggers.${auto.trigger}`)} · {t(`automations.channels_${auto.channel}`)}
                    {auto.projectId && (
                      <>
                        {" · "}
                        {projects.find(p => p.id === auto.projectId)?.name || auto.projectId}
                      </>
                    )}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => toggleAutomation(auto)}>
                  {auto.status === "active" ? t("automations.pause") : t("automations.activate")}
                </Button>
              </CardHeader>
              {auto.description && (
                <CardContent className="text-sm text-neutral-700">{auto.description}</CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const agentsTab = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("agents.createTitle")}</h2>
          <p className="text-sm text-neutral-600">{t("agents.createDescription")}</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateAgent}>
            <Input
              value={newAgent.name}
              onChange={event => setNewAgent(prev => ({ ...prev, name: event.target.value }))}
              placeholder={t("agents.form.name")}
              required
            />
            <Select
              value={newAgent.persona}
              onChange={event => setNewAgent(prev => ({ ...prev, persona: event.target.value as IntelligentAgent["persona"] }))}
            >
              {personaOptions.map(persona => (
                <option key={persona} value={persona}>{t(`agents.persona.${persona}`)}</option>
              ))}
            </Select>
            <textarea
              className="md:col-span-2 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              rows={3}
              placeholder={t("agents.form.playbook")}
              value={newAgent.playbook}
              onChange={event => setNewAgent(prev => ({ ...prev, playbook: event.target.value }))}
              required
            />
            <Input
              value={newAgent.languages}
              onChange={event => setNewAgent(prev => ({ ...prev, languages: event.target.value }))}
              placeholder={t("agents.form.languages")}
            />
            <Input
              value={newAgent.handoffEmail}
              onChange={event => setNewAgent(prev => ({ ...prev, handoffEmail: event.target.value }))}
              placeholder={t("agents.form.handoff")}
            />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={creatingAgent || !newAgent.name.trim() || !newAgent.playbook.trim()}>
                {creatingAgent ? tCommon("loading") : t("agents.form.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loadingAgents ? (
        <p className="text-sm text-neutral-600">{tCommon("loading")}</p>
      ) : agents.length === 0 ? (
        <Card><CardContent className="py-6 text-center text-neutral-600">{t("agents.empty")}</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {agents.map(agent => (
            <Card key={agent.id}>
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{agent.name}</h3>
                  <Badge color={agentStatusColors[agent.status]}>{t(`agents.status.${agent.status}`)}</Badge>
                </div>
                <div className="text-xs text-neutral-500">
                  {t(`agents.persona.${agent.persona}`)} · {agent.languages.join(", ")}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-700">
                <p>{agent.playbook}</p>
                {agent.projectIds?.length ? (
                  <p className="text-xs text-neutral-500">{t("agents.projects")}: {agent.projectIds.join(", ")}</p>
                ) : null}
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => markAgentReady(agent)}>
                    {agent.status === "ready" ? t("agents.pause") : t("agents.activate")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const handleCreateCommunity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newCommunity.name.trim();
    const description = newCommunity.description.trim();
    if (!name || !description) {
      show(tForms("required"), tMessages("error"));
      return;
    }

    setCreatingCommunity(true);
    try {
      const payload: any = {
        name,
        description,
        scope: newCommunity.scope
      };

      if (newCommunity.scope === "campaign" && newCommunity.projectId) {
        payload.projectId = newCommunity.projectId;
      }
      if (newCommunity.scope === "campaign" && newCommunity.roundId) {
        payload.roundId = newCommunity.roundId;
      }

      const tags = newCommunity.tags.split(",").map(tag => tag.trim()).filter(Boolean);
      if (tags.length) payload.tags = tags;

      const coverImage = newCommunity.coverImage.trim();
      if (coverImage) payload.coverImage = coverImage;

      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (!res.ok) throw new Error(res.error || t("communities.form.error"));

      show(t("communities.form.success"), tMessages("success"));
      setNewCommunity(prev => ({
        ...prev,
        name: "",
        description: "",
        tags: "",
        coverImage: "",
        projectId: prev.scope === "campaign" ? prev.projectId : "",
        roundId: prev.scope === "campaign" ? prev.roundId : ""
      }));
      await loadCommunities();
    } catch (error: any) {
      show(error.message || t("communities.form.error"), tMessages("error"));
    } finally {
      setCreatingCommunity(false);
    }
  };

  const communitiesTab = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("communities.createTitle")}</h2>
          <p className="text-sm text-neutral-600">{t("communities.createDescription")}</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={handleCreateCommunity}>
            <Input
              value={newCommunity.name}
              onChange={event => setNewCommunity(prev => ({ ...prev, name: event.target.value }))}
              placeholder={t("communities.form.name")}
              required
            />
            <textarea
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-brand focus:ring-1 focus:ring-brand min-h-[90px]"
              value={newCommunity.description}
              onChange={event => setNewCommunity(prev => ({ ...prev, description: event.target.value }))}
              placeholder={t("communities.form.description")}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{t("communities.form.scope")}</label>
                <Select
                  value={newCommunity.scope}
                  onChange={event => {
                    const scope = event.target.value as Community["scope"];
                    setNewCommunity(prev => ({
                      ...prev,
                      scope,
                      projectId: scope === "campaign" ? prev.projectId : "",
                      roundId: scope === "campaign" ? prev.roundId : ""
                    }));
                  }}
                >
                  <option value="campaign">{t("communities.form.scopeOptions.campaign")}</option>
                  <option value="global">{t("communities.form.scopeOptions.global")}</option>
                </Select>
                <p className="mt-1 text-xs text-neutral-500">{t("communities.form.scopeHelp")}</p>
              </div>
              {newCommunity.scope === "campaign" ? (
                <div>
                  <label className="text-sm font-medium">{t("communities.form.project")}</label>
                  <Select
                    value={newCommunity.projectId}
                    onChange={event => setNewCommunity(prev => ({ ...prev, projectId: event.target.value }))}
                    disabled={presaleProjects.length === 0}
                  >
                    <option value="">{tForms("selectOption")}</option>
                    {presaleProjects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-neutral-500">{t("communities.form.projectHelp")}</p>
                </div>
              ) : null}
              {newCommunity.scope === "campaign" ? (
                <div>
                  <label className="text-sm font-medium">{t("communities.form.round")}</label>
                  <Select
                    value={newCommunity.roundId}
                    onChange={event => setNewCommunity(prev => ({ ...prev, roundId: event.target.value }))}
                    disabled={!selectedCommunityProject?.round}
                  >
                    <option value="">{tForms("selectOption")}</option>
                    {selectedCommunityProject?.round ? (
                      <option value={selectedCommunityProject.round.id}>
                        {selectedCommunityProject.round.goalType === "reservations"
                          ? `${selectedCommunityProject.round.goalValue} ${t("projects.reservations")}`
                          : fmtCurrency(selectedCommunityProject.round.goalValue, selectedCommunityProject.currency || "USD", locale)}
                      </option>
                    ) : null}
                  </Select>
                  <p className="mt-1 text-xs text-neutral-500">{t("communities.form.roundHelp")}</p>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">{t("communities.form.tags")}</label>
                <Input
                  value={newCommunity.tags}
                  onChange={event => setNewCommunity(prev => ({ ...prev, tags: event.target.value }))}
                  placeholder="tag1, tag2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("communities.form.coverImage")}</label>
                <Input
                  type="url"
                  value={newCommunity.coverImage}
                  onChange={event => setNewCommunity(prev => ({ ...prev, coverImage: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={creatingCommunity || !newCommunity.name.trim() || !newCommunity.description.trim()}
              >
                {creatingCommunity ? t("communities.form.creating") : t("communities.form.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loadingCommunities ? (
        <p className="text-sm text-neutral-600">{tCommon("loading")}</p>
      ) : communities.length === 0 ? (
        <Card><CardContent className="py-6 text-center text-neutral-600">{t("communities.empty")}</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {communities.map(community => (
            <Card key={community.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{community.name}</h3>
                  <Badge color={community.scope === "global" ? "green" : "neutral"}>
                    {community.scope === "global" ? t("communities.scope.global") : t("communities.scope.campaign")}
                  </Badge>
                </div>
                <div className="text-xs text-neutral-500">{t("communities.members", { count: community.memberCount })}</div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-700">
                <p>{community.description}</p>
                {community.tags?.length ? (
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                    {community.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-neutral-100 px-2 py-1">#{tag}</span>
                    ))}
                  </div>
                ) : null}
                <Link href={`/community/${community.slug}`} className="text-sm text-brand hover:underline">
                  {t("communities.open")}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-neutral-600">{t("subtitle")}</p>
      </div>
      <div className="flex justify-end">
        <Button variant="secondary" asChild>
          <Link href="/admin/payouts">{t("openPayouts")}</Link>
        </Button>
      </div>
      <Tabs
        tabs={[
          { key: "projects", label: t("tabs.projects"), content: projectTab },
          { key: "automations", label: t("tabs.automations"), content: automationsTab },
          { key: "agents", label: t("tabs.agents"), content: agentsTab },
          { key: "communities", label: t("tabs.communities"), content: communitiesTab }
        ]}
      />
    </div>
  );
}
