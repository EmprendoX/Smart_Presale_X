import { createClient, type Provider, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { DatabaseService } from './db';
import type {
  AutomationWorkflow,
  Community,
  IntelligentAgent,
  PricePoint,
  Project,
  ProjectDocument,
  Reservation,
  ResearchItem,
  Round,
  SecondaryListing,
  Trade,
  Transaction,
  User,
  Developer,
  Tenant,
  TenantBranding,
  Client,
  PaymentWebhook
} from '../types';

type TableName =
  | 'projects'
  | 'rounds'
  | 'reservations'
  | 'transactions'
  | 'payment_webhooks'
  | 'research_items'
  | 'price_points'
  | 'secondary_listings'
  | 'trades'
  | 'project_documents'
  | 'communities'
  | 'automation_workflows'
  | 'intelligent_agents'
  | 'app_users'
  | 'developers'
  | 'tenants'
  | 'clients'
  | 'tenant_branding';

type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceKey?: string;
};

function resolveSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return { url, anonKey, serviceKey };
}

function throwSupabaseError(context: string, error: any): never {
  const message = typeof error?.message === 'string' ? error.message : 'Unknown Supabase error';
  throw new Error(`[Supabase] ${context}: ${message}`);
}

const DEFAULT_TENANT_ID = 'tenant_default';

const parseNumber = (value: any): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDate = (value: any): string | undefined => {
  if (!value) return undefined;
  return new Date(value).toISOString();
};

const cleanRecord = <T extends Record<string, any>>(record: T): T => {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
};

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  currency: string;
  status: string;
  tenant_id: string | null;
  images: string[] | null;
  video_url: string | null;
  description: string;
  developer_id: string;
  created_at: string;
  listing_type: string | null;
  stage: string | null;
  availability_status: string | null;
  ticker: string | null;
  total_units: number | null;
  attributes: string[] | null;
  specs: any;
  zone: any;
  property_type: string | null;
  property_price: number | null;
  development_stage: string | null;
  asking_price: number | null;
  property_details: any;
  tags: string[] | null;
  featured: boolean | null;
  automation_ready: boolean | null;
  agent_ids: string[] | null;
  seo: any;
};

const mapProjectFromRow = (row: ProjectRow): Project => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  city: row.city,
  country: row.country,
  currency: row.currency as Project['currency'],
  status: row.status as Project['status'],
  tenantId: row.tenant_id ?? undefined,
  images: row.images ?? [],
  videoUrl: row.video_url ?? undefined,
  description: row.description,
  developerId: row.developer_id,
  createdAt: parseDate(row.created_at) ?? new Date().toISOString(),
  listingType: (row.listing_type as Project['listingType']) ?? 'presale',
  stage: row.stage ?? undefined,
  availabilityStatus: (row.availability_status as Project['availabilityStatus']) ?? undefined,
  ticker: row.ticker ?? undefined,
  totalUnits: row.total_units ?? undefined,
  attributes: row.attributes ?? undefined,
  specs: (row.specs as Project['specs']) ?? undefined,
  zone: (row.zone as Project['zone']) ?? undefined,
  propertyType: row.property_type ?? undefined,
  propertyPrice: parseNumber(row.property_price),
  developmentStage: row.development_stage ?? undefined,
  askingPrice: parseNumber(row.asking_price),
  propertyDetails: (row.property_details as Project['propertyDetails']) ?? undefined,
  tags: row.tags ?? undefined,
  featured: row.featured ?? undefined,
  automationReady: row.automation_ready ?? undefined,
  agentIds: row.agent_ids ?? undefined,
  seo: (row.seo as Project['seo']) ?? undefined
});

const mapProjectToRow = (project: Project): Partial<ProjectRow> =>
  cleanRecord({
    id: project.id,
    slug: project.slug,
    name: project.name,
    city: project.city,
    country: project.country,
    currency: project.currency,
    status: project.status,
    tenant_id: project.tenantId ?? DEFAULT_TENANT_ID,
    images: project.images,
    video_url: project.videoUrl ?? null,
    description: project.description,
    developer_id: project.developerId,
    created_at: project.createdAt,
    listing_type: project.listingType,
    stage: project.stage ?? null,
    availability_status: project.availabilityStatus ?? null,
    ticker: project.ticker ?? null,
    total_units: project.totalUnits ?? null,
    attributes: project.attributes ?? null,
    specs: project.specs ?? null,
    zone: project.zone ?? null,
    property_type: project.propertyType ?? null,
    property_price: project.propertyPrice ?? null,
    development_stage: project.developmentStage ?? null,
    asking_price: project.askingPrice ?? null,
    property_details: project.propertyDetails ?? null,
    tags: project.tags ?? null,
    featured: project.featured ?? null,
    automation_ready: project.automationReady ?? null,
    agent_ids: project.agentIds ?? null,
    seo: project.seo ?? null
  });

const mapProjectUpdatesToRow = (updates: Partial<Project>): Partial<ProjectRow> => {
  const payload: Partial<ProjectRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'slug') && updates.slug !== undefined) {
    payload.slug = updates.slug;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'name') && updates.name !== undefined) {
    payload.name = updates.name;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'city') && updates.city !== undefined) {
    payload.city = updates.city;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'country') && updates.country !== undefined) {
    payload.country = updates.country;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'currency') && updates.currency !== undefined) {
    payload.currency = updates.currency;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'tenantId') && updates.tenantId !== undefined) {
    payload.tenant_id = updates.tenantId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'images') && updates.images !== undefined) {
    payload.images = updates.images;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'videoUrl')) {
    payload.video_url = updates.videoUrl ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'description') && updates.description !== undefined) {
    payload.description = updates.description;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'developerId') && updates.developerId !== undefined) {
    payload.developer_id = updates.developerId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'listingType') && updates.listingType !== undefined) {
    payload.listing_type = updates.listingType;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'stage')) {
    payload.stage = updates.stage ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'availabilityStatus')) {
    payload.availability_status = updates.availabilityStatus ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'ticker')) {
    payload.ticker = updates.ticker ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'totalUnits')) {
    payload.total_units = updates.totalUnits ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'attributes')) {
    payload.attributes = updates.attributes ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'specs')) {
    payload.specs = updates.specs ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'zone')) {
    payload.zone = updates.zone ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'propertyType')) {
    payload.property_type = updates.propertyType ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'propertyPrice')) {
    payload.property_price = updates.propertyPrice ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'developmentStage')) {
    payload.development_stage = updates.developmentStage ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'askingPrice')) {
    payload.asking_price = updates.askingPrice ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'propertyDetails')) {
    payload.property_details = updates.propertyDetails ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'tags')) {
    payload.tags = updates.tags ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'featured')) {
    payload.featured = updates.featured ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'automationReady')) {
    payload.automation_ready = updates.automationReady ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'agentIds')) {
    payload.agent_ids = updates.agentIds ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'seo')) {
    payload.seo = updates.seo ?? null;
  }
  return payload;
};

type RoundRow = {
  id: string;
  project_id: string;
  goal_type: string;
  goal_value: number;
  deposit_amount: number;
  slots_per_person: number;
  deadline_at: string;
  rule: string;
  partial_threshold: number | null;
  status: string;
  created_at: string;
  group_slots: number | null;
};

const mapRoundFromRow = (row: RoundRow): Round => ({
  id: row.id,
  projectId: row.project_id,
  goalType: row.goal_type as Round['goalType'],
  goalValue: row.goal_value,
  depositAmount: row.deposit_amount,
  slotsPerPerson: row.slots_per_person,
  deadlineAt: parseDate(row.deadline_at) ?? new Date().toISOString(),
  rule: row.rule as Round['rule'],
  partialThreshold: parseNumber(row.partial_threshold) ?? 0.7,
  status: row.status as Round['status'],
  createdAt: parseDate(row.created_at) ?? new Date().toISOString(),
  groupSlots: row.group_slots
});

const mapRoundToRow = (round: Round): RoundRow => ({
  id: round.id,
  project_id: round.projectId,
  goal_type: round.goalType,
  goal_value: round.goalValue,
  deposit_amount: round.depositAmount,
  slots_per_person: round.slotsPerPerson,
  deadline_at: round.deadlineAt,
  rule: round.rule,
  partial_threshold: round.partialThreshold,
  status: round.status,
  created_at: round.createdAt,
  group_slots: round.groupSlots ?? null
});

const mapRoundUpdatesToRow = (updates: Partial<Round>): Partial<RoundRow> => {
  const payload: Partial<RoundRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'projectId') && updates.projectId !== undefined) {
    payload.project_id = updates.projectId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'goalType') && updates.goalType !== undefined) {
    payload.goal_type = updates.goalType;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'goalValue') && updates.goalValue !== undefined) {
    payload.goal_value = updates.goalValue;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'depositAmount') && updates.depositAmount !== undefined) {
    payload.deposit_amount = updates.depositAmount;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'slotsPerPerson') && updates.slotsPerPerson !== undefined) {
    payload.slots_per_person = updates.slotsPerPerson;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'deadlineAt') && updates.deadlineAt !== undefined) {
    payload.deadline_at = updates.deadlineAt;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'rule') && updates.rule !== undefined) {
    payload.rule = updates.rule;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'partialThreshold')) {
    payload.partial_threshold = updates.partialThreshold ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'groupSlots')) {
    payload.group_slots = updates.groupSlots ?? null;
  }
  return payload;
};

type ReservationRow = {
  id: string;
  round_id: string;
  user_id: string;
  slots: number;
  amount: number;
  status: string;
  tx_id: string | null;
  created_at: string;
};

const mapReservationFromRow = (row: ReservationRow): Reservation => ({
  id: row.id,
  roundId: row.round_id,
  userId: row.user_id,
  slots: row.slots,
  amount: row.amount,
  status: row.status as Reservation['status'],
  txId: row.tx_id ?? undefined,
  createdAt: parseDate(row.created_at) ?? new Date().toISOString()
});

const mapReservationToRow = (reservation: Reservation): ReservationRow => ({
  id: reservation.id,
  round_id: reservation.roundId,
  user_id: reservation.userId,
  slots: reservation.slots,
  amount: reservation.amount,
  status: reservation.status,
  tx_id: reservation.txId ?? null,
  created_at: reservation.createdAt
});

const mapReservationUpdatesToRow = (updates: Partial<Reservation>): Partial<ReservationRow> => {
  const payload: Partial<ReservationRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'roundId') && updates.roundId !== undefined) {
    payload.round_id = updates.roundId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'userId') && updates.userId !== undefined) {
    payload.user_id = updates.userId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'slots') && updates.slots !== undefined) {
    payload.slots = updates.slots;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'amount') && updates.amount !== undefined) {
    payload.amount = updates.amount;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'txId')) {
    payload.tx_id = updates.txId ?? null;
  }
  return payload;
};

type TransactionRow = {
  id: string;
  reservation_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  payout_at: string | null;
  created_at: string;
  provider_reference: string | null;
  metadata: any;
  raw_response: any;
  client_secret: string | null;
};

const mapTransactionFromRow = (row: TransactionRow): Transaction => ({
  id: row.id,
  reservationId: row.reservation_id,
  provider: row.provider as Transaction['provider'],
  amount: row.amount,
  currency: row.currency as Transaction['currency'],
  status: row.status as Transaction['status'],
  payoutAt: row.payout_at ? parseDate(row.payout_at) ?? null : null,
  externalId: row.provider_reference ?? undefined,
  metadata: row.metadata ?? undefined,
  rawResponse: row.raw_response ?? undefined,
  clientSecret: row.client_secret ?? undefined,
  createdAt: parseDate(row.created_at)
});

const mapTransactionToRow = (transaction: Transaction): TransactionRow => ({
  id: transaction.id,
  reservation_id: transaction.reservationId,
  provider: transaction.provider,
  amount: transaction.amount,
  currency: transaction.currency,
  status: transaction.status,
  payout_at: transaction.payoutAt ?? null,
  created_at: transaction.createdAt ?? new Date().toISOString(),
  provider_reference: transaction.externalId ?? null,
  metadata: transaction.metadata ?? {},
  raw_response: transaction.rawResponse ?? null,
  client_secret: transaction.clientSecret ?? null
});

const mapTransactionUpdatesToRow = (updates: Partial<Transaction>): Partial<TransactionRow> => {
  const payload: Partial<TransactionRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'reservationId') && updates.reservationId !== undefined) {
    payload.reservation_id = updates.reservationId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'provider') && updates.provider !== undefined) {
    payload.provider = updates.provider;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'amount') && updates.amount !== undefined) {
    payload.amount = updates.amount;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'currency') && updates.currency !== undefined) {
    payload.currency = updates.currency;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'payoutAt')) {
    payload.payout_at = updates.payoutAt ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'externalId')) {
    payload.provider_reference = updates.externalId ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'metadata')) {
    payload.metadata = updates.metadata ?? {};
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'rawResponse')) {
    payload.raw_response = updates.rawResponse ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'clientSecret')) {
    payload.client_secret = updates.clientSecret ?? null;
  }
  return payload;
};

type PaymentWebhookRow = {
  id: string;
  provider: string;
  event_type: string;
  payload: any;
  reservation_id: string | null;
  transaction_id: string | null;
  processed_at: string | null;
  received_at: string;
  status: string | null;
};

const mapPaymentWebhookFromRow = (row: PaymentWebhookRow): PaymentWebhook => ({
  id: row.id,
  provider: row.provider as PaymentWebhook['provider'],
  eventType: row.event_type,
  payload: row.payload ?? {},
  reservationId: row.reservation_id ?? undefined,
  transactionId: row.transaction_id ?? undefined,
  processedAt: row.processed_at ? parseDate(row.processed_at) ?? null : null,
  receivedAt: parseDate(row.received_at) ?? new Date().toISOString(),
  status: (row.status as PaymentWebhook['status']) ?? undefined
});

const mapPaymentWebhookToRow = (event: PaymentWebhook): PaymentWebhookRow => ({
  id: event.id,
  provider: event.provider,
  event_type: event.eventType,
  payload: event.payload,
  reservation_id: event.reservationId ?? null,
  transaction_id: event.transactionId ?? null,
  processed_at: event.processedAt ?? null,
  received_at: event.receivedAt,
  status: event.status ?? null
});

const mapPaymentWebhookUpdatesToRow = (updates: Partial<PaymentWebhook>): Partial<PaymentWebhookRow> => {
  const payload: Partial<PaymentWebhookRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'provider') && updates.provider !== undefined) {
    payload.provider = updates.provider;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'eventType') && updates.eventType !== undefined) {
    payload.event_type = updates.eventType;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'payload') && updates.payload !== undefined) {
    payload.payload = updates.payload;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'reservationId')) {
    payload.reservation_id = updates.reservationId ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'transactionId')) {
    payload.transaction_id = updates.transactionId ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'processedAt')) {
    payload.processed_at = updates.processedAt ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'receivedAt') && updates.receivedAt !== undefined) {
    payload.received_at = updates.receivedAt;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    payload.status = updates.status ?? null;
  }
  return payload;
};

type ResearchItemRow = {
  id: string;
  project_id: string;
  type: string;
  title: string;
  source: string | null;
  url: string | null;
  published_at: string | null;
};

const mapResearchItemFromRow = (row: ResearchItemRow): ResearchItem => ({
  id: row.id,
  projectId: row.project_id,
  type: row.type as ResearchItem['type'],
  title: row.title,
  source: row.source ?? undefined,
  url: row.url ?? undefined,
  publishedAt: row.published_at ? parseDate(row.published_at) : undefined
});

const mapResearchItemToRow = (item: ResearchItem): ResearchItemRow => ({
  id: item.id,
  project_id: item.projectId,
  type: item.type,
  title: item.title,
  source: item.source ?? null,
  url: item.url ?? null,
  published_at: item.publishedAt ?? null
});

type PricePointRow = {
  id: string;
  project_id: string;
  ts: string;
  price: number;
  volume: number | null;
};

const mapPricePointFromRow = (row: PricePointRow): PricePoint & { projectId: string } => ({
  projectId: row.project_id,
  ts: parseDate(row.ts) ?? new Date().toISOString(),
  price: row.price,
  volume: parseNumber(row.volume)
});

const mapPricePointToRow = (projectId: string, point: PricePoint): Omit<PricePointRow, 'id'> => ({
  project_id: projectId,
  ts: point.ts,
  price: point.price,
  volume: point.volume ?? null
});

type SecondaryListingRow = {
  id: string;
  project_id: string;
  round_id: string;
  seller_user_id: string;
  slots: number;
  ask: number;
  currency: string;
  status: string;
  created_at: string;
  filled_at: string | null;
};

const mapListingFromRow = (row: SecondaryListingRow): SecondaryListing => ({
  id: row.id,
  projectId: row.project_id,
  roundId: row.round_id,
  sellerUserId: row.seller_user_id,
  slots: row.slots,
  ask: row.ask,
  currency: row.currency as SecondaryListing['currency'],
  status: row.status as SecondaryListing['status'],
  createdAt: parseDate(row.created_at) ?? new Date().toISOString(),
  filledAt: row.filled_at ? parseDate(row.filled_at) ?? null : null
});

const mapListingToRow = (listing: SecondaryListing): SecondaryListingRow => ({
  id: listing.id,
  project_id: listing.projectId,
  round_id: listing.roundId,
  seller_user_id: listing.sellerUserId,
  slots: listing.slots,
  ask: listing.ask,
  currency: listing.currency,
  status: listing.status,
  created_at: listing.createdAt,
  filled_at: listing.filledAt ?? null
});

const mapListingUpdatesToRow = (updates: Partial<SecondaryListing>): Partial<SecondaryListingRow> => {
  const payload: Partial<SecondaryListingRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'projectId') && updates.projectId !== undefined) {
    payload.project_id = updates.projectId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'roundId') && updates.roundId !== undefined) {
    payload.round_id = updates.roundId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'sellerUserId') && updates.sellerUserId !== undefined) {
    payload.seller_user_id = updates.sellerUserId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'slots') && updates.slots !== undefined) {
    payload.slots = updates.slots;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'ask') && updates.ask !== undefined) {
    payload.ask = updates.ask;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'currency') && updates.currency !== undefined) {
    payload.currency = updates.currency;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'filledAt')) {
    payload.filled_at = updates.filledAt ?? null;
  }
  return payload;
};

type TradeRow = {
  id: string;
  listing_id: string;
  buyer_user_id: string;
  price: number;
  slots: number;
  created_at: string;
};

const mapTradeFromRow = (row: TradeRow): Trade => ({
  id: row.id,
  listingId: row.listing_id,
  buyerUserId: row.buyer_user_id,
  price: row.price,
  slots: row.slots,
  createdAt: parseDate(row.created_at) ?? new Date().toISOString()
});

const mapTradeToRow = (trade: Trade): TradeRow => ({
  id: trade.id,
  listing_id: trade.listingId,
  buyer_user_id: trade.buyerUserId,
  price: trade.price,
  slots: trade.slots,
  created_at: trade.createdAt
});

type ProjectDocumentRow = {
  id: string;
  project_id: string;
  type: string | null;
  url: string;
  access: string | null;
  title: string;
  file_name: string;
  uploaded_at: string;
  uploaded_by: string;
};

const mapDocumentFromRow = (row: ProjectDocumentRow): ProjectDocument => ({
  id: row.id,
  projectId: row.project_id,
  type: row.type as ProjectDocument['type'],
  url: row.url,
  access: row.access as ProjectDocument['access'],
  title: row.title,
  fileName: row.file_name,
  uploadedAt: parseDate(row.uploaded_at) ?? new Date().toISOString(),
  uploadedBy: row.uploaded_by
});

const mapDocumentToRow = (document: ProjectDocument): ProjectDocumentRow => ({
  id: document.id,
  project_id: document.projectId,
  type: document.type ?? null,
  url: document.url,
  access: document.access ?? null,
  title: document.title,
  file_name: document.fileName,
  uploaded_at: document.uploadedAt,
  uploaded_by: document.uploadedBy
});

const mapDocumentUpdatesToRow = (updates: Partial<ProjectDocument>): Partial<ProjectDocumentRow> => {
  const payload: Partial<ProjectDocumentRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'projectId') && updates.projectId !== undefined) {
    payload.project_id = updates.projectId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'type')) {
    payload.type = updates.type ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'url') && updates.url !== undefined) {
    payload.url = updates.url;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'access')) {
    payload.access = updates.access ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'title') && updates.title !== undefined) {
    payload.title = updates.title;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'fileName') && updates.fileName !== undefined) {
    payload.file_name = updates.fileName;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'uploadedAt') && updates.uploadedAt !== undefined) {
    payload.uploaded_at = updates.uploadedAt;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'uploadedBy') && updates.uploadedBy !== undefined) {
    payload.uploaded_by = updates.uploadedBy;
  }
  return payload;
};

type CommunityRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  scope: string;
  project_id: string | null;
  round_id: string | null;
  cover_image: string | null;
  tags: string[] | null;
  member_count: number;
  featured_posts: Community['featuredPosts'] | null;
};

const mapCommunityFromRow = (row: CommunityRow): Community => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  scope: row.scope as Community['scope'],
  projectId: row.project_id ?? undefined,
  roundId: row.round_id ?? undefined,
  coverImage: row.cover_image ?? undefined,
  tags: row.tags ?? undefined,
  memberCount: row.member_count,
  featuredPosts: row.featured_posts ?? undefined
});

const mapCommunityToRow = (community: Community): CommunityRow => ({
  id: community.id,
  slug: community.slug,
  name: community.name,
  description: community.description,
  scope: community.scope,
  project_id: community.projectId ?? null,
  round_id: community.roundId ?? null,
  cover_image: community.coverImage ?? null,
  tags: community.tags ?? null,
  member_count: community.memberCount,
  featured_posts: community.featuredPosts ?? null
});

const mapCommunityUpdatesToRow = (updates: Partial<Community>): Partial<CommunityRow> => {
  const payload: Partial<CommunityRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'slug') && updates.slug !== undefined) {
    payload.slug = updates.slug;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'name') && updates.name !== undefined) {
    payload.name = updates.name;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'description') && updates.description !== undefined) {
    payload.description = updates.description;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'scope') && updates.scope !== undefined) {
    payload.scope = updates.scope;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'projectId')) {
    payload.project_id = updates.projectId ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'roundId')) {
    payload.round_id = updates.roundId ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'coverImage')) {
    payload.cover_image = updates.coverImage ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'tags')) {
    payload.tags = updates.tags ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'memberCount') && updates.memberCount !== undefined) {
    payload.member_count = updates.memberCount;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'featuredPosts')) {
    payload.featured_posts = updates.featuredPosts ?? null;
  }
  return payload;
};

type AutomationWorkflowRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger: string;
  channel: string;
  project_id: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
};

const mapAutomationFromRow = (row: AutomationWorkflowRow): AutomationWorkflow => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  status: row.status as AutomationWorkflow['status'],
  trigger: row.trigger as AutomationWorkflow['trigger'],
  channel: row.channel as AutomationWorkflow['channel'],
  projectId: row.project_id ?? undefined,
  agentId: row.agent_id ?? undefined,
  createdAt: parseDate(row.created_at) ?? new Date().toISOString(),
  updatedAt: parseDate(row.updated_at) ?? new Date().toISOString(),
  metadata: row.metadata ?? undefined
});

const mapAutomationToRow = (workflow: AutomationWorkflow): AutomationWorkflowRow => ({
  id: workflow.id,
  name: workflow.name,
  description: workflow.description ?? null,
  status: workflow.status,
  trigger: workflow.trigger,
  channel: workflow.channel,
  project_id: workflow.projectId ?? null,
  agent_id: workflow.agentId ?? null,
  created_at: workflow.createdAt,
  updated_at: workflow.updatedAt,
  metadata: workflow.metadata ?? null
});

const mapAutomationUpdatesToRow = (updates: Partial<AutomationWorkflow>): Partial<AutomationWorkflowRow> => {
  const payload: Partial<AutomationWorkflowRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'name') && updates.name !== undefined) {
    payload.name = updates.name;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
    payload.description = updates.description ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'trigger') && updates.trigger !== undefined) {
    payload.trigger = updates.trigger;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'channel') && updates.channel !== undefined) {
    payload.channel = updates.channel;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'projectId')) {
    payload.project_id = updates.projectId ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'agentId')) {
    payload.agent_id = updates.agentId ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'updatedAt') && updates.updatedAt !== undefined) {
    payload.updated_at = updates.updatedAt;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'metadata')) {
    payload.metadata = updates.metadata ?? null;
  }
  return payload;
};

type IntelligentAgentRow = {
  id: string;
  name: string;
  persona: string;
  status: string;
  playbook: string;
  handoff_email: string | null;
  languages: string[] | null;
  project_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

const mapAgentFromRow = (row: IntelligentAgentRow): IntelligentAgent => ({
  id: row.id,
  name: row.name,
  persona: row.persona as IntelligentAgent['persona'],
  status: row.status as IntelligentAgent['status'],
  playbook: row.playbook,
  handoffEmail: row.handoff_email ?? undefined,
  languages: row.languages ?? [],
  projectIds: row.project_ids ?? undefined,
  createdAt: parseDate(row.created_at) ?? new Date().toISOString(),
  updatedAt: parseDate(row.updated_at) ?? new Date().toISOString()
});

const mapAgentToRow = (agent: IntelligentAgent): IntelligentAgentRow => ({
  id: agent.id,
  name: agent.name,
  persona: agent.persona,
  status: agent.status,
  playbook: agent.playbook,
  handoff_email: agent.handoffEmail ?? null,
  languages: agent.languages,
  project_ids: agent.projectIds ?? null,
  created_at: agent.createdAt,
  updated_at: agent.updatedAt
});

const mapAgentUpdatesToRow = (updates: Partial<IntelligentAgent>): Partial<IntelligentAgentRow> => {
  const payload: Partial<IntelligentAgentRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'name') && updates.name !== undefined) {
    payload.name = updates.name;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'persona') && updates.persona !== undefined) {
    payload.persona = updates.persona;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'playbook') && updates.playbook !== undefined) {
    payload.playbook = updates.playbook;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'handoffEmail')) {
    payload.handoff_email = updates.handoffEmail ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'languages') && updates.languages !== undefined) {
    payload.languages = updates.languages;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'projectIds')) {
    payload.project_ids = updates.projectIds ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'updatedAt') && updates.updatedAt !== undefined) {
    payload.updated_at = updates.updatedAt;
  }
  return payload;
};

type UserRow = {
  id: string;
  tenant_id: string | null;
  name: string;
  role: string;
  kyc_status: string;
  email: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

const mapUserFromRow = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  role: row.role as User['role'],
  kycStatus: row.kyc_status as User['kycStatus'],
  tenantId: row.tenant_id ?? undefined,
  email: row.email ?? undefined,
  metadata: row.metadata ?? null
});

const mapUserToRow = (user: User): UserRow => ({
  id: user.id,
  tenant_id: user.tenantId ?? DEFAULT_TENANT_ID,
  name: user.name,
  role: user.role,
  kyc_status: user.kycStatus,
  email: user.email ?? null,
  metadata: user.metadata ?? null,
  created_at: new Date().toISOString()
});

const mapUserUpdatesToRow = (user: User): Partial<UserRow> =>
  cleanRecord({
    tenant_id: user.tenantId ?? DEFAULT_TENANT_ID,
    name: user.name,
    role: user.role,
    kyc_status: user.kycStatus,
    email: user.email ?? null,
    metadata: user.metadata ?? null
  });

type DeveloperRow = {
  id: string;
  tenant_id: string | null;
  user_id: string;
  company: string;
  verified_at: string | null;
};

const mapDeveloperFromRow = (row: DeveloperRow): Developer => ({
  id: row.id,
  userId: row.user_id,
  company: row.company,
  verifiedAt: row.verified_at ? parseDate(row.verified_at) ?? null : null,
  tenantId: row.tenant_id ?? undefined
});

const mapDeveloperToRow = (developer: Developer): DeveloperRow => ({
  id: developer.id,
  tenant_id: developer.tenantId ?? DEFAULT_TENANT_ID,
  user_id: developer.userId,
  company: developer.company,
  verified_at: developer.verifiedAt ?? null
});

const mapDeveloperUpdatesToRow = (updates: Partial<Developer>): Partial<DeveloperRow> => {
  const payload: Partial<DeveloperRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'tenantId')) {
    payload.tenant_id = updates.tenantId ?? DEFAULT_TENANT_ID;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'userId') && updates.userId !== undefined) {
    payload.user_id = updates.userId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'company') && updates.company !== undefined) {
    payload.company = updates.company;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'verifiedAt')) {
    payload.verified_at = updates.verifiedAt ?? null;
  }
  return payload;
};

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  region: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

const mapTenantFromRow = (row: TenantRow): Tenant => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  status: row.status as Tenant['status'],
  region: row.region ?? null,
  metadata: row.metadata ?? null,
  createdAt: parseDate(row.created_at) ?? new Date().toISOString(),
  updatedAt: parseDate(row.updated_at) ?? new Date().toISOString()
});

const mapTenantToRow = (tenant: Tenant): TenantRow => ({
  id: tenant.id,
  slug: tenant.slug,
  name: tenant.name,
  status: tenant.status,
  region: tenant.region ?? null,
  metadata: tenant.metadata ?? null,
  created_at: tenant.createdAt,
  updated_at: tenant.updatedAt
});

const mapTenantUpdatesToRow = (updates: Partial<Tenant>): Partial<TenantRow> => {
  const payload: Partial<TenantRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'slug') && updates.slug !== undefined) {
    payload.slug = updates.slug;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'name') && updates.name !== undefined) {
    payload.name = updates.name;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'region')) {
    payload.region = updates.region ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'metadata')) {
    payload.metadata = updates.metadata ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'updatedAt') && updates.updatedAt !== undefined) {
    payload.updated_at = updates.updatedAt;
  }
  return payload;
};

type TenantBrandingRow = {
  id: string;
  tenant_id: string;
  logo_url: string | null;
  dark_logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  typography: Record<string, any> | null;
  buttons: Record<string, any> | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

const mapTenantBrandingFromRow = (row: TenantBrandingRow): TenantBranding => ({
  id: row.id,
  tenantId: row.tenant_id,
  logoUrl: row.logo_url ?? null,
  darkLogoUrl: row.dark_logo_url ?? null,
  primaryColor: row.primary_color ?? null,
  secondaryColor: row.secondary_color ?? null,
  accentColor: row.accent_color ?? null,
  backgroundColor: row.background_color ?? null,
  typography: row.typography ?? null,
  buttons: row.buttons ?? null,
  metadata: row.metadata ?? null,
  createdAt: parseDate(row.created_at) ?? new Date().toISOString(),
  updatedAt: parseDate(row.updated_at) ?? new Date().toISOString()
});

const mapTenantBrandingToRow = (branding: TenantBranding): TenantBrandingRow => ({
  id: branding.id,
  tenant_id: branding.tenantId,
  logo_url: branding.logoUrl ?? null,
  dark_logo_url: branding.darkLogoUrl ?? null,
  primary_color: branding.primaryColor ?? null,
  secondary_color: branding.secondaryColor ?? null,
  accent_color: branding.accentColor ?? null,
  background_color: branding.backgroundColor ?? null,
  typography: branding.typography ?? null,
  buttons: branding.buttons ?? null,
  metadata: branding.metadata ?? null,
  created_at: branding.createdAt,
  updated_at: branding.updatedAt
});

type ClientRow = {
  id: string;
  tenant_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

const mapClientFromRow = (row: ClientRow): Client => ({
  id: row.id,
  tenantId: row.tenant_id,
  name: row.name,
  contactName: row.contact_name ?? null,
  contactEmail: row.contact_email ?? null,
  contactPhone: row.contact_phone ?? null,
  status: row.status as Client['status'],
  metadata: row.metadata ?? null,
  createdAt: parseDate(row.created_at) ?? new Date().toISOString(),
  updatedAt: parseDate(row.updated_at) ?? new Date().toISOString()
});

const mapClientToRow = (client: Client): ClientRow => ({
  id: client.id,
  tenant_id: client.tenantId,
  name: client.name,
  contact_name: client.contactName ?? null,
  contact_email: client.contactEmail ?? null,
  contact_phone: client.contactPhone ?? null,
  status: client.status,
  metadata: client.metadata ?? null,
  created_at: client.createdAt,
  updated_at: client.updatedAt
});

const mapClientUpdatesToRow = (updates: Partial<Client>): Partial<ClientRow> => {
  const payload: Partial<ClientRow> = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'tenantId') && updates.tenantId !== undefined) {
    payload.tenant_id = updates.tenantId;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'name') && updates.name !== undefined) {
    payload.name = updates.name;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'contactName')) {
    payload.contact_name = updates.contactName ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'contactEmail')) {
    payload.contact_email = updates.contactEmail ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'contactPhone')) {
    payload.contact_phone = updates.contactPhone ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'status') && updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'metadata')) {
    payload.metadata = updates.metadata ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'updatedAt') && updates.updatedAt !== undefined) {
    payload.updated_at = updates.updatedAt;
  }
  return payload;
};
export class SupabaseService implements DatabaseService {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    if (client) {
      this.client = client;
      return;
    }

    const { url, anonKey, serviceKey } = resolveSupabaseEnv();
    this.client = createClient(url, serviceKey ?? anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  /** Expose raw Supabase client when needed */
  get supabase(): SupabaseClient {
    return this.client;
  }

  // ===== Auth helpers =====
  async signInWithOtp(email: string, options?: { redirectTo?: string; shouldCreateUser?: boolean }): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: options?.redirectTo,
        shouldCreateUser: options?.shouldCreateUser ?? true
      }
    });

    if (error) {
      throwSupabaseError('signInWithOtp', error);
    }
  }

  async signInWithOAuth(provider: Provider, options?: { redirectTo?: string; scopes?: string }) {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo,
        scopes: options?.scopes
      }
    });

    if (error) {
      throwSupabaseError('signInWithOAuth', error);
    }

    return data;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) {
      throwSupabaseError('signOut', error);
    }
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) {
      throwSupabaseError('getSession', error);
    }
    return data.session ?? null;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      throwSupabaseError('getUser', error);
    }
    return data.user ?? null;
  }

  // ===== Generic helpers =====
  private async selectAll<Row, Result>(
    table: TableName,
    mapper: (row: Row) => Result
  ): Promise<Result[]> {
    const { data, error } = await this.client.from(table).select('*');
    if (error) {
      throwSupabaseError(`selectAll:${table}`, error);
    }
    return ((data as Row[]) ?? []).map(mapper);
  }

  private async selectSingle<Row, Result>(
    table: TableName,
    column: string,
    value: string,
    mapper: (row: Row) => Result
  ): Promise<Result | null> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq(column, value)
      .maybeSingle();

    if (error) {
      throwSupabaseError(`selectSingle:${table}`, error);
    }

    if (!data) {
      return null;
    }

    return mapper(data as Row);
  }

  private async selectMany<Row, Result>(
    table: TableName,
    column: string,
    value: string,
    mapper: (row: Row) => Result
  ): Promise<Result[]> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq(column, value);

    if (error) {
      throwSupabaseError(`selectMany:${table}`, error);
    }

    return ((data as Row[]) ?? []).map(mapper);
  }

  private async insertSingle<Row, Result>(
    table: TableName,
    payload: Partial<Row>,
    mapper: (row: Row) => Result
  ): Promise<Result> {
    const { data, error } = await this.client.from(table).insert(payload).select().single();
    if (error) {
      throwSupabaseError(`insert:${table}`, error);
    }
    return mapper(data as Row);
  }

  private async updateSingle<Row, Result>(
    table: TableName,
    id: string,
    payload: Partial<Row>,
    mapper: (row: Row) => Result
  ): Promise<Result | null> {
    const { data, error } = await this.client
      .from(table)
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throwSupabaseError(`update:${table}`, error);
    }

    if (!data) {
      return null;
    }

    return mapper(data as Row);
  }

  private async deleteById(table: TableName, id: string): Promise<boolean> {
    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) {
      throwSupabaseError(`delete:${table}`, error);
    }
    return true;
  }

  // ===== Users =====
  async getUsers(): Promise<User[]> {
    return this.selectAll<UserRow, User>('app_users', mapUserFromRow);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.selectSingle<UserRow, User>('app_users', 'id', id, mapUserFromRow);
  }

  async upsertUser(user: User): Promise<User> {
    const existing = await this.getUserById(user.id);
    if (existing) {
      const updated = await this.updateSingle<UserRow, User>(
        'app_users',
        user.id,
        mapUserUpdatesToRow(user),
        mapUserFromRow
      );
      return updated ?? existing;
    }
    return this.insertSingle<UserRow, User>('app_users', mapUserToRow(user), mapUserFromRow);
  }

  // ===== Developers =====
  async getDevelopers(): Promise<Developer[]> {
    return this.selectAll<DeveloperRow, Developer>('developers', mapDeveloperFromRow);
  }

  async getDeveloperById(id: string): Promise<Developer | null> {
    return this.selectSingle<DeveloperRow, Developer>('developers', 'id', id, mapDeveloperFromRow);
  }

  async createDeveloper(developer: Developer): Promise<Developer> {
    return this.insertSingle<DeveloperRow, Developer>('developers', mapDeveloperToRow(developer), mapDeveloperFromRow);
  }

  async updateDeveloper(id: string, updates: Partial<Developer>): Promise<Developer | null> {
    return this.updateSingle<DeveloperRow, Developer>('developers', id, mapDeveloperUpdatesToRow(updates), mapDeveloperFromRow);
  }

  // ===== Projects =====
  async getProjects(): Promise<Project[]> {
    return this.selectAll<ProjectRow, Project>('projects', mapProjectFromRow);
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.selectSingle<ProjectRow, Project>('projects', 'id', id, mapProjectFromRow);
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    return this.selectSingle<ProjectRow, Project>('projects', 'slug', slug, mapProjectFromRow);
  }

  async createProject(project: Project): Promise<Project> {
    return this.insertSingle<ProjectRow, Project>('projects', mapProjectToRow(project), mapProjectFromRow);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    return this.updateSingle<ProjectRow, Project>(
      'projects',
      id,
      mapProjectUpdatesToRow(updates),
      mapProjectFromRow
    );
  }

  // ===== Tenants & clients =====
  async getTenants(): Promise<Tenant[]> {
    return this.selectAll<TenantRow, Tenant>('tenants', mapTenantFromRow);
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return this.selectSingle<TenantRow, Tenant>('tenants', 'id', id, mapTenantFromRow);
  }

  async createTenant(tenant: Tenant): Promise<Tenant> {
    return this.insertSingle<TenantRow, Tenant>('tenants', mapTenantToRow(tenant), mapTenantFromRow);
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    return this.updateSingle<TenantRow, Tenant>('tenants', id, mapTenantUpdatesToRow(updates), mapTenantFromRow);
  }

  async getClients(): Promise<Client[]> {
    return this.selectAll<ClientRow, Client>('clients', mapClientFromRow);
  }

  async getClientsByTenantId(tenantId: string): Promise<Client[]> {
    return this.selectMany<ClientRow, Client>('clients', 'tenant_id', tenantId, mapClientFromRow);
  }

  async createClient(client: Client): Promise<Client> {
    return this.insertSingle<ClientRow, Client>('clients', mapClientToRow(client), mapClientFromRow);
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    return this.updateSingle<ClientRow, Client>('clients', id, mapClientUpdatesToRow(updates), mapClientFromRow);
  }

  async getTenantBrandingByTenantId(tenantId: string): Promise<TenantBranding | null> {
    return this.selectSingle<TenantBrandingRow, TenantBranding>(
      'tenant_branding',
      'tenant_id',
      tenantId,
      mapTenantBrandingFromRow
    );
  }

  async upsertTenantBranding(branding: TenantBranding): Promise<TenantBranding> {
    const payload = mapTenantBrandingToRow(branding);
    const { data, error } = await this.client
      .from('tenant_branding')
      .upsert(payload, { onConflict: 'tenant_id' })
      .select()
      .single();

    if (error) {
      throwSupabaseError('upsertTenantBranding', error);
    }

    return mapTenantBrandingFromRow(data as TenantBrandingRow);
  }

  // ===== Rounds =====
  async getRounds(): Promise<Round[]> {
    return this.selectAll<RoundRow, Round>('rounds', mapRoundFromRow);
  }

  async getRoundById(id: string): Promise<Round | null> {
    return this.selectSingle<RoundRow, Round>('rounds', 'id', id, mapRoundFromRow);
  }

  async getRoundByProjectId(projectId: string): Promise<Round | null> {
    return this.selectSingle<RoundRow, Round>('rounds', 'project_id', projectId, mapRoundFromRow);
  }

  async createRound(round: Round): Promise<Round> {
    return this.insertSingle<RoundRow, Round>('rounds', mapRoundToRow(round), mapRoundFromRow);
  }

  async updateRound(id: string, updates: Partial<Round>): Promise<Round | null> {
    return this.updateSingle<RoundRow, Round>('rounds', id, mapRoundUpdatesToRow(updates), mapRoundFromRow);
  }

  // ===== Reservations =====
  async getReservations(): Promise<Reservation[]> {
    return this.selectAll<ReservationRow, Reservation>('reservations', mapReservationFromRow);
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    return this.selectSingle<ReservationRow, Reservation>('reservations', 'id', id, mapReservationFromRow);
  }

  async getReservationsByRoundId(roundId: string): Promise<Reservation[]> {
    return this.selectMany<ReservationRow, Reservation>('reservations', 'round_id', roundId, mapReservationFromRow);
  }

  async getReservationsByUserId(userId: string): Promise<Reservation[]> {
    return this.selectMany<ReservationRow, Reservation>('reservations', 'user_id', userId, mapReservationFromRow);
  }

  async createReservation(reservation: Reservation): Promise<Reservation> {
    return this.insertSingle<ReservationRow, Reservation>(
      'reservations',
      mapReservationToRow(reservation),
      mapReservationFromRow
    );
  }

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    return this.updateSingle<ReservationRow, Reservation>(
      'reservations',
      id,
      mapReservationUpdatesToRow(updates),
      mapReservationFromRow
    );
  }

  // ===== Transactions =====
  async getTransactions(): Promise<Transaction[]> {
    return this.selectAll<TransactionRow, Transaction>('transactions', mapTransactionFromRow);
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.selectSingle<TransactionRow, Transaction>('transactions', 'id', id, mapTransactionFromRow);
  }

  async getTransactionByReservationId(reservationId: string): Promise<Transaction | null> {
    return this.selectSingle<TransactionRow, Transaction>(
      'transactions',
      'reservation_id',
      reservationId,
      mapTransactionFromRow
    );
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    return this.insertSingle<TransactionRow, Transaction>(
      'transactions',
      mapTransactionToRow(transaction),
      mapTransactionFromRow
    );
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    return this.updateSingle<TransactionRow, Transaction>(
      'transactions',
      id,
      mapTransactionUpdatesToRow(updates),
      mapTransactionFromRow
    );
  }

  // ===== Payment Webhooks =====
  async getPaymentWebhooks(): Promise<PaymentWebhook[]> {
    return this.selectAll<PaymentWebhookRow, PaymentWebhook>('payment_webhooks', mapPaymentWebhookFromRow);
  }

  async getPaymentWebhookById(id: string): Promise<PaymentWebhook | null> {
    return this.selectSingle<PaymentWebhookRow, PaymentWebhook>('payment_webhooks', 'id', id, mapPaymentWebhookFromRow);
  }

  async createPaymentWebhook(event: PaymentWebhook): Promise<PaymentWebhook> {
    return this.insertSingle<PaymentWebhookRow, PaymentWebhook>(
      'payment_webhooks',
      mapPaymentWebhookToRow(event),
      mapPaymentWebhookFromRow
    );
  }

  async updatePaymentWebhook(id: string, updates: Partial<PaymentWebhook>): Promise<PaymentWebhook | null> {
    return this.updateSingle<PaymentWebhookRow, PaymentWebhook>(
      'payment_webhooks',
      id,
      mapPaymentWebhookUpdatesToRow(updates),
      mapPaymentWebhookFromRow
    );
  }

  // ===== Research =====
  async getResearch(): Promise<ResearchItem[]> {
    return this.selectAll<ResearchItemRow, ResearchItem>('research_items', mapResearchItemFromRow);
  }

  async getResearchByProjectId(projectId: string): Promise<ResearchItem[]> {
    return this.selectMany<ResearchItemRow, ResearchItem>('research_items', 'project_id', projectId, mapResearchItemFromRow);
  }

  async createResearchItem(item: ResearchItem): Promise<ResearchItem> {
    return this.insertSingle<ResearchItemRow, ResearchItem>(
      'research_items',
      mapResearchItemToRow(item),
      mapResearchItemFromRow
    );
  }

  // ===== Price history =====
  async getPriceHistory(): Promise<Record<string, PricePoint[]>> {
    const points = await this.selectAll<PricePointRow, PricePoint & { projectId: string }>(
      'price_points',
      mapPricePointFromRow
    );
    return points.reduce<Record<string, PricePoint[]>>((acc, point) => {
      const { projectId, ...rest } = point as PricePoint & { projectId: string };
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(rest as PricePoint);
      return acc;
    }, {});
  }

  async getPriceHistoryByProjectId(projectId: string): Promise<PricePoint[]> {
    const items = await this.selectMany<PricePointRow, PricePoint & { projectId: string }>(
      'price_points',
      'project_id',
      projectId,
      mapPricePointFromRow
    );
    return items.map(item => {
      const { projectId: _ignored, ...rest } = item as PricePoint & { projectId: string };
      return rest as PricePoint;
    });
  }

  async addPricePoint(projectId: string, point: PricePoint): Promise<void> {
    const payload = mapPricePointToRow(projectId, point);
    const { error } = await this.client.from('price_points').insert(payload);
    if (error) {
      throwSupabaseError('addPricePoint', error);
    }
  }

  // ===== Secondary listings =====
  async getListings(): Promise<SecondaryListing[]> {
    return this.selectAll<SecondaryListingRow, SecondaryListing>('secondary_listings', mapListingFromRow);
  }

  async getListingsByProjectId(projectId: string): Promise<SecondaryListing[]> {
    return this.selectMany<SecondaryListingRow, SecondaryListing>(
      'secondary_listings',
      'project_id',
      projectId,
      mapListingFromRow
    );
  }

  async getListingById(id: string): Promise<SecondaryListing | null> {
    return this.selectSingle<SecondaryListingRow, SecondaryListing>('secondary_listings', 'id', id, mapListingFromRow);
  }

  async createListing(listing: SecondaryListing): Promise<SecondaryListing> {
    return this.insertSingle<SecondaryListingRow, SecondaryListing>(
      'secondary_listings',
      mapListingToRow(listing),
      mapListingFromRow
    );
  }

  async updateListing(id: string, updates: Partial<SecondaryListing>): Promise<SecondaryListing | null> {
    return this.updateSingle<SecondaryListingRow, SecondaryListing>(
      'secondary_listings',
      id,
      mapListingUpdatesToRow(updates),
      mapListingFromRow
    );
  }

  // ===== Trades =====
  async getTrades(): Promise<Trade[]> {
    return this.selectAll<TradeRow, Trade>('trades', mapTradeFromRow);
  }

  async createTrade(trade: Trade): Promise<Trade> {
    return this.insertSingle<TradeRow, Trade>('trades', mapTradeToRow(trade), mapTradeFromRow);
  }

  // ===== Documents =====
  async getDocuments(): Promise<ProjectDocument[]> {
    return this.selectAll<ProjectDocumentRow, ProjectDocument>('project_documents', mapDocumentFromRow);
  }

  async getDocumentById(id: string): Promise<ProjectDocument | null> {
    return this.selectSingle<ProjectDocumentRow, ProjectDocument>('project_documents', 'id', id, mapDocumentFromRow);
  }

  async getDocumentsByProjectId(projectId: string): Promise<ProjectDocument[]> {
    return this.selectMany<ProjectDocumentRow, ProjectDocument>(
      'project_documents',
      'project_id',
      projectId,
      mapDocumentFromRow
    );
  }

  async getDocumentsByDeveloperId(developerId: string): Promise<ProjectDocument[]> {
    return this.selectMany<ProjectDocumentRow, ProjectDocument>(
      'project_documents',
      'uploaded_by',
      developerId,
      mapDocumentFromRow
    );
  }

  async createDocument(document: ProjectDocument): Promise<ProjectDocument> {
    return this.insertSingle<ProjectDocumentRow, ProjectDocument>(
      'project_documents',
      mapDocumentToRow(document),
      mapDocumentFromRow
    );
  }

  async updateDocument(id: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument | null> {
    return this.updateSingle<ProjectDocumentRow, ProjectDocument>(
      'project_documents',
      id,
      mapDocumentUpdatesToRow(updates),
      mapDocumentFromRow
    );
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.deleteById('project_documents', id);
  }

  // ===== Communities =====
  async getCommunities(): Promise<Community[]> {
    return this.selectAll<CommunityRow, Community>('communities', mapCommunityFromRow);
  }

  async getCommunityBySlug(slug: string): Promise<Community | null> {
    return this.selectSingle<CommunityRow, Community>('communities', 'slug', slug, mapCommunityFromRow);
  }

  async getCommunitiesByProjectId(projectId: string): Promise<Community[]> {
    return this.selectMany<CommunityRow, Community>('communities', 'project_id', projectId, mapCommunityFromRow);
  }

  async createCommunity(community: Community): Promise<Community> {
    return this.insertSingle<CommunityRow, Community>('communities', mapCommunityToRow(community), mapCommunityFromRow);
  }

  async updateCommunity(id: string, updates: Partial<Community>): Promise<Community | null> {
    return this.updateSingle<CommunityRow, Community>(
      'communities',
      id,
      mapCommunityUpdatesToRow(updates),
      mapCommunityFromRow
    );
  }

  // ===== Automations & agents =====
  async getAutomations(): Promise<AutomationWorkflow[]> {
    return this.selectAll<AutomationWorkflowRow, AutomationWorkflow>(
      'automation_workflows',
      mapAutomationFromRow
    );
  }

  async createAutomation(workflow: AutomationWorkflow): Promise<AutomationWorkflow> {
    return this.insertSingle<AutomationWorkflowRow, AutomationWorkflow>(
      'automation_workflows',
      mapAutomationToRow(workflow),
      mapAutomationFromRow
    );
  }

  async updateAutomation(id: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow | null> {
    return this.updateSingle<AutomationWorkflowRow, AutomationWorkflow>(
      'automation_workflows',
      id,
      mapAutomationUpdatesToRow(updates),
      mapAutomationFromRow
    );
  }

  async getAgents(): Promise<IntelligentAgent[]> {
    return this.selectAll<IntelligentAgentRow, IntelligentAgent>('intelligent_agents', mapAgentFromRow);
  }

  async createAgent(agent: IntelligentAgent): Promise<IntelligentAgent> {
    return this.insertSingle<IntelligentAgentRow, IntelligentAgent>(
      'intelligent_agents',
      mapAgentToRow(agent),
      mapAgentFromRow
    );
  }

  async updateAgent(id: string, updates: Partial<IntelligentAgent>): Promise<IntelligentAgent | null> {
    return this.updateSingle<IntelligentAgentRow, IntelligentAgent>(
      'intelligent_agents',
      id,
      mapAgentUpdatesToRow(updates),
      mapAgentFromRow
    );
  }
}
