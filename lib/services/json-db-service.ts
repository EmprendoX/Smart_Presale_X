import { DatabaseService } from './db';
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
  Client,
  TenantSettings,
  PaymentWebhook
} from '../types';
import { jsonDb } from '../storage/json-db';

export class JsonDbService implements DatabaseService {
  // Usuarios
  async getUsers(): Promise<User[]> {
    return jsonDb.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return jsonDb.getUserById(id);
  }

  async upsertUser(user: User): Promise<User> {
    return jsonDb.upsertUser(user);
  }

  // Desarrolladores
  async getDevelopers(): Promise<Developer[]> {
    return jsonDb.getDevelopers();
  }

  async getDeveloperById(id: string): Promise<Developer | null> {
    return jsonDb.getDeveloperById(id);
  }

  async createDeveloper(developer: Developer): Promise<Developer> {
    return jsonDb.createDeveloper(developer);
  }

  async updateDeveloper(id: string, updates: Partial<Developer>): Promise<Developer | null> {
    return jsonDb.updateDeveloper(id, updates);
  }

  // Proyectos
  async getProjects(): Promise<Project[]> {
    return jsonDb.getProjects();
  }

  async getProjectById(id: string): Promise<Project | null> {
    return jsonDb.getProjectById(id);
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    return jsonDb.getProjectBySlug(slug);
  }

  async createProject(project: Project): Promise<Project> {
    return jsonDb.createProject(project);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    return jsonDb.updateProject(id, updates);
  }

  // Tenants & clientes
  async getTenants(): Promise<Tenant[]> {
    return jsonDb.getTenants();
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return jsonDb.getTenantById(id);
  }

  async createTenant(tenant: Tenant): Promise<Tenant> {
    return jsonDb.createTenant(tenant);
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    return jsonDb.updateTenant(id, updates);
  }

  async getClients(): Promise<Client[]> {
    return jsonDb.getClients();
  }

  async getClientsByTenantId(tenantId: string): Promise<Client[]> {
    return jsonDb.getClientsByTenantId(tenantId);
  }

  async createClient(client: Client): Promise<Client> {
    return jsonDb.createClient(client);
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    return jsonDb.updateClient(id, updates);
  }

  async getTenantSettingsByTenantId(tenantId: string): Promise<TenantSettings | null> {
    return jsonDb.getTenantSettingsByTenantId(tenantId);
  }

  async upsertTenantSettings(settings: TenantSettings): Promise<TenantSettings> {
    return jsonDb.upsertTenantSettings(settings);
  }

  // Rondas
  async getRounds(): Promise<Round[]> {
    return jsonDb.getRounds();
  }

  async getRoundById(id: string): Promise<Round | null> {
    return jsonDb.getRoundById(id);
  }

  async getRoundByProjectId(projectId: string): Promise<Round | null> {
    return jsonDb.getRoundByProjectId(projectId);
  }

  async createRound(round: Round): Promise<Round> {
    return jsonDb.createRound(round);
  }

  async updateRound(id: string, updates: Partial<Round>): Promise<Round | null> {
    return jsonDb.updateRound(id, updates);
  }

  // Reservas
  async getReservations(): Promise<Reservation[]> {
    return jsonDb.getReservations();
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    return jsonDb.getReservationById(id);
  }

  async getReservationsByRoundId(roundId: string): Promise<Reservation[]> {
    return jsonDb.getReservationsByRoundId(roundId);
  }

  async getReservationsByUserId(userId: string): Promise<Reservation[]> {
    return jsonDb.getReservationsByUserId(userId);
  }

  async createReservation(reservation: Reservation): Promise<Reservation> {
    return jsonDb.createReservation(reservation);
  }

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    return jsonDb.updateReservation(id, updates);
  }

  // Transacciones
  async getTransactions(): Promise<Transaction[]> {
    return jsonDb.getTransactions();
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return jsonDb.getTransactionById(id);
  }

  async getTransactionByReservationId(reservationId: string): Promise<Transaction | null> {
    return jsonDb.getTransactionByReservationId(reservationId);
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    return jsonDb.createTransaction(transaction);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    return jsonDb.updateTransaction(id, updates);
  }

  // Payment webhooks
  async getPaymentWebhooks(): Promise<PaymentWebhook[]> {
    return jsonDb.getPaymentWebhooks();
  }

  async getPaymentWebhookById(id: string): Promise<PaymentWebhook | null> {
    return jsonDb.getPaymentWebhookById(id);
  }

  async createPaymentWebhook(event: PaymentWebhook): Promise<PaymentWebhook> {
    return jsonDb.createPaymentWebhook(event);
  }

  async updatePaymentWebhook(id: string, updates: Partial<PaymentWebhook>): Promise<PaymentWebhook | null> {
    return jsonDb.updatePaymentWebhook(id, updates);
  }

  // Research
  async getResearch(): Promise<ResearchItem[]> {
    return jsonDb.getResearch();
  }

  async getResearchByProjectId(projectId: string): Promise<ResearchItem[]> {
    return jsonDb.getResearchByProjectId(projectId);
  }

  async createResearchItem(item: ResearchItem): Promise<ResearchItem> {
    return jsonDb.createResearchItem(item);
  }

  // Price History
  async getPriceHistory(): Promise<Record<string, PricePoint[]>> {
    return jsonDb.getPriceHistory();
  }

  async getPriceHistoryByProjectId(projectId: string): Promise<PricePoint[]> {
    return jsonDb.getPriceHistoryByProjectId(projectId);
  }

  async addPricePoint(projectId: string, point: PricePoint): Promise<void> {
    return jsonDb.addPricePoint(projectId, point);
  }

  // Secondary Listings
  async getListings(): Promise<SecondaryListing[]> {
    return jsonDb.getListings();
  }

  async getListingsByProjectId(projectId: string): Promise<SecondaryListing[]> {
    return jsonDb.getListingsByProjectId(projectId);
  }

  async getListingById(id: string): Promise<SecondaryListing | null> {
    return jsonDb.getListingById(id);
  }

  async createListing(listing: SecondaryListing): Promise<SecondaryListing> {
    return jsonDb.createListing(listing);
  }

  async updateListing(id: string, updates: Partial<SecondaryListing>): Promise<SecondaryListing | null> {
    return jsonDb.updateListing(id, updates);
  }

  // Trades
  async getTrades(): Promise<Trade[]> {
    return jsonDb.getTrades();
  }

  async createTrade(trade: Trade): Promise<Trade> {
    return jsonDb.createTrade(trade);
  }

  // Documents
  async getDocuments(): Promise<ProjectDocument[]> {
    return jsonDb.getDocuments();
  }

  async getDocumentById(id: string): Promise<ProjectDocument | null> {
    return jsonDb.getDocumentById(id);
  }

  async getDocumentsByProjectId(projectId: string): Promise<ProjectDocument[]> {
    return jsonDb.getDocumentsByProjectId(projectId);
  }

  async getDocumentsByDeveloperId(developerId: string): Promise<ProjectDocument[]> {
    return jsonDb.getDocumentsByDeveloperId(developerId);
  }

  async createDocument(document: ProjectDocument): Promise<ProjectDocument> {
    return jsonDb.createDocument(document);
  }

  async updateDocument(id: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument | null> {
    return jsonDb.updateDocument(id, updates);
  }

  async deleteDocument(id: string): Promise<boolean> {
    return jsonDb.deleteDocument(id);
  }

  // Communities
  async getCommunities(): Promise<Community[]> {
    return jsonDb.getCommunities();
  }

  async getCommunityBySlug(slug: string): Promise<Community | null> {
    return jsonDb.getCommunityBySlug(slug);
  }

  async getCommunitiesByProjectId(projectId: string): Promise<Community[]> {
    return jsonDb.getCommunitiesByProjectId(projectId);
  }

  async createCommunity(community: Community): Promise<Community> {
    return jsonDb.createCommunity(community);
  }

  async updateCommunity(id: string, updates: Partial<Community>): Promise<Community | null> {
    return jsonDb.updateCommunity(id, updates);
  }

  // Automations
  async getAutomations(): Promise<AutomationWorkflow[]> {
    return jsonDb.getAutomations();
  }

  async createAutomation(workflow: AutomationWorkflow): Promise<AutomationWorkflow> {
    return jsonDb.createAutomation(workflow);
  }

  async updateAutomation(id: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow | null> {
    return jsonDb.updateAutomation(id, updates);
  }

  // Agents
  async getAgents(): Promise<IntelligentAgent[]> {
    return jsonDb.getAgents();
  }

  async createAgent(agent: IntelligentAgent): Promise<IntelligentAgent> {
    return jsonDb.createAgent(agent);
  }

  async updateAgent(id: string, updates: Partial<IntelligentAgent>): Promise<IntelligentAgent | null> {
    return jsonDb.updateAgent(id, updates);
  }
}


