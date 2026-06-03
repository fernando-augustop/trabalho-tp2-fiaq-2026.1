import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida. Verifique o .env.')
}

// SSL: o postgres.js detecta o modo de SSL pela própria connection string.
//   - Postgres local (Docker): sem parâmetros extras
//     DATABASE_URL=postgresql://fiaq:fiaq123@localhost:5432/fiaq
//   - Bancos gerenciados (Neon, Supabase, Vercel Postgres): adicione ?sslmode=require
//     DATABASE_URL=postgresql://usuario:senha@host:5432/fiaq?sslmode=require
//
// max: 1 é o padrão recomendado para Vercel Functions (serverless):
// cada instância da função mantém no máximo 1 conexão aberta,
// que é encerrada após idle_timeout segundos de inatividade.
const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

export default sql
