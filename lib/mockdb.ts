import {
  Currency,
  Developer,
  Project,
  ProjectDocument,
  Reservation,
  Round,
  Transaction,
  User,
  ResearchItem,
  PricePoint,
  AutomationWorkflow,
  IntelligentAgent,
  Community,
  ListingType
} from "./types";
import { db } from "./config";

// Usuarios y desarrolladores (solo para demo, no se persisten aún)
const users: User[] = [
  { id: "u_buyer_1", name: "Ana Compradora", role: "buyer", kycStatus: "basic" },
  { id: "u_dev_1", name: "Carlos Dev", role: "developer", kycStatus: "verified" },
  { id: "u_admin_1", name: "Pat Admin", role: "admin", kycStatus: "verified" }
];

const developers: Developer[] = [
  { id: "d1", userId: "u_dev_1", company: "BlueRock Dev S.A.", verifiedAt: new Date().toISOString() }
];

const documents: ProjectDocument[] = [
  { id: crypto.randomUUID(), projectId: "p1", type: "title", url: "#", access: "public", title: "Título de propiedad", fileName: "titulo.pdf", uploadedAt: new Date().toISOString(), uploadedBy: "u_admin_1" },
  { id: crypto.randomUUID(), projectId: "p1", type: "permit", url: "#", access: "public", title: "Permiso de construcción", fileName: "permiso.pdf", uploadedAt: new Date().toISOString(), uploadedBy: "u_admin_1" },
  { id: crypto.randomUUID(), projectId: "p1", type: "terms", url: "#", access: "public", title: "Términos y condiciones", fileName: "terminos.pdf", uploadedAt: new Date().toISOString(), uploadedBy: "u_admin_1" }
];

// Inicializar datos por defecto si no existen
const initializeDefaultData = async () => {
  const projects = await db.getProjects();
  if (projects.length === 0) {
    const nowISO = () => new Date().toISOString();
    
    // Proyectos de ejemplo
    const defaultProjects: Project[] = [
      {
        id: "p1",
        slug: "residencial-arrecife",
        name: "Residencial Arrecife",
        city: "Cancún",
        country: "MX",
        currency: "USD",
        status: "published",
        listingType: "presale",
        stage: "Preventa",
        availabilityStatus: "available",
        images: [
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1505691723518-36a9f3a59c07?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop"
        ],
        description: "Torre residencial frente al mar. Entrega estimada 2027.",
        developerId: "d1",
        createdAt: nowISO(),
        ticker: "SPS:ARRCF",
        totalUnits: 120,
        attributes: ["Frente al mar", "Campo de golf a 5 min", "Alberca", "Gimnasio", "Seguridad 24/7"],
        specs: {
          "Entrega": "Q2 2027",
          "Régimen": "Condominal",
          "Superficie": "65–180 m²",
          "Estacionamientos": "1–2"
        },
        zone: {
          summary: "Zona hotelera con alta absorción turística, conectividad y servicios premium.",
          golf: ["Club de Golf Cancún", "Riviera Golf"],
          schools: ["Colegio Internacional Cancún"],
          transport: ["Aeropuerto CUN a 20 min", "Conectividad Blvd. Kukulcán"],
          retail: ["La Isla Shopping Village", "Luxury Avenue"]
        },
        propertyType: "Departamentos de lujo",
        propertyPrice: 480000,
        developmentStage: "Estructura",
        askingPrice: 495000,
        propertyDetails: {
          bedrooms: 3,
          bathrooms: 2,
          halfBathrooms: 1,
          surfaceArea: 145,
          parkingSpaces: 2
        },
        tags: ["playa", "vacacional", "lujo"],
        featured: true,
        automationReady: true,
        agentIds: ["agent-concierge", "agent-analyst"]
      },
      {
        id: "p2",
        slug: "loft-27",
        name: "LOFT 27",
        city: "CDMX",
        country: "MX",
        currency: "MXN",
        status: "published",
        listingType: "presale",
        stage: "Pre-lanzamiento",
        availabilityStatus: "available",
        images: [
          "https://images.unsplash.com/photo-1560448075-bb4caa6c9319?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format&fit=crop"
        ],
        description: "Lofts urbanos en corredor financiero. Entrega 2026.",
        developerId: "d1",
        createdAt: nowISO(),
        ticker: "SPS:LOF27",
        totalUnits: 80,
        attributes: ["Roof Garden", "Cowork", "Gimnasio", "Lobby"],
        specs: {
          "Entrega": "Q4 2026",
          "Régimen": "Condominal",
          "Superficie": "35–60 m²"
        },
        zone: {
          summary: "Corredor financiero con fuerte demanda de renta, servicios y movilidad.",
          golf: [],
          schools: ["Tec de Monterrey Campus Santa Fe (cercano)"],
          transport: ["Metrobus / Metro / Vías primarias"],
          retail: ["Antara", "Miyana", "Plaza Carso"]
        },
        propertyType: "Lofts urbanos",
        propertyPrice: 2700000,
        developmentStage: "Fase de planos",
        askingPrice: 2850000,
        propertyDetails: {
          bedrooms: 1,
          bathrooms: 1,
          surfaceArea: 48,
          parkingSpaces: 1
        },
        tags: ["ciudad", "inversión", "renta"],
        featured: true,
        automationReady: true,
        agentIds: ["agent-analyst"]
      },
      {
        id: "p3",
        slug: "villa-aurora",
        name: "Villa Aurora",
        city: "Mérida",
        country: "MX",
        currency: "USD",
        status: "published",
        listingType: "sale",
        stage: "Entrega inmediata",
        availabilityStatus: "available",
        images: [
          "https://images.unsplash.com/photo-1600585154340-0ef3c08dcdb6?q=80&w=1600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1616594039964-78c8f7cf5c4f?q=80&w=1600&auto=format&fit=crop"
        ],
        description: "Residencia contemporánea en privada con seguridad y amenidades resort.",
        developerId: "d1",
        createdAt: nowISO(),
        ticker: "SPS:AURRA",
        totalUnits: 12,
        attributes: ["Casa club", "Circuito de jogging", "Paneles solares", "Wellness spa"],
        specs: {
          "Entrega": "Disponible",
          "Superficie": "320 m²",
          "Régimen": "Propiedad privada"
        },
        zone: {
          summary: "Zona norte de Mérida con plusvalía creciente y oferta gastronómica.",
          golf: ["La Ceiba"],
          schools: ["Colegio Peninsular"],
          transport: ["Aeropuerto MID a 25 min", "Periférico cercano"],
          retail: ["The Harbor", "La Isla Mérida"]
        },
        propertyType: "Residencias premium",
        propertyPrice: 720000,
        askingPrice: 695000,
        developmentStage: "Llave en mano",
        propertyDetails: {
          bedrooms: 4,
          bathrooms: 4,
          halfBathrooms: 1,
          surfaceArea: 320,
          parkingSpaces: 3,
          floors: 2
        },
        tags: ["premium", "residencial", "merida"],
        featured: true,
        automationReady: true,
        agentIds: ["agent-concierge", "agent-broker"]
      }
    ];

    for (const project of defaultProjects) {
      await db.createProject(project);
    }

    // Rondas de ejemplo
    const defaultRounds: Round[] = [
      {
        id: "r1",
        projectId: "p1",
        goalType: "reservations",
        goalValue: 30,
        depositAmount: 500,
        slotsPerPerson: 3,
        deadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
        rule: "all_or_nothing",
        partialThreshold: 0.7,
        status: "open",
        createdAt: nowISO(),
        groupSlots: 30
      },
      {
        id: "r2",
        projectId: "p2",
        goalType: "amount",
        goalValue: 1000000,
        depositAmount: 25000,
        slotsPerPerson: 2,
        deadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
        rule: "partial",
        partialThreshold: 0.7,
        status: "open",
        createdAt: nowISO(),
        groupSlots: 40
      }
    ];

    for (const round of defaultRounds) {
      await db.createRound(round);
    }

    // Research de ejemplo
    const defaultResearch: ResearchItem[] = [
      {
        id: crypto.randomUUID(),
        projectId: "p1",
        type: "study",
        title: "Estudio de absorción Cancún 2024",
        source: "MarketLab",
        url: "#",
        publishedAt: "2024-11-01"
      },
      {
        id: crypto.randomUUID(),
        projectId: "p1",
        type: "news",
        title: "Nueva vialidad mejora accesos a zona hotelera",
        source: "Periódico Local",
        url: "#",
        publishedAt: "2025-01-15"
      },
      {
        id: crypto.randomUUID(),
        projectId: "p2",
        type: "report",
        title: "Reporte renta corta estancia CDMX Q3",
        source: "CityData",
        url: "#",
        publishedAt: "2024-09-10"
      }
    ];

    for (const item of defaultResearch) {
      await db.createResearchItem(item);
    }

    // Price History de ejemplo
    const defaultPriceHistory: Record<string, PricePoint[]> = {
      p1: [
        { ts: "2025-01-01", price: 480, volume: 5 },
        { ts: "2025-02-01", price: 500, volume: 7 },
        { ts: "2025-03-01", price: 520, volume: 8 },
        { ts: "2025-04-01", price: 515, volume: 4 },
        { ts: "2025-05-01", price: 540, volume: 6 }
      ],
      p2: [
        { ts: "2025-01-01", price: 22000, volume: 3 },
        { ts: "2025-02-01", price: 23000, volume: 4 },
        { ts: "2025-03-01", price: 23500, volume: 5 },
        { ts: "2025-04-01", price: 24000, volume: 5 },
        { ts: "2025-05-01", price: 24500, volume: 6 }
      ]
    };

    for (const [projectId, points] of Object.entries(defaultPriceHistory)) {
      for (const point of points) {
        await db.addPricePoint(projectId, point);
      }
    }

    // Agentes inteligentes
    const defaultAgents: IntelligentAgent[] = [
      {
        id: "agent-concierge",
        name: "Luna Concierge IA",
        persona: "concierge",
        status: "ready",
        playbook: "Atiende leads interesados en experiencias frente al mar y coordina visitas virtuales.",
        handoffEmail: "concierge@smartpresale.ai",
        languages: ["es", "en"],
        projectIds: ["p1", "p3"],
        createdAt: nowISO(),
        updatedAt: nowISO()
      },
      {
        id: "agent-analyst",
        name: "Atlas Analyst",
        persona: "operations",
        status: "ready",
        playbook: "Provee análisis financiero, seguimiento de KPIs y alertas sobre progreso de rondas.",
        handoffEmail: "ops@smartpresale.ai",
        languages: ["es"],
        projectIds: ["p1", "p2"],
        createdAt: nowISO(),
        updatedAt: nowISO()
      },
      {
        id: "agent-broker",
        name: "Rhea Broker",
        persona: "sales",
        status: "training",
        playbook: "Nutre leads de inventario listo para entrega y coordina negociaciones.",
        handoffEmail: "broker@smartpresale.ai",
        languages: ["es", "en"],
        projectIds: ["p3"],
        createdAt: nowISO(),
        updatedAt: nowISO()
      }
    ];

    if ((await db.getAgents()).length === 0) {
      for (const agent of defaultAgents) {
        await db.createAgent(agent);
      }
    }

    // Automatizaciones preconfiguradas
    const defaultAutomations: AutomationWorkflow[] = [
      {
        id: "auto-presale-progress",
        name: "Alerta progreso 75%",
        description: "Notifica al equipo cuando una preventa supera el 75% y activa comunicación de cierre.",
        status: "active",
        trigger: "milestone",
        channel: "slack",
        projectId: "p1",
        agentId: "agent-analyst",
        createdAt: nowISO(),
        updatedAt: nowISO(),
        metadata: { threshold: 0.75, channel: "#ventas-presale" }
      },
      {
        id: "auto-lead-nurture",
        name: "Secuencia nurturización LOFT 27",
        description: "Secuencia automática de 3 correos + WhatsApp para leads de preventa urbana.",
        status: "paused",
        trigger: "new_lead",
        channel: "email",
        projectId: "p2",
        agentId: "agent-analyst",
        createdAt: nowISO(),
        updatedAt: nowISO(),
        metadata: { cadence: "3-7-14", crmTag: "lead_frio" }
      },
      {
        id: "auto-tour-villa",
        name: "Coordinación de tours Villa Aurora",
        description: "Agenda automáticamente recorridos presenciales y envía dossier digital.",
        status: "active",
        trigger: "new_reservation",
        channel: "whatsapp",
        projectId: "p3",
        agentId: "agent-concierge",
        createdAt: nowISO(),
        updatedAt: nowISO(),
        metadata: { template: "tour_villa", handoff: "concierge@smartpresale.ai" }
      }
    ];

    if ((await db.getAutomations()).length === 0) {
      for (const workflow of defaultAutomations) {
        await db.createAutomation(workflow);
      }
    }

    // Comunidades
    const defaultCommunities: Community[] = [
      {
        id: "comm-global",
        slug: "comunidad-smart-presale",
        name: "Comunidad Global Smart Presale",
        description: "Espacio para inversionistas y desarrolladores con acceso a masterclasses, lanzamientos y playbooks.",
        scope: "global",
        coverImage: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop",
        tags: ["networking", "educación", "automatización"],
        memberCount: 428,
        featuredPosts: [
          {
            id: "post-masterclass",
            title: "Cómo lanzar campañas omnicanal en 14 días",
            excerpt: "Checklist accionable para automatizar nurturing desde la primera reserva.",
            author: "Equipo Smart Presale",
            publishedAt: nowISO()
          }
        ]
      },
      {
        id: "comm-p1",
        slug: "residencial-arrecife-preventa",
        name: "Residencial Arrecife · Comunidad Preventa",
        description: "Actualizaciones constructivas, comparables de mercado y coordinación de visitas para compradores.",
        scope: "campaign",
        projectId: "p1",
        roundId: "r1",
        coverImage: "https://images.unsplash.com/photo-1505843866550-141cc6f3d9d8?q=80&w=1600&auto=format&fit=crop",
        tags: ["frente al mar", "seguimiento obra"],
        memberCount: 96,
        featuredPosts: [
          {
            id: "post-amenidades",
            title: "Nuevo render del rooftop y amenidades",
            excerpt: "Tour guiado por Luna Concierge con highlights del spa y sky lounge.",
            author: "Luna Concierge IA",
            publishedAt: nowISO()
          }
        ]
      },
      {
        id: "comm-p3",
        slug: "villa-aurora-residentes",
        name: "Villa Aurora · Comunidad Propietarios",
        description: "Foro privado para residentes y prospectos con acceso a automatizaciones de mantenimiento y concierge.",
        scope: "campaign",
        projectId: "p3",
        memberCount: 54,
        coverImage: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop",
        tags: ["villa", "servicios", "concierge"],
        featuredPosts: [
          {
            id: "post-experience",
            title: "Experiencia de propietario: Sandra & Luis",
            excerpt: "Testimonio sobre automatización de smart-home y entregas programadas.",
            author: "Rhea Broker",
            publishedAt: nowISO()
          }
        ]
      }
    ];

    if ((await db.getCommunities()).length === 0) {
      for (const community of defaultCommunities) {
        await db.createCommunity(community);
      }
    }
  }
};

// Inicializar al importar
if (typeof window === 'undefined') {
  initializeDefaultData().catch(console.error);
}

// Exportar objetos para compatibilidad con código existente
export const DB = {
  get users() { return users; },
  get developers() { return developers; },
  get documents() { return documents; },
  get projects() { return db.getProjects(); },
  get rounds() { return db.getRounds(); },
  get reservations() { return db.getReservations(); },
  get transactions() { return db.getTransactions(); },
  get research() { return db.getResearch(); },
  get priceHistory() { return db.getPriceHistory(); },
  get listings() { return db.getListings(); },
  get trades() { return db.getTrades(); },
  get communities() { return db.getCommunities(); },
  get automations() { return db.getAutomations(); },
  get agents() { return db.getAgents(); }
};

// Funciones helper que usan el servicio db (mantienen compatibilidad)
export const findProjectBySlug = async (slug: string) => {
  return db.getProjectBySlug(slug);
};

export const findProjectById = async (id: string) => {
  return db.getProjectById(id);
};

export const findRoundByProject = async (projectId: string) => {
  return db.getRoundByProjectId(projectId);
};

export const listPublishedProjects = async (filter?: { listingType?: ListingType }) => {
  const projects = await db.getProjects();
  return projects.filter(p => {
    if (p.status !== "published") return false;
    if (filter?.listingType && p.listingType !== filter.listingType) return false;
    return true;
  });
};

export const byRoundReservations = async (roundId: string) => {
  return db.getReservationsByRoundId(roundId);
};

export const byUserReservations = async (userId: string) => {
  return db.getReservationsByUserId(userId);
};

export const listCommunities = async () => {
  return db.getCommunities();
};

export const listCommunitiesByProject = async (projectId: string) => {
  return db.getCommunitiesByProjectId(projectId);
};

export const findCommunityBySlug = async (slug: string) => {
  return db.getCommunityBySlug(slug);
};

export const listAutomations = async () => {
  return db.getAutomations();
};

export const listAgents = async () => {
  return db.getAgents();
};
