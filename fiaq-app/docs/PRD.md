# PRD — UnB Acessível

**Produto:** UnB Acessível — Hub de Acessibilidade da UnB
**Disciplina:** Técnicas de Programação 2 — 2026.1
**Equipe:** 11 alunos
**Data:** 07 de abril de 2026
**Versão:** 1.0

---

## 1. Visão Geral

### 1.1 Problema

A Universidade de Brasília oferece diversos recursos de apoio aos estudantes — desde guias sobre como agir em casos de assédio até procedimentos para solicitar benefícios socioeconômicos, orientações de fórum inicial e informações sobre saúde mental. Porém, esse conteúdo está fragmentado entre diferentes sites institucionais, PDFs dispersos, redes sociais e setores administrativos. O estudante que precisa de ajuda muitas vezes não sabe onde procurar ou desiste diante da burocracia.

### 1.2 Solução

O **UnB Acessível** é um hub web centralizado que reúne todas essas informações em um único lugar, com interface moderna, busca inteligente e um chatbot de IA treinado especificamente no conteúdo da universidade. Não é um portal de notícias — é um **FAQ moderno e interativo** que responde às dúvidas dos estudantes de forma direta e acessível.

### 1.3 Objetivos

1. Centralizar informações institucionais de apoio ao estudante em um único portal
2. Permitir que estudantes encontrem respostas rapidamente via busca ou chatbot
3. Reduzir a barreira de acesso a informações sobre direitos e benefícios
4. Garantir acessibilidade (WCAG 2.1 AA) para todos os usuários
5. Manter o conteúdo atualizável sem necessidade de deploys

---

## 2. Público-Alvo

### 2.1 Usuários Primários

- **Estudantes de graduação e pós-graduação da UnB** — especialmente calouros e alunos em situação de vulnerabilidade socioeconômica
- **Estudantes que sofreram ou presenciaram assédio** — buscando orientação sobre como proceder
- **Estudantes com dúvidas burocráticas** — matrícula, trancamento, aproveitamento de créditos, etc.

### 2.2 Usuários Secundários

- **Servidores e docentes** — para direcionar alunos ao recurso correto
- **Administradores de conteúdo** — equipe responsável por manter as informações atualizadas

---

## 3. Funcionalidades

### 3.1 MVP (Escopo do Trabalho)

#### F1 — FAQ Categorizado

- Página inicial com categorias temáticas (cards ou grid)
- Categorias planejadas:
  - Assédio e Violência
  - Benefícios e Auxílios Socioeconômicos
  - Saúde Mental e Apoio Psicológico
  - Matrícula e Vida Acadêmica
  - Fórum Inicial e Recepção de Calouros
  - Acessibilidade e Inclusão (PCD)
  - Moradia e Restaurante Universitário
  - Estágio e Oportunidades
- Cada categoria contém perguntas e respostas expansíveis (accordion)
- Conteúdo armazenado em arquivos estruturados (JSON/MDX) para facilitar edição

#### F2 — Chatbot com IA Local

- Widget de chat flutuante acessível em todas as páginas
- Modelo de linguagem fine-tuned rodando localmente via Ollama
- Treinado com o conteúdo do FAQ e documentos institucionais da UnB
- Respostas em português brasileiro, linguagem simples e direta
- Indicação de fontes/links quando aplicável
- Fallback para "não sei responder, entre em contato com [setor]"

#### F3 — Busca Inteligente

- Campo de busca no topo da página
- Busca full-text no conteúdo do FAQ
- Sugestões de perguntas enquanto o usuário digita (autocomplete)
- Ranking de relevância nos resultados

#### F4 — Guias Passo a Passo

- Páginas dedicadas para processos burocráticos comuns
- Formato de tutorial com etapas numeradas
- Capturas de tela dos sistemas da UnB quando aplicável
- Links diretos para os formulários e sistemas necessários

#### F5 — Design Responsivo e Acessível

- Mobile-first
- Conformidade com WCAG 2.1 nível AA
- Suporte a navegação por teclado
- Compatibilidade com leitores de tela
- Contraste adequado e tamanhos de fonte ajustáveis
- Modo escuro

### 3.2 Futuro (Pós-Disciplina)

- Painel administrativo para CRUD de conteúdo
- Autenticação via SSO da UnB
- Sistema de feedback por pergunta ("essa resposta ajudou?")
- Analytics de perguntas mais acessadas
- Notificações sobre prazos importantes (matrícula, auxílios)
- Versão PWA para acesso offline

---

## 4. Arquitetura Técnica

> **Nota:** A stack e arquitetura descritas abaixo são uma sugestão inicial. A equipe pode optar por outras tecnologias conforme preferência e experiência do grupo.

### 4.1 Frontend

```
React + TypeScript + Vite
├── Estilização: Tailwind CSS + shadcn/ui
├── Roteamento: React Router
├── Estado: React Context / Zustand (se necessário)
└── Conteúdo: Arquivos MDX ou JSON estáticos
```

### 4.2 Backend / API

```
Bun (servidor)
├── API REST para o chatbot
├── Endpoint de busca
└── Proxy para o modelo Ollama
```

### 4.3 IA / Chatbot

```
Ollama (servidor local na VPS)
├── Modelo base: Llama 3 ou Mistral (a definir)
├── Fine-tuning com dados institucionais da UnB
├── RAG (Retrieval-Augmented Generation) com embeddings do FAQ
└── Contexto limitado ao domínio da UnB
```

### 4.4 Infraestrutura

```
VPS omarchy
├── Aplicação servida via Bun/Caddy
├── Ollama rodando o modelo de IA
├── Deploy via Git (push to deploy) ou CI simples
└── HTTPS via Caddy/Let's Encrypt
```

### 4.5 Diagrama Simplificado

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────>│  Bun Server  │────>│   Ollama     │
│  (React SPA) │<────│  (API REST)  │<────│  (LLM Local) │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │  Conteúdo   │
                     │  (JSON/MDX) │
                     └─────────────┘
```

---

## 5. Conteúdo Inicial

### 5.1 Fontes de Dados

O conteúdo será compilado a partir de:

- Site institucional da UnB (unb.br)
- Decanato de Assuntos Comunitários (DAC)
- Decanato de Ensino de Graduação (DEG)
- Ouvidoria da UnB
- Centro de Atendimento e Estudos Psicológicos (CAEP)
- Diretoria de Diversidade (DIV)
- Secretaria de Administração Acadêmica (SAA)
- Guias e cartilhas já publicados pela universidade

### 5.2 Formato do Conteúdo

Cada entrada do FAQ será um arquivo estruturado:

```json
{
  "id": "assedio-001",
  "categoria": "assedio-e-violencia",
  "pergunta": "Sofri assédio na universidade. O que devo fazer?",
  "resposta": "Você pode procurar a Ouvidoria da UnB...",
  "links": [
    { "texto": "Ouvidoria da UnB", "url": "https://ouvidoria.unb.br" }
  ],
  "tags": ["assédio", "denúncia", "ouvidoria"],
  "atualizado_em": "2026-04-07"
}
```

---

## 6. Requisitos Não-Funcionais

| Requisito | Meta |
|---|---|
| Tempo de carregamento | < 2s (First Contentful Paint) |
| Tempo de resposta do chatbot | < 5s |
| Disponibilidade | 99% (VPS dedicada) |
| Acessibilidade | WCAG 2.1 AA |
| Compatibilidade | Chrome, Firefox, Safari, Edge (últimas 2 versões) |
| Mobile | Responsivo, touch-friendly |
| SEO | Meta tags, sitemap, conteúdo indexável |

---

## 7. Organização da Equipe

### 7.1 Divisão por Squads

Com 11 alunos, a sugestão de divisão é:

| Squad | Responsabilidade | Tamanho |
|---|---|---|
| **Frontend Core** | Layout, componentes, roteamento, responsividade | 3 alunos |
| **FAQ e Conteúdo** | Estrutura do FAQ, busca, guias, curadoria de conteúdo | 3 alunos |
| **Chatbot e IA** | Integração Ollama, RAG, fine-tuning, API do chat | 3 alunos |
| **Infra e DevOps** | Deploy, VPS, CI/CD, domínio, HTTPS | 2 alunos |

### 7.2 Workflow de Desenvolvimento

- Branch principal: `main` (protegida)
- Feature branches: `feat/<nome-da-feature>`
- Pull Requests obrigatórios com pelo menos 1 review
- Commits em português, formato: `tipo: descrição` (ex: `feat: adiciona página de FAQ`)

---

## 8. Cronograma Estimado

| Fase | Entregas |
|---|---|
| **Fase 1 — Setup** | Repo, stack configurada, deploy básico, estrutura de pastas |
| **Fase 2 — Core** | FAQ categorizado, layout principal, busca básica |
| **Fase 3 — IA** | Chatbot funcional, RAG com conteúdo do FAQ |
| **Fase 4 — Conteúdo** | Curadoria completa, guias passo a passo |
| **Fase 5 — Polish** | Acessibilidade, testes, performance, documentação |
| **Entrega Final** | Apresentação, demo ao vivo, documentação completa |

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Modelo de IA muito pesado para a VPS | Chatbot lento ou inviável | Usar modelo menor (Phi-3, TinyLlama) ou RAG sem fine-tuning |
| Conteúdo institucional desatualizado | Respostas incorretas | Incluir data de atualização e links para fonte oficial |
| Escopo muito grande para o semestre | Entrega incompleta | Priorizar MVP (FAQ + busca) e chatbot como bônus |
| Problemas de acessibilidade | Exclusão de usuários | Testes com lighthouse e axe-core desde o início |

---

## 10. Métricas de Sucesso

- FAQ com pelo menos 50 perguntas e respostas validadas
- Chatbot respondendo corretamente > 80% das perguntas de teste
- Score de acessibilidade > 90 no Lighthouse
- Tempo de carregamento < 2s
- Deploy funcional e acessível via URL pública

---

## 11. Referências

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [shadcn/ui](https://ui.shadcn.com)
- [Ollama](https://ollama.ai)
- [Vite](https://vitejs.dev)
- [Bun](https://bun.sh)
- [UnB — Universidade de Brasília](https://unb.br)
