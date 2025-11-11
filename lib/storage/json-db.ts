import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
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

const DATA_DIR = path.join(process.cwd(), 'data');

const DEFAULT_TENANT_ID = 'tenant_default';

const nowISO = () => new Date().toISOString();

const defaultTenants: Tenant[] = [
  {
    id: DEFAULT_TENANT_ID,
    slug: 'smart-presale',
    name: 'Smart Pre-Sale',
    status: 'active',
    region: 'latam',
    metadata: { default: true },
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
];

const defaultTenantSettings: TenantSettings[] = [
  {
    id: randomUUID(),
    tenantId: DEFAULT_TENANT_ID,
    logoUrl: null,
    darkLogoUrl: null,
    squareLogoUrl: null,
    faviconUrl: null,
    primaryColor: '#1e3a8a',
    primaryColorForeground: '#ffffff',
    secondaryColor: '#10b981',
    accentColor: '#f97316',
    backgroundColor: '#f9fafb',
    surfaceColor: '#ffffff',
    foregroundColor: '#111827',
    fontFamily: 'Inter',
    metadata: { default: true },
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
];

const defaultUsers: User[] = [
  { id: 'u_buyer_1', name: 'Ana Compradora', role: 'buyer', kycStatus: 'basic', tenantId: DEFAULT_TENANT_ID },
  { id: 'u_dev_1', name: 'Carlos Dev', role: 'developer', kycStatus: 'verified', tenantId: DEFAULT_TENANT_ID },
  { id: 'u_admin_1', name: 'Pat Admin', role: 'admin', kycStatus: 'verified', tenantId: DEFAULT_TENANT_ID }
];

const defaultDevelopers: Developer[] = [
  { id: 'd1', userId: 'u_dev_1', company: 'BlueRock Dev S.A.', verifiedAt: nowISO(), tenantId: DEFAULT_TENANT_ID }
];

const defaultClients: Client[] = [
  {
    id: randomUUID(),
    tenantId: DEFAULT_TENANT_ID,
    name: 'Preventa Demo',
    contactName: 'Ana Compradora',
    contactEmail: 'ana@example.com',
    contactPhone: '+52 555 555 0000',
    status: 'active',
    metadata: { origin: 'demo' },
    createdAt: nowISO(),
    updatedAt: nowISO()
  }
];

const defaultPaymentWebhooks: PaymentWebhook[] = [];

// Asegurar que el directorio data existe
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

// Leer archivo JSON
const readJson = async <T>(filename: string, defaultValue: T[]): Promise<T[]> => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Si el archivo no existe, crear con valores por defecto
    await writeJson(filename, defaultValue);
    return defaultValue;
  }
};

// Escribir archivo JSON con validación
const writeJson = async <T>(filename: string, data: T[]): Promise<void> => {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');
    
    // Verificar que el archivo se escribió correctamente
    const verify = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(verify);
    if (parsed.length !== data.length) {
      throw new Error(`Error de escritura: el archivo ${filename} no se guardó correctamente`);
    }
  } catch (error: any) {
    console.error(`[json-db] Error al escribir ${filename}:`, error);
    throw new Error(`No se pudo guardar en ${filename}: ${error.message}`);
  }
};

// Operaciones CRUD genéricas
export const jsonDb = {
  // Usuarios
  async getUsers(): Promise<User[]> {
    return readJson<User>('users.json', defaultUsers);
  },

  async saveUsers(users: User[]): Promise<void> {
    return writeJson('users.json', users);
  },

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.id === id) ?? null;
  },

  async upsertUser(user: User): Promise<User> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    await this.saveUsers(users);
    return user;
  },

  // Desarrolladores
  async getDevelopers(): Promise<Developer[]> {
    return readJson<Developer>('developers.json', defaultDevelopers);
  },

  async saveDevelopers(developers: Developer[]): Promise<void> {
    return writeJson('developers.json', developers);
  },

  async getDeveloperById(id: string): Promise<Developer | null> {
    const developers = await this.getDevelopers();
    return developers.find(dev => dev.id === id) ?? null;
  },

  async createDeveloper(developer: Developer): Promise<Developer> {
    const developers = await this.getDevelopers();
    developers.push(developer);
    await this.saveDevelopers(developers);
    return developer;
  },

  async updateDeveloper(id: string, updates: Partial<Developer>): Promise<Developer | null> {
    const developers = await this.getDevelopers();
    const index = developers.findIndex(dev => dev.id === id);
    if (index === -1) return null;
    developers[index] = { ...developers[index], ...updates };
    await this.saveDevelopers(developers);
    return developers[index];
  },

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    return readJson<Tenant>('tenants.json', defaultTenants);
  },

  async saveTenants(tenants: Tenant[]): Promise<void> {
    return writeJson('tenants.json', tenants);
  },

  async getTenantById(id: string): Promise<Tenant | null> {
    const tenants = await this.getTenants();
    return tenants.find(t => t.id === id) ?? null;
  },

  async createTenant(tenant: Tenant): Promise<Tenant> {
    const tenants = await this.getTenants();
    tenants.push(tenant);
    await this.saveTenants(tenants);
    return tenant;
  },

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const tenants = await this.getTenants();
    const index = tenants.findIndex(t => t.id === id);
    if (index === -1) return null;
    tenants[index] = { ...tenants[index], ...updates, updatedAt: updates.updatedAt ?? nowISO() };
    await this.saveTenants(tenants);
    return tenants[index];
  },

  // Clients
  async getClients(): Promise<Client[]> {
    return readJson<Client>('clients.json', defaultClients);
  },

  async saveClients(clients: Client[]): Promise<void> {
    return writeJson('clients.json', clients);
  },

  async getClientsByTenantId(tenantId: string): Promise<Client[]> {
    const clients = await this.getClients();
    return clients.filter(client => client.tenantId === tenantId);
  },

  async createClient(client: Client): Promise<Client> {
    const clients = await this.getClients();
    clients.push(client);
    await this.saveClients(clients);
    return client;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const clients = await this.getClients();
    const index = clients.findIndex(client => client.id === id);
    if (index === -1) return null;
    clients[index] = { ...clients[index], ...updates, updatedAt: updates.updatedAt ?? nowISO() };
    await this.saveClients(clients);
    return clients[index];
  },

  // Tenant settings
  async getTenantSettings(): Promise<TenantSettings[]> {
    return readJson<TenantSettings>('tenant_settings.json', defaultTenantSettings);
  },

  async saveTenantSettings(settings: TenantSettings[]): Promise<void> {
    return writeJson('tenant_settings.json', settings);
  },

  async getTenantSettingsByTenantId(tenantId: string): Promise<TenantSettings | null> {
    const settings = await this.getTenantSettings();
    return settings.find(item => item.tenantId === tenantId) ?? null;
  },

  async upsertTenantSettings(settingsEntry: TenantSettings): Promise<TenantSettings> {
    const settings = await this.getTenantSettings();
    const index = settings.findIndex(item => item.tenantId === settingsEntry.tenantId);
    if (index >= 0) {
      const existing = settings[index];
      settings[index] = {
        ...existing,
        ...settingsEntry,
        createdAt: existing.createdAt,
        updatedAt: nowISO()
      };
    } else {
      settings.push({ ...settingsEntry, createdAt: nowISO(), updatedAt: nowISO() });
    }
    await this.saveTenantSettings(settings);
    return settingsEntry;
  },

  // Proyectos
  async getProjects(): Promise<Project[]> {
    return readJson<Project>('projects.json', []);
  },

  async saveProjects(projects: Project[]): Promise<void> {
    return writeJson('projects.json', projects);
  },

  async getProjectById(id: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find(p => p.id === id) || null;
  },

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find(p => p.slug === slug) || null;
  },

  async createProject(project: Project): Promise<Project> {
    try {
      const projects = await this.getProjects();
      
      // Verificar que no exista un proyecto con el mismo slug
      if (projects.some(p => p.slug === project.slug)) {
        throw new Error(`Ya existe un proyecto con el slug "${project.slug}"`);
      }
      
      projects.push(project);
      await this.saveProjects(projects);
      
      // Verificar que se creó correctamente
      const verify = await this.getProjectById(project.id);
      if (!verify) {
        throw new Error(`Error: el proyecto ${project.id} no se guardó correctamente`);
      }
      
      return project;
    } catch (error: any) {
      console.error(`[json-db] Error en createProject:`, error);
      throw error;
    }
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const projects = await this.getProjects();
      const index = projects.findIndex(p => p.id === id);
      if (index === -1) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[json-db] updateProject: Proyecto con id "${id}" no encontrado`);
        }
        return null;
      }
      
      const updated = { ...projects[index], ...updates };
      projects[index] = updated;
      
      await this.saveProjects(projects);
      
      // Verificar que la actualización se guardó
      const verify = await this.getProjectById(id);
      if (!verify) {
        throw new Error(`Error: la actualización del proyecto ${id} no se guardó correctamente`);
      }
      
      // Verificar que los campos actualizados se guardaron (si status fue actualizado, verificar)
      if (updates.status !== undefined && verify.status !== updates.status) {
        throw new Error(`Error: el status del proyecto ${id} no se actualizó correctamente`);
      }
      
      return updated;
    } catch (error: any) {
      console.error(`[json-db] Error en updateProject(${id}):`, error);
      throw error;
    }
  },

  // Rondas
  async getRounds(): Promise<Round[]> {
    return readJson<Round>('rounds.json', []);
  },

  async saveRounds(rounds: Round[]): Promise<void> {
    return writeJson('rounds.json', rounds);
  },

  async getRoundById(id: string): Promise<Round | null> {
    const rounds = await this.getRounds();
    return rounds.find(r => r.id === id) || null;
  },

  async getRoundByProjectId(projectId: string): Promise<Round | null> {
    const rounds = await this.getRounds();
    return rounds.find(r => r.projectId === projectId) || null;
  },

  async createRound(round: Round): Promise<Round> {
    const rounds = await this.getRounds();
    rounds.push(round);
    await this.saveRounds(rounds);
    return round;
  },

  async updateRound(id: string, updates: Partial<Round>): Promise<Round | null> {
    const rounds = await this.getRounds();
    const index = rounds.findIndex(r => r.id === id);
    if (index === -1) return null;
    rounds[index] = { ...rounds[index], ...updates };
    await this.saveRounds(rounds);
    return rounds[index];
  },

  // Reservas
  async getReservations(): Promise<Reservation[]> {
    return readJson<Reservation>('reservations.json', []);
  },

  async saveReservations(reservations: Reservation[]): Promise<void> {
    return writeJson('reservations.json', reservations);
  },

  async getReservationById(id: string): Promise<Reservation | null> {
    const reservations = await this.getReservations();
    return reservations.find(r => r.id === id) || null;
  },

  async getReservationsByRoundId(roundId: string): Promise<Reservation[]> {
    const reservations = await this.getReservations();
    return reservations.filter(r => r.roundId === roundId);
  },

  async getReservationsByUserId(userId: string): Promise<Reservation[]> {
    const reservations = await this.getReservations();
    return reservations.filter(r => r.userId === userId);
  },

  async createReservation(reservation: Reservation): Promise<Reservation> {
    const reservations = await this.getReservations();
    reservations.push(reservation);
    await this.saveReservations(reservations);
    return reservation;
  },

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    const reservations = await this.getReservations();
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) return null;
    reservations[index] = { ...reservations[index], ...updates };
    await this.saveReservations(reservations);
    return reservations[index];
  },

  // Transacciones
  async getTransactions(): Promise<Transaction[]> {
    return readJson<Transaction>('transactions.json', []);
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    return writeJson('transactions.json', transactions);
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    const transactions = await this.getTransactions();
    return transactions.find(t => t.id === id) || null;
  },

  async getTransactionByReservationId(reservationId: string): Promise<Transaction | null> {
    const transactions = await this.getTransactions();
    return transactions.find(t => t.reservationId === reservationId) || null;
  },

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    const transactions = await this.getTransactions();
    transactions.push(transaction);
    await this.saveTransactions(transactions);
    return transaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return null;
    transactions[index] = { ...transactions[index], ...updates };
    await this.saveTransactions(transactions);
    return transactions[index];
  },

  // Payment webhooks
  async getPaymentWebhooks(): Promise<PaymentWebhook[]> {
    return readJson<PaymentWebhook>('payment-webhooks.json', defaultPaymentWebhooks);
  },

  async savePaymentWebhooks(events: PaymentWebhook[]): Promise<void> {
    return writeJson('payment-webhooks.json', events);
  },

  async getPaymentWebhookById(id: string): Promise<PaymentWebhook | null> {
    const events = await this.getPaymentWebhooks();
    return events.find(event => event.id === id) ?? null;
  },

  async createPaymentWebhook(event: PaymentWebhook): Promise<PaymentWebhook> {
    const events = await this.getPaymentWebhooks();
    const index = events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      events[index] = { ...events[index], ...event };
    } else {
      events.push(event);
    }
    await this.savePaymentWebhooks(events);
    return event;
  },

  async updatePaymentWebhook(id: string, updates: Partial<PaymentWebhook>): Promise<PaymentWebhook | null> {
    const events = await this.getPaymentWebhooks();
    const index = events.findIndex(event => event.id === id);
    if (index === -1) return null;
    events[index] = { ...events[index], ...updates } as PaymentWebhook;
    await this.savePaymentWebhooks(events);
    return events[index];
  },

  // Research
  async getResearch(): Promise<ResearchItem[]> {
    return readJson<ResearchItem>('research.json', []);
  },

  async saveResearch(research: ResearchItem[]): Promise<void> {
    return writeJson('research.json', research);
  },

  async getResearchByProjectId(projectId: string): Promise<ResearchItem[]> {
    const research = await this.getResearch();
    return research.filter(r => r.projectId === projectId);
  },

  async createResearchItem(item: ResearchItem): Promise<ResearchItem> {
    const research = await this.getResearch();
    research.push(item);
    await this.saveResearch(research);
    return item;
  },

  // Price History (Record<string, PricePoint[]>)
  async getPriceHistory(): Promise<Record<string, PricePoint[]>> {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, 'price-history.json');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      const defaultValue: Record<string, PricePoint[]> = {};
      await this.savePriceHistory(defaultValue);
      return defaultValue;
    }
  },

  async savePriceHistory(history: Record<string, PricePoint[]>): Promise<void> {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, 'price-history.json');
    await fs.writeFile(filePath, JSON.stringify(history, null, 2), 'utf-8');
  },

  async getPriceHistoryByProjectId(projectId: string): Promise<PricePoint[]> {
    const history = await this.getPriceHistory();
    return history[projectId] || [];
  },

  async addPricePoint(projectId: string, point: PricePoint): Promise<void> {
    const history = await this.getPriceHistory();
    if (!history[projectId]) {
      history[projectId] = [];
    }
    history[projectId].push(point);
    await this.savePriceHistory(history);
  },

  // Secondary Listings
  async getListings(): Promise<SecondaryListing[]> {
    return readJson<SecondaryListing>('listings.json', []);
  },

  async saveListings(listings: SecondaryListing[]): Promise<void> {
    return writeJson('listings.json', listings);
  },

  async getListingsByProjectId(projectId: string): Promise<SecondaryListing[]> {
    const listings = await this.getListings();
    return listings.filter(l => l.projectId === projectId);
  },

  async getListingById(id: string): Promise<SecondaryListing | null> {
    const listings = await this.getListings();
    return listings.find(l => l.id === id) || null;
  },

  async createListing(listing: SecondaryListing): Promise<SecondaryListing> {
    const listings = await this.getListings();
    listings.push(listing);
    await this.saveListings(listings);
    return listing;
  },

  async updateListing(id: string, updates: Partial<SecondaryListing>): Promise<SecondaryListing | null> {
    const listings = await this.getListings();
    const index = listings.findIndex(l => l.id === id);
    if (index === -1) return null;
    listings[index] = { ...listings[index], ...updates };
    await this.saveListings(listings);
    return listings[index];
  },

  // Trades
  async getTrades(): Promise<Trade[]> {
    return readJson<Trade>('trades.json', []);
  },

  async saveTrades(trades: Trade[]): Promise<void> {
    return writeJson('trades.json', trades);
  },

  async createTrade(trade: Trade): Promise<Trade> {
    const trades = await this.getTrades();
    trades.push(trade);
    await this.saveTrades(trades);
    return trade;
  },

  // Documents
  async getDocuments(): Promise<ProjectDocument[]> {
    return readJson<ProjectDocument>('documents.json', []);
  },

  async saveDocuments(documents: ProjectDocument[]): Promise<void> {
    return writeJson('documents.json', documents);
  },

  async getDocumentById(id: string): Promise<ProjectDocument | null> {
    const documents = await this.getDocuments();
    return documents.find(d => d.id === id) || null;
  },

  async getDocumentsByProjectId(projectId: string): Promise<ProjectDocument[]> {
    const documents = await this.getDocuments();
    return documents.filter(d => d.projectId === projectId);
  },

  async getDocumentsByDeveloperId(developerId: string): Promise<ProjectDocument[]> {
    const documents = await this.getDocuments();
    // Necesitamos obtener los proyectos del desarrollador primero
    const projects = await this.getProjects();
    const projectIds = projects.filter(p => p.developerId === developerId).map(p => p.id);
    return documents.filter(d => projectIds.includes(d.projectId));
  },

  async createDocument(document: ProjectDocument): Promise<ProjectDocument> {
    const documents = await this.getDocuments();
    documents.push(document);
    await this.saveDocuments(documents);
    return document;
  },

  async updateDocument(id: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument | null> {
    const documents = await this.getDocuments();
    const index = documents.findIndex(d => d.id === id);
    if (index === -1) return null;
    documents[index] = { ...documents[index], ...updates };
    await this.saveDocuments(documents);
    return documents[index];
  },

  async deleteDocument(id: string): Promise<boolean> {
    const documents = await this.getDocuments();
    const index = documents.findIndex(d => d.id === id);
    if (index === -1) return false;
    documents.splice(index, 1);
    await this.saveDocuments(documents);
    return true;
  },

  // Communities
  async getCommunities(): Promise<Community[]> {
    return readJson<Community>('communities.json', []);
  },

  async saveCommunities(communities: Community[]): Promise<void> {
    return writeJson('communities.json', communities);
  },

  async getCommunityBySlug(slug: string): Promise<Community | null> {
    const communities = await this.getCommunities();
    return communities.find(c => c.slug === slug) || null;
  },

  async getCommunitiesByProjectId(projectId: string): Promise<Community[]> {
    const communities = await this.getCommunities();
    return communities.filter(c => c.projectId === projectId);
  },

  async createCommunity(community: Community): Promise<Community> {
    const communities = await this.getCommunities();
    communities.push(community);
    await this.saveCommunities(communities);
    return community;
  },

  async updateCommunity(id: string, updates: Partial<Community>): Promise<Community | null> {
    const communities = await this.getCommunities();
    const index = communities.findIndex(c => c.id === id);
    if (index === -1) return null;
    communities[index] = { ...communities[index], ...updates };
    await this.saveCommunities(communities);
    return communities[index];
  },

  // Automations
  async getAutomations(): Promise<AutomationWorkflow[]> {
    return readJson<AutomationWorkflow>('automations.json', []);
  },

  async saveAutomations(automations: AutomationWorkflow[]): Promise<void> {
    return writeJson('automations.json', automations);
  },

  async createAutomation(workflow: AutomationWorkflow): Promise<AutomationWorkflow> {
    const automations = await this.getAutomations();
    automations.push(workflow);
    await this.saveAutomations(automations);
    return workflow;
  },

  async updateAutomation(id: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow | null> {
    const automations = await this.getAutomations();
    const index = automations.findIndex(a => a.id === id);
    if (index === -1) return null;
    automations[index] = {
      ...automations[index],
      ...updates,
      updatedAt: updates.updatedAt || automations[index].updatedAt
    };
    await this.saveAutomations(automations);
    return automations[index];
  },

  // Agents
  async getAgents(): Promise<IntelligentAgent[]> {
    return readJson<IntelligentAgent>('agents.json', []);
  },

  async saveAgents(agents: IntelligentAgent[]): Promise<void> {
    return writeJson('agents.json', agents);
  },

  async createAgent(agent: IntelligentAgent): Promise<IntelligentAgent> {
    const agents = await this.getAgents();
    agents.push(agent);
    await this.saveAgents(agents);
    return agent;
  },

  async updateAgent(id: string, updates: Partial<IntelligentAgent>): Promise<IntelligentAgent | null> {
    const agents = await this.getAgents();
    const index = agents.findIndex(a => a.id === id);
    if (index === -1) return null;
    agents[index] = {
      ...agents[index],
      ...updates,
      updatedAt: updates.updatedAt || agents[index].updatedAt
    };
    await this.saveAgents(agents);
    return agents[index];
  }
};

