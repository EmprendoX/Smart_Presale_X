import { DatabaseService } from './services/db';
import { JsonDbService } from './services/json-db-service';
import { SupabaseService } from './services/supabase-service';
import { createPaymentService } from './services/payment';

// Configuración: usar Supabase o JSON
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

// Instanciar el servicio según la configuración
let dbService: DatabaseService;

if (USE_SUPABASE) {
  dbService = new SupabaseService();
} else {
  dbService = new JsonDbService();
}

export const db = dbService;
export const payments = createPaymentService(dbService);
export { USE_SUPABASE };


