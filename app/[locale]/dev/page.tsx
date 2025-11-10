"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ImageUploader } from "@/components/ImageUploader";
import { AttributesList } from "@/components/AttributesList";
import { SpecsEditor } from "@/components/SpecsEditor";
import { ZoneEditor } from "@/components/ZoneEditor";
import { DocumentUploader } from "@/components/DocumentUploader";
import { DocumentList } from "@/components/DocumentList";
import { api } from "@/lib/api";
import { ListingType, Project, ProjectStatus, ProjectDocument } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";
import { VideoPlayer } from "@/components/VideoPlayer";

type ProjectWithRound = Project & { round?: any };

export default function DevPanel() {
  const t = useTranslations("dev");
  const tCommon = useTranslations("common");
  const tMessages = useTranslations("messages");
  const tStatus = useTranslations("status");
  const tVal = useTranslations("dev.validation");
  const tProject = useTranslations("project");
  const locale = useLocale();
  const { show } = useToast();
  const [devId] = useState("d1");
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [projects, setProjects] = useState<ProjectWithRound[]>([]);
  const [editingProject, setEditingProject] = useState<ProjectWithRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Proyecto
  const [pName, setPName] = useState("");
  const [pCity, setPCity] = useState("CDMX");
  const [pCountry, setPCountry] = useState("MX");
  const [pCurrency, setPCurrency] = useState<"USD"|"MXN">("USD");
  const [pDesc, setPDesc] = useState("");
  const [pListingType, setPListingType] = useState<ListingType>("presale");
  const [pImages, setPImages] = useState<string[]>([]);
  const [pVideoUrl, setPVideoUrl] = useState("");
  const [pTotalUnits, setPTotalUnits] = useState<number | "">("");
  const [pAttributes, setPAttributes] = useState<string[]>([]);
  const [pSpecs, setPSpecs] = useState<Record<string, string>>({});
  const [pZone, setPZone] = useState<{
    summary?: string;
    golf?: string[];
    schools?: string[];
    transport?: string[];
    retail?: string[];
  }>({});
  const [pPropertyType, setPPropertyType] = useState("");
  const [pPropertyPrice, setPPropertyPrice] = useState<number | "">("");
  const [pDevelopmentStage, setPDevelopmentStage] = useState("");
  const [pPropertyDetails, setPPropertyDetails] = useState<{
    bedrooms?: number;
    bathrooms?: number;
    halfBathrooms?: number;
    surfaceArea?: number;
    parkingSpaces?: number;
    floors?: number;
  }>({});

  const videoUrlPreview = pVideoUrl.trim();

  const handleListingTypeChange = (value: ListingType) => {
    setPListingType(value);
    if (value === "sale") {
      setErrors(prev => {
        const { goalValue, deposit, slotsPerPerson, deadlineDays, ...rest } = prev;
        return rest;
      });
    }
  };

  // Ronda
  const [goalType, setGoalType] = useState<"reservations"|"amount">("reservations");
  const [goalValue, setGoalValue] = useState(30);
  const [deposit, setDeposit] = useState(500);
  const [slotsPerPerson, setSlotsPerPerson] = useState(3);
  const [deadlineDays, setDeadlineDays] = useState(14);
  const [rule, setRule] = useState<"all_or_nothing"|"partial">("all_or_nothing");
  const [groupSlots, setGroupSlots] = useState<number | "">("");

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.listProjects();
      if (res.ok) {
        const myProjects = res.data.filter((p: any) => p.developerId === devId);
        setProjects(myProjects);
      }
    } catch (e: any) {
      show(e.message || t("messages.loadError"), tMessages("error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "list") loadProjects();
  }, [view]);

  const loadDocuments = async (projectId: string) => {
    if (!projectId) return;
    setLoadingDocuments(true);
    try {
      const res = await fetch(`/api/documents?projectId=${projectId}`).then(r => r.json());
      if (res.ok) {
        setDocuments(res.data || []);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm(t("deleteDocumentConfirm"))) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" }).then(r => r.json());
      if (!res.ok) throw new Error(res.error);
      show(t("documentDeleted"), tMessages("success"));
      if (editingProject) {
        loadDocuments(editingProject.id);
      }
    } catch (error: any) {
      show(error.message || t("documentDeleteError"), tMessages("error"));
    }
  };

  const resetForm = (initialListingType: ListingType = "presale") => {
    setPName("");
    setPCity("CDMX");
    setPCountry("MX");
    setPCurrency("USD");
    setPDesc("");
    setPListingType(initialListingType);
    setPImages([]);
    setPVideoUrl("");
    setPTotalUnits("");
    setPAttributes([]);
    setPSpecs({});
    setPZone({});
    setPPropertyType("");
    setPPropertyPrice("");
    setPDevelopmentStage("");
    setPPropertyDetails({});
    setGoalValue(30);
    setDeposit(500);
    setSlotsPerPerson(3);
    setDeadlineDays(14);
    setRule("all_or_nothing");
    setGroupSlots("");
    setErrors({});
    setEditingProject(null);
  };

  const startEdit = (project: ProjectWithRound) => {
    setEditingProject(project);
    setPName(project.name);
    setPCity(project.city);
    setPCountry(project.country);
    setPCurrency(project.currency);
    setPDesc(project.description);
    setPListingType(project.listingType || "presale");
    setPImages(project.images || []);
    setPVideoUrl(project.videoUrl || "");
    setPTotalUnits(project.totalUnits || "");
    setPAttributes(project.attributes || []);
    setPSpecs(project.specs || {});
    setPZone(project.zone || {});
    setPPropertyType(project.propertyType || "");
    if (project.listingType === "sale") {
      setPPropertyPrice(project.askingPrice ?? project.propertyPrice ?? "");
    } else {
      setPPropertyPrice(project.propertyPrice || "");
    }
    setPDevelopmentStage(project.developmentStage || "");
    setPPropertyDetails(project.propertyDetails || {});
    
    if (project.round) {
      const r = project.round;
      setGoalType(r.goalType);
      setGoalValue(r.goalValue);
      setDeposit(r.depositAmount);
      setSlotsPerPerson(r.slotsPerPerson);
      const days = Math.ceil((new Date(r.deadlineAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      setDeadlineDays(Math.max(1, days));
      setRule(r.rule);
      setGroupSlots(r.groupSlots || "");
    }
    
    setView("edit");
  };

  const startCreate = (type: ListingType) => {
    resetForm(type);
    setView("create");
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!pName.trim()) newErrors.name = tVal("nameRequired");
    if (!pCity.trim()) newErrors.city = tVal("cityRequired");
    if (!pCountry.trim()) newErrors.country = tVal("countryRequired");
    if (!pDesc.trim()) newErrors.description = tVal("descriptionRequired");
    if (pImages.length === 0) newErrors.images = tVal("imagesRequired");
    if (pListingType === "presale") {
      if (goalValue <= 0) newErrors.goalValue = tVal("goalValueRequired");
      if (deposit <= 0) newErrors.deposit = tVal("depositRequired");
      if (slotsPerPerson <= 0) newErrors.slotsPerPerson = tVal("slotsPerPersonRequired");
      if (deadlineDays <= 0) newErrors.deadlineDays = tVal("deadlineDaysRequired");
    }
    
    // Validaciones opcionales pero con formato correcto
    if (pTotalUnits !== "" && (typeof pTotalUnits !== "number" || pTotalUnits <= 0)) {
      newErrors.totalUnits = tVal("totalUnitsInvalid");
    }
    if (groupSlots !== "" && (typeof groupSlots !== "number" || groupSlots <= 0)) {
      newErrors.groupSlots = tVal("groupSlotsInvalid");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      show(tVal("validationError"), tMessages("error"));
      return;
    }

    setLoading(true);
    try {
      let projectId = editingProject?.id;

          // Preparar datos del proyecto
          const projectData: any = {
            name: pName.trim(),
            city: pCity.trim(),
            country: pCountry.trim(),
            currency: pCurrency,
            description: pDesc.trim(),
            images: pImages,
            videoUrl: pVideoUrl.trim() || undefined,
            totalUnits: pTotalUnits ? Number(pTotalUnits) : undefined,
            attributes: pAttributes.length > 0 ? pAttributes : undefined,
            specs: Object.keys(pSpecs).length > 0 ? pSpecs : undefined,
            zone: Object.keys(pZone).length > 0 || pZone.summary ? pZone : undefined,
            propertyType: pPropertyType.trim() || undefined,
            propertyPrice: pPropertyPrice ? Number(pPropertyPrice) : undefined,
            developmentStage: pDevelopmentStage.trim() || undefined,
            propertyDetails: Object.keys(pPropertyDetails).length > 0 ? pPropertyDetails : undefined,
            listingType: pListingType
          };

          if (pListingType === "sale") {
            projectData.availabilityStatus = "available";
            projectData.askingPrice = pPropertyPrice ? Number(pPropertyPrice) : undefined;
          } else {
            projectData.askingPrice = undefined;
          }

      if (editingProject) {
        // Actualizar proyecto existente
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData)
        }).then(r => r.json());

        if (!res.ok) throw new Error(res.error);
      } else {
        // Crear nuevo proyecto
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...projectData,
            listingType: pListingType,
            developerId: devId
          })
        }).then(r => r.json());

        if (!res.ok) throw new Error(res.error);
        projectId = res.data.id;
      }

      // Crear/actualizar ronda solo si no existe o si estamos editando
      if (pListingType === "presale") {
        const roundData: any = {
          projectId,
          goalType,
          goalValue,
          depositAmount: deposit,
          slotsPerPerson,
          deadlineAt: new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString(),
          rule,
          partialThreshold: 0.7,
          groupSlots: groupSlots ? Number(groupSlots) : null
        };

        const round = await fetch("/api/rounds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roundData)
        }).then(r => r.json());

        if (!round.ok) throw new Error(round.error);
      }
      
      const successMessage = editingProject
        ? t("messages.projectUpdated")
        : pListingType === "presale"
          ? t("messages.projectCreated")
          : t("messages.projectCreatedSale");

      show(successMessage, tMessages("success"));
      
      resetForm();
      setView("list");
      loadProjects();
    } catch (e: any) {
      show(e.message || t("messages.projectSaveError"), tMessages("error"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const map: Record<ProjectStatus, { color: "neutral" | "green" | "yellow"; text: string }> = {
      draft: { color: "neutral", text: tStatus("draft") },
      review: { color: "yellow", text: tStatus("review") },
      published: { color: "green", text: tStatus("published") }
    };
    const config = map[status];
    return <Badge color={config.color}>{config.text}</Badge>;
  };

  if (view === "list") {
    const presaleProjects = projects.filter(project => project.listingType !== "sale");
    const saleProjects = projects.filter(project => project.listingType === "sale");

    const renderProjectCard = (project: ProjectWithRound) => {
      const isPresale = project.listingType !== "sale";
      const salePrice = project.askingPrice ?? project.propertyPrice;
      let availability: string | undefined;
      if (project.availabilityStatus) {
        try {
          availability = tProject(`availability.${project.availabilityStatus}` as const);
        } catch {
          availability = project.availabilityStatus;
        }
      }

      return (
        <Card key={project.id}>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-lg">{project.name}</div>
                <Badge color={isPresale ? "green" : "neutral"}>
                  {t(`listingType.${isPresale ? "presale" : "sale"}`)}
                </Badge>
                {getStatusBadge(project.status)}
              </div>
              <div className="text-sm text-neutral-600">
                {project.city}, {project.country} • {project.currency}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => startEdit(project)} variant="secondary" size="sm">
                {tCommon("edit")}
              </Button>
              <Link
                href={`/p/${project.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand hover:underline flex items-center"
              >
                {t("round.view")}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-neutral-700">{project.description}</p>
            {isPresale ? (
              project.round ? (
                <div className="text-sm text-neutral-600">
                  {t("round.round")}: {project.round.goalType === "reservations"
                    ? `${project.round.goalValue} ${t("goalTypes.reservations").toLowerCase()}`
                    : fmtCurrency(project.round.goalValue, project.currency, locale)} •
                  {t("round.deposit")}: {fmtCurrency(project.round.depositAmount, project.currency, locale)}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">{t("round.noRound")}</div>
              )
            ) : (
              <div className="text-sm text-neutral-600 space-y-1">
                {salePrice ? (
                  <div>{t("sections.salePrice", { price: fmtCurrency(salePrice, project.currency, locale) })}</div>
                ) : (
                  <div className="text-neutral-500">{t("sections.saleMissingPrice")}</div>
                )}
                {availability && (
                  <div>{t("sections.saleAvailability", { status: availability })}</div>
                )}
                {project.propertyType && (
                  <div>{t("sections.saleType", { type: project.propertyType })}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl">{t("title")}</h1>
            <p className="text-sm text-neutral-600">{t("listDescription")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => startCreate("presale")}>
              {t("newPresale")}
            </Button>
            <Button onClick={() => startCreate("sale")} variant="secondary">
              {t("newSale")}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-600">{tCommon("loading")}</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <p className="text-neutral-600">{t("noProjects")}</p>
              <div className="flex flex-col sm:flex-row sm:justify-center gap-2">
                <Button onClick={() => startCreate("presale")}>
                  {t("newPresale")}
                </Button>
                <Button onClick={() => startCreate("sale")} variant="secondary">
                  {t("newSale")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">{t("sections.presaleHeading")}</h2>
                <p className="text-sm text-neutral-600">{t("sections.presaleSubheading")}</p>
              </div>
              {presaleProjects.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center space-y-3">
                    <p className="text-neutral-600">{t("sections.noPresale")}</p>
                    <Button onClick={() => startCreate("presale")} size="sm">
                      {t("newPresale")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {presaleProjects.map(renderProjectCard)}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">{t("sections.saleHeading")}</h2>
                <p className="text-sm text-neutral-600">{t("sections.saleSubheading")}</p>
              </div>
              {saleProjects.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center space-y-3">
                    <p className="text-neutral-600">{t("sections.noSale")}</p>
                    <Button onClick={() => startCreate("sale")} size="sm" variant="secondary">
                      {t("newSale")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {saleProjects.map(renderProjectCard)}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">{editingProject ? t("editProject") : t("createProject")}</h1>
        <Button variant="secondary" onClick={() => { resetForm(); setView("list"); }}>
          {t("backToList")}
        </Button>
      </div>

      <Card>
        <CardHeader><h2 className="text-lg">{t("projectInfo")}</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">{t("fields.name")}</label>
              <Input value={pName} onChange={e => { setPName(e.target.value); setErrors({...errors, name: ""}); }} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t("fields.city")}</label>
              <Input value={pCity} onChange={e => { setPCity(e.target.value); setErrors({...errors, city: ""}); }} />
              {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t("fields.country")}</label>
              <Input value={pCountry} onChange={e => { setPCountry(e.target.value); setErrors({...errors, country: ""}); }} />
              {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">{t("fields.currency")}</label>
              <Select value={pCurrency} onChange={e => setPCurrency(e.target.value as any)}>
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">{t("fields.description")}</label>
            <textarea
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-brand focus:ring-1 focus:ring-brand min-h-[100px]"
              value={pDesc}
              onChange={e => { setPDesc(e.target.value); setErrors({...errors, description: ""}); }}
              placeholder={t("fields.descriptionPlaceholder")}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">{t("fields.listingType")}</label>
            <Select value={pListingType} onChange={e => handleListingTypeChange(e.target.value as ListingType)}>
              <option value="presale">{t("listingType.presale")}</option>
              <option value="sale">{t("listingType.sale")}</option>
            </Select>
            <p className="text-xs text-neutral-500 mt-1">{t(`listingTypeHelp.${pListingType}`)}</p>
          </div>

          <ImageUploader images={pImages} onChange={(imgs) => { setPImages(imgs); setErrors({...errors, images: ""}); }} />
          {errors.images && <p className="text-xs text-red-600">{errors.images}</p>}

          <div>
            <label className="text-sm font-medium">{t("fields.videoUrl")}</label>
            <Input
              type="url"
              placeholder={t("fields.videoUrlPlaceholder")}
              value={pVideoUrl}
              onChange={e => setPVideoUrl(e.target.value)}
            />
            <p className="text-xs text-neutral-500 mt-1">{t("fields.videoUrlHelp")}</p>
            {videoUrlPreview ? (
              <div className="mt-3">
                <VideoPlayer url={videoUrlPreview} />
              </div>
            ) : null}
          </div>

          <hr className="my-4"/>
          
          <h3 className="font-medium text-lg">{t("financialInfo")}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Unidades totales</label>
              <Input
                type="number"
                min="1"
                placeholder="Ej: 120"
                value={pTotalUnits}
                onChange={e => setPTotalUnits(e.target.value ? parseInt(e.target.value, 10) : "")}
              />
              <p className="text-xs text-neutral-500 mt-1">Número total de unidades del desarrollo</p>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de propiedad</label>
              <Select
                value={pPropertyType}
                onChange={e => setPPropertyType(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="Departamentos">Departamentos</option>
                <option value="Casas">Casas</option>
                <option value="Lotes">Lotes</option>
                <option value="Villa">Villa</option>
                <option value="Townhouses">Townhouses</option>
                <option value="Condominios">Condominios</option>
                <option value="Otro">Otro</option>
              </Select>
              {pPropertyType === "Otro" && (
                <Input
                  type="text"
                  placeholder="Especificar tipo de propiedad"
                  value={pPropertyType}
                  onChange={e => setPPropertyType(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Costo de la propiedad ({pCurrency})</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej: 250000"
                value={pPropertyPrice}
                onChange={e => setPPropertyPrice(e.target.value ? parseFloat(e.target.value) : "")}
              />
              <p className="text-xs text-neutral-500 mt-1">Precio por unidad/propiedad</p>
            </div>
            <div>
              <label className="text-sm font-medium">Etapa de desarrollo</label>
              <Select
                value={pDevelopmentStage}
                onChange={e => setPDevelopmentStage(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="Preventa">Preventa</option>
                <option value="Pre-construcción">Pre-construcción</option>
                <option value="Construcción">Construcción</option>
                <option value="Entrega">Entrega</option>
                <option value="Post-entrega">Post-entrega</option>
                <option value="Otro">Otro</option>
              </Select>
              {pDevelopmentStage === "Otro" && (
                <Input
                  type="text"
                  placeholder="Especificar etapa"
                  value={pDevelopmentStage}
                  onChange={e => setPDevelopmentStage(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <hr className="my-4"/>

          <h3 className="font-medium text-lg">Detalles de la propiedad (opcional)</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Recámaras</label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 3"
                value={pPropertyDetails.bedrooms || ""}
                onChange={e => setPPropertyDetails({
                  ...pPropertyDetails,
                  bedrooms: e.target.value ? parseInt(e.target.value, 10) : undefined
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Baños completos</label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={pPropertyDetails.bathrooms || ""}
                onChange={e => setPPropertyDetails({
                  ...pPropertyDetails,
                  bathrooms: e.target.value ? parseInt(e.target.value, 10) : undefined
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Medios baños</label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 1"
                value={pPropertyDetails.halfBathrooms || ""}
                onChange={e => setPPropertyDetails({
                  ...pPropertyDetails,
                  halfBathrooms: e.target.value ? parseInt(e.target.value, 10) : undefined
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Superficie (m²)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej: 120.5"
                value={pPropertyDetails.surfaceArea || ""}
                onChange={e => setPPropertyDetails({
                  ...pPropertyDetails,
                  surfaceArea: e.target.value ? parseFloat(e.target.value) : undefined
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estacionamientos</label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={pPropertyDetails.parkingSpaces || ""}
                onChange={e => setPPropertyDetails({
                  ...pPropertyDetails,
                  parkingSpaces: e.target.value ? parseInt(e.target.value, 10) : undefined
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Niveles/Pisos</label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2"
                value={pPropertyDetails.floors || ""}
                onChange={e => setPPropertyDetails({
                  ...pPropertyDetails,
                  floors: e.target.value ? parseInt(e.target.value, 10) : undefined
                })}
              />
            </div>
          </div>

          <hr className="my-4"/>

          <AttributesList attributes={pAttributes} onChange={setPAttributes} />

          <hr className="my-4"/>

          <SpecsEditor specs={pSpecs} onChange={setPSpecs} />

          <hr className="my-4"/>

          <ZoneEditor zone={pZone} onChange={setPZone} />

          {pListingType === "presale" ? (
            <>
              <hr className="my-4"/>

              <h3 className="font-medium text-lg">{t("roundInfo")}</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">{t("fields.goalType")}</label>
                  <Select value={goalType} onChange={e => setGoalType(e.target.value as any)}>
                    <option value="reservations">{t("goalTypes.reservations")}</option>
                    <option value="amount">{t("goalTypes.amount")}</option>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("fields.goalValue")}</label>
                  <Input
                    type="number"
                    min="1"
                    value={goalValue}
                    onChange={e => { setGoalValue(parseInt(e.target.value || "0", 10)); setErrors({...errors, goalValue: ""}); }}
                  />
                  {errors.goalValue && <p className="text-xs text-red-600 mt-1">{errors.goalValue}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">{t("fields.depositAmount")}</label>
                  <Input
                    type="number"
                    min="1"
                    value={deposit}
                    onChange={e => { setDeposit(parseInt(e.target.value || "0", 10)); setErrors({...errors, deposit: ""}); }}
                  />
                  {errors.deposit && <p className="text-xs text-red-600 mt-1">{errors.deposit}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">{t("fields.slotsPerPerson")}</label>
                  <Input
                    type="number"
                    min="1"
                    value={slotsPerPerson}
                    onChange={e => { setSlotsPerPerson(parseInt(e.target.value || "1", 10)); setErrors({...errors, slotsPerPerson: ""}); }}
                  />
                  {errors.slotsPerPerson && <p className="text-xs text-red-600 mt-1">{errors.slotsPerPerson}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">{t("fields.deadlineDays")}</label>
                  <Input
                    type="number"
                    min="1"
                    value={deadlineDays}
                    onChange={e => { setDeadlineDays(parseInt(e.target.value || "14", 10)); setErrors({...errors, deadlineDays: ""}); }}
                  />
                  {errors.deadlineDays && <p className="text-xs text-red-600 mt-1">{errors.deadlineDays}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">{t("fields.rule")}</label>
                  <Select value={rule} onChange={e => setRule(e.target.value as any)}>
                    <option value="all_or_nothing">{t("rules.allOrNothing")}</option>
                    <option value="partial">{t("rules.partial")}</option>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("fields.groupSlots")}</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={t("fields.groupSlotsPlaceholder")}
                    value={groupSlots}
                    onChange={e => setGroupSlots(e.target.value ? parseInt(e.target.value, 10) : "")}
                  />
                  <p className="text-xs text-neutral-500 mt-1">{t("fields.groupSlotsHelp")}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <hr className="my-4"/>
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                {t("saleInfo")}
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => { resetForm(); setView("list"); }}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading
                ? t("messages.saving")
                : editingProject
                  ? t("messages.updateProject")
                  : t(pListingType === "presale" ? "messages.createProjectAndRound" : "messages.createSaleProject")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sección de documentos - solo se muestra cuando hay un proyecto editándose */}
      {editingProject && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">{t("projectDocuments")}</h3>
            <p className="text-sm text-neutral-600 mt-1">
              {t("projectDocumentsDescription")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentUploader
              projectId={editingProject.id}
              uploadedBy="u_dev_1"
              onDocumentAdded={() => loadDocuments(editingProject.id)}
            />
            {loadingDocuments ? (
              <div className="text-sm text-neutral-600 py-4">{t("loadingDocuments")}</div>
            ) : (
              <DocumentList
                documents={documents}
                onDelete={handleDeleteDocument}
                showDelete={true}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
