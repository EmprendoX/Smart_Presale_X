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
  Transaction
} from '../types';

type TableName =
  | 'projects'
  | 'rounds'
  | 'reservations'
  | 'transactions'
  | 'research_items'
  | 'price_points'
  | 'secondary_listings'
  | 'trades'
  | 'project_documents'
  | 'communities'
  | 'automation_workflows'
  | 'intelligent_agents';

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

function resolveSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return { url, anonKey };
}

function throwSupabaseError(context: string, error: any): never {
  const message = typeof error?.message === 'string' ? error.message : 'Unknown Supabase error';
  throw new Error(`[Supabase] ${context}: ${message}`);
}

export class SupabaseService implements DatabaseService {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    if (client) {
      this.client = client;
      return;
    }

    const { url, anonKey } = resolveSupabaseEnv();
    this.client = createClient(url, anonKey, {
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
  private async selectAll<T>(table: TableName): Promise<T[]> {
    const { data, error } = await this.client.from(table).select('*');
    if (error) {
      throwSupabaseError(`selectAll:${table}`, error);
    }
    return (data as T[]) ?? [];
  }

  private async selectSingle<T>(table: TableName, column: string, value: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq(column, value)
      .maybeSingle();

    if (error) {
      throwSupabaseError(`selectSingle:${table}`, error);
    }

    return (data as T | null) ?? null;
  }

  private async selectMany<T>(table: TableName, column: string, value: string): Promise<T[]> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq(column, value);

    if (error) {
      throwSupabaseError(`selectMany:${table}`, error);
    }

    return (data as T[]) ?? [];
  }

  private async insertSingle<T>(table: TableName, payload: Partial<T>): Promise<T> {
    const { data, error } = await this.client.from(table).insert(payload).select().single();
    if (error) {
      throwSupabaseError(`insert:${table}`, error);
    }
    return data as T;
  }

  private async updateSingle<T>(table: TableName, id: string, payload: Partial<T>): Promise<T | null> {
    const { data, error } = await this.client
      .from(table)
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throwSupabaseError(`update:${table}`, error);
    }

    return (data as T | null) ?? null;
  }

  private async deleteById(table: TableName, id: string): Promise<boolean> {
    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) {
      throwSupabaseError(`delete:${table}`, error);
    }
    return true;
  }

  // ===== Projects =====
  async getProjects(): Promise<Project[]> {
    return this.selectAll<Project>('projects');
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.selectSingle<Project>('projects', 'id', id);
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    return this.selectSingle<Project>('projects', 'slug', slug);
  }

  async createProject(project: Project): Promise<Project> {
    return this.insertSingle<Project>('projects', project);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    return this.updateSingle<Project>('projects', id, updates);
  }

  // ===== Rounds =====
  async getRounds(): Promise<Round[]> {
    return this.selectAll<Round>('rounds');
  }

  async getRoundById(id: string): Promise<Round | null> {
    return this.selectSingle<Round>('rounds', 'id', id);
  }

  async getRoundByProjectId(projectId: string): Promise<Round | null> {
    return this.selectSingle<Round>('rounds', 'projectId', projectId);
  }

  async createRound(round: Round): Promise<Round> {
    return this.insertSingle<Round>('rounds', round);
  }

  async updateRound(id: string, updates: Partial<Round>): Promise<Round | null> {
    return this.updateSingle<Round>('rounds', id, updates);
  }

  // ===== Reservations =====
  async getReservations(): Promise<Reservation[]> {
    return this.selectAll<Reservation>('reservations');
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    return this.selectSingle<Reservation>('reservations', 'id', id);
  }

  async getReservationsByRoundId(roundId: string): Promise<Reservation[]> {
    return this.selectMany<Reservation>('reservations', 'roundId', roundId);
  }

  async getReservationsByUserId(userId: string): Promise<Reservation[]> {
    return this.selectMany<Reservation>('reservations', 'userId', userId);
  }

  async createReservation(reservation: Reservation): Promise<Reservation> {
    return this.insertSingle<Reservation>('reservations', reservation);
  }

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    return this.updateSingle<Reservation>('reservations', id, updates);
  }

  // ===== Transactions =====
  async getTransactions(): Promise<Transaction[]> {
    return this.selectAll<Transaction>('transactions');
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.selectSingle<Transaction>('transactions', 'id', id);
  }

  async getTransactionByReservationId(reservationId: string): Promise<Transaction | null> {
    return this.selectSingle<Transaction>('transactions', 'reservationId', reservationId);
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    return this.insertSingle<Transaction>('transactions', transaction);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    return this.updateSingle<Transaction>('transactions', id, updates);
  }

  // ===== Research =====
  async getResearch(): Promise<ResearchItem[]> {
    return this.selectAll<ResearchItem>('research_items');
  }

  async getResearchByProjectId(projectId: string): Promise<ResearchItem[]> {
    return this.selectMany<ResearchItem>('research_items', 'projectId', projectId);
  }

  async createResearchItem(item: ResearchItem): Promise<ResearchItem> {
    return this.insertSingle<ResearchItem>('research_items', item);
  }

  // ===== Price history =====
  async getPriceHistory(): Promise<Record<string, PricePoint[]>> {
    const points = await this.selectAll<PricePoint & { projectId: string }>('price_points');
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
    const items = await this.selectMany<PricePoint & { projectId: string }>('price_points', 'projectId', projectId);
    return items.map(item => {
      const { projectId: _ignored, ...rest } = item as PricePoint & { projectId: string };
      return rest as PricePoint;
    });
  }

  async addPricePoint(projectId: string, point: PricePoint): Promise<void> {
    const payload = { ...point, projectId };
    const { error } = await this.client.from('price_points').insert(payload);
    if (error) {
      throwSupabaseError('addPricePoint', error);
    }
  }

  // ===== Secondary listings =====
  async getListings(): Promise<SecondaryListing[]> {
    return this.selectAll<SecondaryListing>('secondary_listings');
  }

  async getListingsByProjectId(projectId: string): Promise<SecondaryListing[]> {
    return this.selectMany<SecondaryListing>('secondary_listings', 'projectId', projectId);
  }

  async getListingById(id: string): Promise<SecondaryListing | null> {
    return this.selectSingle<SecondaryListing>('secondary_listings', 'id', id);
  }

  async createListing(listing: SecondaryListing): Promise<SecondaryListing> {
    return this.insertSingle<SecondaryListing>('secondary_listings', listing);
  }

  async updateListing(id: string, updates: Partial<SecondaryListing>): Promise<SecondaryListing | null> {
    return this.updateSingle<SecondaryListing>('secondary_listings', id, updates);
  }

  // ===== Trades =====
  async getTrades(): Promise<Trade[]> {
    return this.selectAll<Trade>('trades');
  }

  async createTrade(trade: Trade): Promise<Trade> {
    return this.insertSingle<Trade>('trades', trade);
  }

  // ===== Documents =====
  async getDocuments(): Promise<ProjectDocument[]> {
    return this.selectAll<ProjectDocument>('project_documents');
  }

  async getDocumentById(id: string): Promise<ProjectDocument | null> {
    return this.selectSingle<ProjectDocument>('project_documents', 'id', id);
  }

  async getDocumentsByProjectId(projectId: string): Promise<ProjectDocument[]> {
    return this.selectMany<ProjectDocument>('project_documents', 'projectId', projectId);
  }

  async getDocumentsByDeveloperId(developerId: string): Promise<ProjectDocument[]> {
    return this.selectMany<ProjectDocument>('project_documents', 'uploadedBy', developerId);
  }

  async createDocument(document: ProjectDocument): Promise<ProjectDocument> {
    return this.insertSingle<ProjectDocument>('project_documents', document);
  }

  async updateDocument(id: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument | null> {
    return this.updateSingle<ProjectDocument>('project_documents', id, updates);
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.deleteById('project_documents', id);
  }

  // ===== Communities =====
  async getCommunities(): Promise<Community[]> {
    return this.selectAll<Community>('communities');
  }

  async getCommunityBySlug(slug: string): Promise<Community | null> {
    return this.selectSingle<Community>('communities', 'slug', slug);
  }

  async getCommunitiesByProjectId(projectId: string): Promise<Community[]> {
    return this.selectMany<Community>('communities', 'projectId', projectId);
  }

  async createCommunity(community: Community): Promise<Community> {
    return this.insertSingle<Community>('communities', community);
  }

  async updateCommunity(id: string, updates: Partial<Community>): Promise<Community | null> {
    return this.updateSingle<Community>('communities', id, updates);
  }

  // ===== Automations & agents =====
  async getAutomations(): Promise<AutomationWorkflow[]> {
    return this.selectAll<AutomationWorkflow>('automation_workflows');
  }

  async createAutomation(workflow: AutomationWorkflow): Promise<AutomationWorkflow> {
    return this.insertSingle<AutomationWorkflow>('automation_workflows', workflow);
  }

  async updateAutomation(id: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow | null> {
    return this.updateSingle<AutomationWorkflow>('automation_workflows', id, updates);
  }

  async getAgents(): Promise<IntelligentAgent[]> {
    return this.selectAll<IntelligentAgent>('intelligent_agents');
  }

  async createAgent(agent: IntelligentAgent): Promise<IntelligentAgent> {
    return this.insertSingle<IntelligentAgent>('intelligent_agents', agent);
  }

  async updateAgent(id: string, updates: Partial<IntelligentAgent>): Promise<IntelligentAgent | null> {
    return this.updateSingle<IntelligentAgent>('intelligent_agents', id, updates);
  }
}
