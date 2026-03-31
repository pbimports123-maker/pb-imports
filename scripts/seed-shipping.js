const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://udrlwuywjejcwjjaiofc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcmx3dXl3amVqY3dqamFpb2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODgyMzAsImV4cCI6MjA5MDQ2NDIzMH0.V_ewmKsbCwznY-JFgmOEuu8TXa9ac0dESgZhgfPSGEw';

const rows = [
  // SEDEX
  { service_type: 'SEDEX', region: 'SP', price: 40 },
  { service_type: 'SEDEX', region: 'DF, PR', price: 60 },
  { service_type: 'SEDEX', region: 'ES, GO, MG, RJ, RS, SC', price: 70 },
  { service_type: 'SEDEX', region: 'MS', price: 85 },
  { service_type: 'SEDEX', region: 'BA, MT', price: 90 },
  { service_type: 'SEDEX', region: 'CE, PA, TO', price: 105 },
  { service_type: 'SEDEX', region: 'AC, RO', price: 110 },
  { service_type: 'SEDEX', region: 'PE', price: 115 },
  { service_type: 'SEDEX', region: 'AL, AM, AP, MA', price: 125 },
  { service_type: 'SEDEX', region: 'PB, PI, RN, SE', price: 125 },

  // Transportadoras
  { service_type: 'Transportadoras', region: 'SP', price: 48 },
  { service_type: 'Transportadoras', region: 'RJ, ES, MG, PR, SC', price: 70 },
  { service_type: 'Transportadoras', region: 'DF', price: 72 },
  { service_type: 'Transportadoras', region: 'MT', price: 75 },
  { service_type: 'Transportadoras', region: 'GO', price: 76 },
  { service_type: 'Transportadoras', region: 'BA, CE, MS', price: 80 },
  { service_type: 'Transportadoras', region: 'MA', price: 90 },
  { service_type: 'Transportadoras', region: 'PB, RN, RS', price: 100 },
  { service_type: 'Transportadoras', region: 'PA, PI, TO', price: 110 },
  { service_type: 'Transportadoras', region: 'AL, PE, SE', price: 120 },
  { service_type: 'Transportadoras', region: 'AP, AM, RR', price: 120 },
  { service_type: 'Transportadoras', region: 'RO', price: 170 },

  // Fretes VIP (entrega especial)
  { service_type: 'Fretes VIP', region: 'São Paulo (capital)', price: 150 },
  { service_type: 'Fretes VIP', region: 'Alphaville / Barueri', price: 160 },
  { service_type: 'Fretes VIP', region: 'Carapicuíba', price: 160 },
  { service_type: 'Fretes VIP', region: 'Guarulhos', price: 170 },
  { service_type: 'Fretes VIP', region: 'Campinas', price: 170 },
  { service_type: 'Fretes VIP', region: 'São Bernardo do Campo', price: 170 },
  { service_type: 'Fretes VIP', region: 'Mauá', price: 170 },
  { service_type: 'Fretes VIP', region: 'Jundiaí', price: 190 },
  { service_type: 'Fretes VIP', region: 'Indaiatuba', price: 190 },
  { service_type: 'Fretes VIP', region: 'Santos', price: 240 },
  { service_type: 'Fretes VIP', region: 'Praia Grande', price: 290 },
];

(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Clean existing data for these service types to avoid duplicates
  const serviceTypes = Array.from(new Set(rows.map(r => r.service_type)));
  const { error: delError } = await supabase.from('shipping_rates').delete().in('service_type', serviceTypes);
  if (delError) {
    console.error('Erro ao limpar dados existentes:', delError.message);
    process.exit(1);
  }

  const payload = rows.map(r => ({ ...r, is_active: true }));
  const { error: insertError } = await supabase.from('shipping_rates').insert(payload);
  if (insertError) {
    console.error('Erro ao inserir fretes:', insertError.message);
    process.exit(1);
  }

  console.log(`Inseridos ${payload.length} registros em shipping_rates.`);
})();
