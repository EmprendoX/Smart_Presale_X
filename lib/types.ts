export type Role = "buyer" | "developer" | "admin";

export type Currency = "USD" | "MXN";

export type KycStatus = "none" | "basic" | "verified";

export type User = {
  id: string;
  name: string;
  role: Role;
  kycStatus: KycStatus;
  tenantId: string;
  email?: string;
  metadata?: Record<string, any> | null;
};

export type Developer = {
  id: string;
  userId: string;
  company: string;
  verifiedAt?: string | null;
  tenantId: string;
};

export type ProjectStatus = "draft" | "review" | "published";

export type ListingType = "presale" | "sale";

export type AvailabilityStatus = "available" | "reserved" | "sold" | "coming_soon";

export type ProjectSeo = {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  image?: string;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  currency: Currency;
  status: ProjectStatus;
  tenantId: string;
  images: string[];
  videoUrl?: string;
  description: string;
  developerId: string;
  createdAt: string;
  listingType: ListingType;
  stage?: string;
  availabilityStatus?: AvailabilityStatus;
  // NUEVO: apariencia de producto financiero / inventario / specs / zona
  ticker?: string;                 // p.ej. "SPS:ARRCF"
  totalUnits?: number;             // total de unidades del desarrollo
  attributes?: string[];           // amenidades/atributos (golf, alberca, etc.)
  specs?: Record<string, string>;  // "Superficie", "Entrega", "Régimen", etc.
  zone?: {
    summary?: string;
    golf?: string[];
    schools?: string[];
    transport?: string[];
    retail?: string[];
  };
  // Tipo de propiedad, costo y etapa
  propertyType?: string;           // "Departamentos", "Casas", "Lotes", "Villa", etc.
  propertyPrice?: number;          // costo por unidad/propiedad
  developmentStage?: string;       // "Preventa", "Construcción", "Entrega", etc.
  askingPrice?: number;            // precio listado (para venta directa)
  // Detalles de la propiedad
  propertyDetails?: {
    bedrooms?: number;             // Número de recámaras
    bathrooms?: number;             // Número de baños completos
    halfBathrooms?: number;        // Número de medios baños
    surfaceArea?: number;          // Superficie en m²
    parkingSpaces?: number;        // Número de estacionamientos
    floors?: number;               // Número de niveles/pisos
  };
  seo?: ProjectSeo;                // Metadatos para SEO
  tags?: string[];                 // etiquetas para filtros/búsqueda
  featured?: boolean;              // destacar en home
  automationReady?: boolean;       // bandera para integraciones
  agentIds?: string[];             // agentes inteligentes asignados
};

export type TenantStatus = "active" | "inactive" | "suspended";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  region?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantSettings = {
  id: string;
  tenantId: string;
  logoUrl?: string | null;
  darkLogoUrl?: string | null;
  squareLogoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  primaryColorForeground?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  surfaceColor?: string | null;
  foregroundColor?: string | null;
  fontFamily?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientStatus = "active" | "inactive" | "invited";

export type Client = {
  id: string;
  tenantId: string;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: ClientStatus;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
};

export type GoalType = "reservations" | "amount";

export type RoundRule = "all_or_nothing" | "partial";

export type RoundStatus = "open" | "nearly_full" | "closed" | "not_met" | "fulfilled";

export type Round = {
  id: string;
  projectId: string;
  goalType: GoalType;
  goalValue: number;
  depositAmount: number; // por slot
  slotsPerPerson: number;
  deadlineAt: string;    // ISO
  rule: RoundRule;
  partialThreshold: number; // 0.7 => 70%
  status: RoundStatus;
  createdAt: string;
  // NUEVO: disponibilidad declarada (para UI clara)
  groupSlots?: number | null;      // tamaño del "grupo de preventa" (si aplica)
};

export type ReservationStatus = "pending" | "confirmed" | "refunded" | "assigned" | "waitlisted";

export type Reservation = {
  id: string;
  roundId: string;
  userId: string;
  slots: number;
  amount: number;
  status: ReservationStatus;
  txId?: string;
  createdAt: string;
  leadSource?: string;
  campaign?: string | null;
  journeyStage?: "lead" | "nurturing" | "reserved" | "closed_won" | "closed_lost";
  lastEngagementAt?: string | null;
};

export type TransactionProvider = "simulated" | "stripe" | "escrow";

export type Transaction = {
  id: string;
  reservationId: string;
  provider: TransactionProvider;
  amount: number;
  currency: Currency;
  status: "pending" | "succeeded" | "refunded";
  payoutAt?: string | null;
  externalId?: string | null;
  metadata?: Record<string, any> | null;
  rawResponse?: Record<string, any> | null;
  clientSecret?: string | null;
  createdAt?: string;
};

export type PaymentWebhook = {
  id: string;
  provider: TransactionProvider;
  eventType: string;
  payload: Record<string, any>;
  reservationId?: string | null;
  transactionId?: string | null;
  processedAt?: string | null;
  receivedAt: string;
  status?: "pending" | "processed" | "ignored";
};

export type PayoutReportRow = {
  transactionId: string;
  reservationId: string;
  projectId: string;
  roundId: string;
  amount: number;
  currency: Currency;
  status: Transaction["status"];
  payoutAt?: string | null;
  provider: TransactionProvider;
};

export type DocumentType = "title" | "permit" | "terms";

export type DocumentAccess = "public" | "private";

export type ProjectDocument = {
  id: string;
  projectId: string;
  type?: DocumentType; // Mantener para compatibilidad
  url: string;
  access?: DocumentAccess; // Mantener para compatibilidad
  // Campos simplificados
  title: string; // Nombre/título del documento
  fileName: string; // Nombre original del archivo
  uploadedAt: string; // ISO date
  uploadedBy: string; // userId del desarrollador
};

export type ProgressSummary = {
  totalSlots: number;
  confirmedSlots: number;
  totalAmount: number;
  confirmedAmount: number;
  percent: number; // 0..100
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// === Mercado / Research (NUEVO) ===
export type PricePoint = { 
  ts: string; 
  price: number; 
  volume?: number;
};

export type ResearchItem = {
  id: string;
  projectId: string;
  type: "study" | "report" | "news" | "data";
  title: string;
  source?: string;
  url?: string;
  publishedAt?: string;
};

export type CommunityScope = "global" | "campaign";

export type CommunityPost = {
  id: string;
  title: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
};

export type CommunityThreadStatus = "pending" | "approved" | "flagged";

export type CommunityThread = {
  id: string;
  title: string;
  author: string;
  replies: number;
  lastActivityAt: string;
  status: CommunityThreadStatus;
  tags?: string[];
};

export type CommunityBadge = {
  id: string;
  label: string;
  description?: string;
  criteria: string;
};

export type CommunityNotificationChannel = {
  channel: "push" | "email" | "slack";
  enabled: boolean;
  lastTriggeredAt?: string | null;
};

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string;
  scope: CommunityScope;
  tenantId: string;
  projectId?: string;
  roundId?: string;
  coverImage?: string;
  tags?: string[];
  memberCount: number;
  featuredPosts?: CommunityPost[];
  moderators?: string[];
  threads?: CommunityThread[];
  badges?: CommunityBadge[];
  notificationChannels?: CommunityNotificationChannel[];
  pushTopic?: string;
};

export type AutomationTrigger = "new_lead" | "new_reservation" | "milestone" | "manual";

export type AutomationChannel = "email" | "whatsapp" | "slack" | "crm";

export type AutomationWorkflow = {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "paused";
  trigger: AutomationTrigger;
  channel: AutomationChannel;
  projectId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
};

export type AgentPersona = "sales" | "concierge" | "community" | "operations";

export type IntelligentAgent = {
  id: string;
  name: string;
  persona: AgentPersona;
  status: "training" | "ready" | "paused";
  playbook: string;
  handoffEmail?: string;
  languages: string[];
  projectIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type SecondaryListingStatus = "active" | "sold" | "cancelled";

export type SecondaryListing = {
  id: string;
  projectId: string;
  roundId: string;
  sellerUserId: string;
  slots: number;          // # de slots a la venta
  ask: number;            // precio pedido total (moneda del proyecto)
  currency: Currency;
  status: SecondaryListingStatus;
  createdAt: string;
  filledAt?: string | null;
};

export type Trade = {
  id: string;
  listingId: string;
  buyerUserId: string;
  price: number;          // precio cerrado total
  slots: number;
  createdAt: string;
};

