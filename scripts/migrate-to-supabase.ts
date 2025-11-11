import { SupabaseService } from "@/lib/services/supabase-service";
import { jsonDb } from "@/lib/storage/json-db";
import type {
  AutomationWorkflow,
  Client,
  Community,
  IntelligentAgent,
  PricePoint,
  Project,
  ProjectDocument,
  Reservation,
  ResearchItem,
  Round,
  SecondaryListing,
  TenantSettings,
  Trade,
  Transaction
} from "@/lib/types";

const service = new SupabaseService();

function logStep(message: string) {
  console.log(`➡️  ${message}`);
}

async function upsertProject(project: Project) {
  const existing = await service.getProjectById(project.id);
  if (existing) {
    await service.updateProject(project.id, project);
  } else {
    await service.createProject(project);
  }
}

async function upsertRound(round: Round) {
  const existing = await service.getRoundById(round.id);
  if (existing) {
    await service.updateRound(round.id, round);
  } else {
    await service.createRound(round);
  }
}

async function upsertReservation(reservation: Reservation) {
  const existing = await service.getReservationById(reservation.id);
  if (existing) {
    await service.updateReservation(reservation.id, reservation);
  } else {
    await service.createReservation(reservation);
  }
}

async function upsertTransaction(transaction: Transaction) {
  const existing = await service.getTransactionById(transaction.id);
  if (existing) {
    await service.updateTransaction(transaction.id, transaction);
  } else {
    await service.createTransaction(transaction);
  }
}

async function migrate() {
  logStep("Sincronizando tenants");
  const tenants = await jsonDb.getTenants();
  for (const tenant of tenants) {
    const existing = await service.getTenantById(tenant.id);
    if (existing) {
      await service.updateTenant(tenant.id, tenant);
    } else {
      await service.createTenant(tenant);
    }

    const settings = await jsonDb.getTenantSettingsByTenantId(tenant.id);
    if (settings) {
      await service.upsertTenantSettings(settings as TenantSettings);
    }
  }

  logStep("Sincronizando usuarios y developers");
  const users = await jsonDb.getUsers();
  for (const user of users) {
    await service.upsertUser(user);
  }

  const developers = await jsonDb.getDevelopers();
  for (const developer of developers) {
    const existingDev = await service.getDeveloperById(developer.id);
    if (existingDev) {
      await service.updateDeveloper(developer.id, developer);
    } else {
      await service.createDeveloper(developer);
    }
  }

  const clients = await jsonDb.getClients();
  for (const client of clients) {
    const existingClient = (await service.getClientsByTenantId(client.tenantId)).find(c => c.id === client.id);
    if (existingClient) {
      await service.updateClient(client.id, client as Client);
    } else {
      await service.createClient(client as Client);
    }
  }

  logStep("Sincronizando proyectos");
  const projects = await jsonDb.getProjects();
  for (const project of projects) {
    await upsertProject(project as Project);
  }

  logStep("Sincronizando rondas");
  const rounds = await jsonDb.getRounds();
  for (const round of rounds) {
    await upsertRound(round as Round);
  }

  logStep("Sincronizando reservas");
  const reservations = await jsonDb.getReservations();
  for (const reservation of reservations) {
    await upsertReservation(reservation as Reservation);
  }

  logStep("Sincronizando transacciones");
  const transactions = await jsonDb.getTransactions();
  for (const transaction of transactions) {
    await upsertTransaction(transaction as Transaction);
  }

  logStep("Sincronizando research");
  const research = await jsonDb.getResearch();
  for (const item of research) {
    const existingItems = await service.getResearchByProjectId(item.projectId);
    if (existingItems.some(existing => existing.id === item.id)) {
      continue;
    }
    await service.createResearchItem(item as ResearchItem);
  }

  logStep("Sincronizando históricos de precios");
  const priceHistory = await jsonDb.getPriceHistory();
  for (const [projectId, points] of Object.entries(priceHistory)) {
    for (const point of points as PricePoint[]) {
      await service.addPricePoint(projectId, point);
    }
  }

  logStep("Sincronizando documentos");
  const documents = await jsonDb.getDocuments();
  for (const document of documents) {
    const existingDoc = await service.getDocumentById(document.id);
    if (existingDoc) {
      await service.updateDocument(document.id, document as ProjectDocument);
    } else {
      await service.createDocument(document as ProjectDocument);
    }
  }

  logStep("Sincronizando comunidades");
  const communities = await jsonDb.getCommunities();
  for (const community of communities) {
    const existingCommunity = await service.getCommunityBySlug(community.slug);
    if (existingCommunity) {
      await service.updateCommunity(existingCommunity.id, community as Community);
    } else {
      await service.createCommunity(community as Community);
    }
  }

  logStep("Sincronizando automatizaciones");
  const automations = await jsonDb.getAutomations();
  for (const automation of automations) {
    const existingAutomation = (await service.getAutomations()).find(item => item.id === automation.id);
    if (existingAutomation) {
      await service.updateAutomation(automation.id, automation as AutomationWorkflow);
    } else {
      await service.createAutomation(automation as AutomationWorkflow);
    }
  }

  logStep("Sincronizando agentes");
  const agents = await jsonDb.getAgents();
  for (const agent of agents) {
    const existingAgent = (await service.getAgents()).find(item => item.id === agent.id);
    if (existingAgent) {
      await service.updateAgent(agent.id, agent as IntelligentAgent);
    } else {
      await service.createAgent(agent as IntelligentAgent);
    }
  }

  logStep("Sincronizando mercado secundario");
  const listings = await jsonDb.getListings();
  for (const listing of listings as SecondaryListing[]) {
    const existingListing = await service.getListingById(listing.id);
    if (existingListing) {
      await service.updateListing(listing.id, listing);
    } else {
      await service.createListing(listing);
    }
  }

  const trades = await jsonDb.getTrades();
  for (const trade of trades as Trade[]) {
    const existingTrade = (await service.getTrades()).find(item => item.id === trade.id);
    if (!existingTrade) {
      await service.createTrade(trade);
    }
  }

  logStep("Migración completada");
}

migrate().catch(error => {
  console.error("❌ Error en la migración:", error);
  process.exit(1);
});
