import {
  Project,
  Round,
  Reservation,
  Transaction,
  ResearchItem,
  PricePoint,
  SecondaryListing,
  Trade,
  ProjectDocument,
  Community,
  AutomationWorkflow,
  IntelligentAgent,
  User,
  Developer,
  Tenant,
  TenantSettings,
  Client,
  PaymentWebhook
} from '../types';

// Interfaz común para todos los servicios de base de datos
export interface DatabaseService {
  // Usuarios
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  upsertUser(user: User): Promise<User>;

  // Desarrolladores
  getDevelopers(): Promise<Developer[]>;
  getDeveloperById(id: string): Promise<Developer | null>;
  createDeveloper(developer: Developer): Promise<Developer>;
  updateDeveloper(id: string, updates: Partial<Developer>): Promise<Developer | null>;

  // Proyectos
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  getProjectBySlug(slug: string): Promise<Project | null>;
  createProject(project: Project): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | null>;

  // Tenants & clientes
  getTenants(): Promise<Tenant[]>;
  getTenantById(id: string): Promise<Tenant | null>;
  createTenant(tenant: Tenant): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null>;

  getClients(): Promise<Client[]>;
  getClientsByTenantId(tenantId: string): Promise<Client[]>;
  createClient(client: Client): Promise<Client>;
  updateClient(id: string, updates: Partial<Client>): Promise<Client | null>;

  getTenantSettingsByTenantId(tenantId: string): Promise<TenantSettings | null>;
  upsertTenantSettings(settings: TenantSettings): Promise<TenantSettings>;

  // Rondas
  getRounds(): Promise<Round[]>;
  getRoundById(id: string): Promise<Round | null>;
  getRoundByProjectId(projectId: string): Promise<Round | null>;
  createRound(round: Round): Promise<Round>;
  updateRound(id: string, updates: Partial<Round>): Promise<Round | null>;

  // Reservas
  getReservations(): Promise<Reservation[]>;
  getReservationById(id: string): Promise<Reservation | null>;
  getReservationsByRoundId(roundId: string): Promise<Reservation[]>;
  getReservationsByUserId(userId: string): Promise<Reservation[]>;
  createReservation(reservation: Reservation): Promise<Reservation>;
  updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null>;

  // Transacciones
  getTransactions(): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | null>;
  getTransactionByReservationId(reservationId: string): Promise<Transaction | null>;
  createTransaction(transaction: Transaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null>;

  // Payment webhooks
  getPaymentWebhooks(): Promise<PaymentWebhook[]>;
  getPaymentWebhookById(id: string): Promise<PaymentWebhook | null>;
  createPaymentWebhook(event: PaymentWebhook): Promise<PaymentWebhook>;
  updatePaymentWebhook(id: string, updates: Partial<PaymentWebhook>): Promise<PaymentWebhook | null>;

  // Research
  getResearch(): Promise<ResearchItem[]>;
  getResearchByProjectId(projectId: string): Promise<ResearchItem[]>;
  createResearchItem(item: ResearchItem): Promise<ResearchItem>;

  // Price History
  getPriceHistory(): Promise<Record<string, PricePoint[]>>;
  getPriceHistoryByProjectId(projectId: string): Promise<PricePoint[]>;
  addPricePoint(projectId: string, point: PricePoint): Promise<void>;

  // Secondary Listings
  getListings(): Promise<SecondaryListing[]>;
  getListingsByProjectId(projectId: string): Promise<SecondaryListing[]>;
  getListingById(id: string): Promise<SecondaryListing | null>;
  createListing(listing: SecondaryListing): Promise<SecondaryListing>;
  updateListing(id: string, updates: Partial<SecondaryListing>): Promise<SecondaryListing | null>;

  // Trades
  getTrades(): Promise<Trade[]>;
  createTrade(trade: Trade): Promise<Trade>;

  // Documents
  getDocuments(): Promise<ProjectDocument[]>;
  getDocumentById(id: string): Promise<ProjectDocument | null>;
  getDocumentsByProjectId(projectId: string): Promise<ProjectDocument[]>;
  getDocumentsByDeveloperId(developerId: string): Promise<ProjectDocument[]>;
  createDocument(document: ProjectDocument): Promise<ProjectDocument>;
  updateDocument(id: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument | null>;
  deleteDocument(id: string): Promise<boolean>;

  // Communities
  getCommunities(): Promise<Community[]>;
  getCommunityBySlug(slug: string): Promise<Community | null>;
  getCommunitiesByProjectId(projectId: string): Promise<Community[]>;
  createCommunity(community: Community): Promise<Community>;
  updateCommunity(id: string, updates: Partial<Community>): Promise<Community | null>;

  // Automations & agents
  getAutomations(): Promise<AutomationWorkflow[]>;
  createAutomation(workflow: AutomationWorkflow): Promise<AutomationWorkflow>;
  updateAutomation(id: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow | null>;

  getAgents(): Promise<IntelligentAgent[]>;
  createAgent(agent: IntelligentAgent): Promise<IntelligentAgent>;
  updateAgent(id: string, updates: Partial<IntelligentAgent>): Promise<IntelligentAgent | null>;
}


