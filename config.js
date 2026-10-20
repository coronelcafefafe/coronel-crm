// Coronel CRM · ligação ao Supabase (projeto "Coronel Cafe")
// A chave abaixo é pública por natureza: as regras da base de dados só deixam entrar quem está na equipa.
window.CRM_CONFIG = {
  url: "https://wajuoxdtjywjdndgatxp.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhanVveGR0anl3amRuZGdhdHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NDkzOTIsImV4cCI6MjEwODAyNTM5Mn0.pnnPFzMx08PTzd0m86q-rP2GUy3xAhQ7FIY64uVZJUs",
  // Claude em pausa para não haver custos. Para ligar: criar a chave da API, guardá-la no Supabase
  // (Edge Functions → Secrets → ANTHROPIC_API_KEY) e mudar esta linha para true.
  claude: false
};
