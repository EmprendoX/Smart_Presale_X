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
} from '../types';

/**
 * Placeholder para el servicio de Supabase
 * 
 * Cuando estés listo para conectar Supabase:
 * 1. Instalar: npm install @supabase/supabase-js
 * 2. Configurar variables de entorno en .env.local
 * 3. Implementar los métodos usando el cliente de Supabase
 * 4. Cambiar USE_SUPABASE=true en lib/config.ts
 * 
 * Ejemplo de estructura:
 * 
 * import { createClient } from '@supabase/supabase-js';
 * 
 * const supabase = createClient(
 *   process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 * );
 * 
 * export class SupabaseService implements DatabaseService {
 *   async getProjects(): Promise<Project[]> {
 *     const { data, error } = await supabase
 *       .from('projects')
 *       .select('*');
 *     if (error) throw error;
 *     return data || [];
 *   }
 *   // ... implementar resto de métodos
 * }
 */
export class SupabaseService implements DatabaseService {
  async getProjects(): Promise<Project[]> {
    throw new Error('Supabase service not configured. Set USE_SUPABASE=true and implement the service.');
  }

  async getProjectById(id: string): Promise<Project | null> {
    throw new Error('Supabase service not configured.');
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    throw new Error('Supabase service not configured.');
  }

  async createProject(project: Project): Promise<Project> {
    throw new Error('Supabase service not configured.');
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    throw new Error('Supabase service not configured.');
  }

  async getRounds(): Promise<Round[]> {
    throw new Error('Supabase service not configured.');
  }

  async getRoundById(id: string): Promise<Round | null> {
    throw new Error('Supabase service not configured.');
  }

  async getRoundByProjectId(projectId: string): Promise<Round | null> {
    throw new Error('Supabase service not configured.');
  }

  async createRound(round: Round): Promise<Round> {
    throw new Error('Supabase service not configured.');
  }

  async updateRound(id: string, updates: Partial<Round>): Promise<Round | null> {
    throw new Error('Supabase service not configured.');
  }

  async getReservations(): Promise<Reservation[]> {
    throw new Error('Supabase service not configured.');
  }

  async getReservationById(id: string): Promise<Reservation | null> {
    throw new Error('Supabase service not configured.');
  }

  async getReservationsByRoundId(roundId: string): Promise<Reservation[]> {
    throw new Error('Supabase service not configured.');
  }

  async getReservationsByUserId(userId: string): Promise<Reservation[]> {
    throw new Error('Supabase service not configured.');
  }

  async createReservation(reservation: Reservation): Promise<Reservation> {
    throw new Error('Supabase service not configured.');
  }

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    throw new Error('Supabase service not configured.');
  }

  async getTransactions(): Promise<Transaction[]> {
    throw new Error('Supabase service not configured.');
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    throw new Error('Supabase service not configured.');
  }

  async getTransactionByReservationId(reservationId: string): Promise<Transaction | null> {
    throw new Error('Supabase service not configured.');
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    throw new Error('Supabase service not configured.');
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    throw new Error('Supabase service not configured.');
  }

  async getResearch(): Promise<ResearchItem[]> {
    throw new Error('Supabase service not configured.');
  }

  async getResearchByProjectId(projectId: string): Promise<ResearchItem[]> {
    throw new Error('Supabase service not configured.');
  }

  async createResearchItem(item: ResearchItem): Promise<ResearchItem> {
    throw new Error('Supabase service not configured.');
  }

  async getPriceHistory(): Promise<Record<string, PricePoint[]>> {
    throw new Error('Supabase service not configured.');
  }

  async getPriceHistoryByProjectId(projectId: string): Promise<PricePoint[]> {
    throw new Error('Supabase service not configured.');
  }

  async addPricePoint(projectId: string, point: PricePoint): Promise<void> {
    throw new Error('Supabase service not configured.');
  }

  async getListings(): Promise<SecondaryListing[]> {
    throw new Error('Supabase service not configured.');
  }

  async getListingsByProjectId(projectId: string): Promise<SecondaryListing[]> {
    throw new Error('Supabase service not configured.');
  }

  async getListingById(id: string): Promise<SecondaryListing | null> {
    throw new Error('Supabase service not configured.');
  }

  async createListing(listing: SecondaryListing): Promise<SecondaryListing> {
    throw new Error('Supabase service not configured.');
  }

  async updateListing(id: string, updates: Partial<SecondaryListing>): Promise<SecondaryListing | null> {
    throw new Error('Supabase service not configured.');
  }

  async getTrades(): Promise<Trade[]> {
    throw new Error('Supabase service not configured.');
  }

  async createTrade(trade: Trade): Promise<Trade> {
    throw new Error('Supabase service not configured.');
  }

  async getDocuments(): Promise<ProjectDocument[]> {
    throw new Error('Supabase service not configured.');
  }

  async getDocumentById(id: string): Promise<ProjectDocument | null> {
    throw new Error('Supabase service not configured.');
  }

  async getDocumentsByProjectId(projectId: string): Promise<ProjectDocument[]> {
    throw new Error('Supabase service not configured.');
  }

  async getDocumentsByDeveloperId(developerId: string): Promise<ProjectDocument[]> {
    throw new Error('Supabase service not configured.');
  }

  async createDocument(document: ProjectDocument): Promise<ProjectDocument> {
    throw new Error('Supabase service not configured.');
  }

  async updateDocument(id: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument | null> {
    throw new Error('Supabase service not configured.');
  }

  async deleteDocument(id: string): Promise<boolean> {
    throw new Error('Supabase service not configured.');
  }

  async getCommunities(): Promise<Community[]> {
    throw new Error('Supabase service not configured.');
  }

  async getCommunityBySlug(slug: string): Promise<Community | null> {
    throw new Error('Supabase service not configured.');
  }

  async getCommunitiesByProjectId(projectId: string): Promise<Community[]> {
    throw new Error('Supabase service not configured.');
  }

  async createCommunity(community: Community): Promise<Community> {
    throw new Error('Supabase service not configured.');
  }

  async updateCommunity(id: string, updates: Partial<Community>): Promise<Community | null> {
    throw new Error('Supabase service not configured.');
  }

  async getAutomations(): Promise<AutomationWorkflow[]> {
    throw new Error('Supabase service not configured.');
  }

  async createAutomation(workflow: AutomationWorkflow): Promise<AutomationWorkflow> {
    throw new Error('Supabase service not configured.');
  }

  async updateAutomation(
    id: string,
    updates: Partial<AutomationWorkflow>
  ): Promise<AutomationWorkflow | null> {
    throw new Error('Supabase service not configured.');
  }

  async getAgents(): Promise<IntelligentAgent[]> {
    throw new Error('Supabase service not configured.');
  }

  async createAgent(agent: IntelligentAgent): Promise<IntelligentAgent> {
    throw new Error('Supabase service not configured.');
  }

  async updateAgent(id: string, updates: Partial<IntelligentAgent>): Promise<IntelligentAgent | null> {
    throw new Error('Supabase service not configured.');
  }
}


