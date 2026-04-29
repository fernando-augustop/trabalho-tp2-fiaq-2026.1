# UnB Acessível

Hub de acessibilidade da Universidade de Brasília — um portal centralizado com FAQ inteligente e chatbot de IA para ajudar estudantes a encontrar informações sobre direitos, benefícios, apoio contra assédio e orientações institucionais.

## Sobre o Projeto

A UnB disponibiliza diversas informações relevantes para seus estudantes — guias sobre assédio, benefícios socioeconômicos, orientações de fórum inicial e muito mais — mas essas informações estão espalhadas por diferentes sites, PDFs e setores. O **UnB Acessível** centraliza tudo isso em uma interface moderna e acessível, com um chatbot de IA treinado especificamente no conteúdo institucional da universidade.

Este projeto é desenvolvido como trabalho da disciplina de **Técnicas de Programação 2** do semestre 2026.1.

## Funcionalidades

- **FAQ Categorizado** — Perguntas frequentes organizadas por tema (assédio, benefícios, matrícula, saúde mental, etc.)
- **Chatbot com IA Local** — Modelo fine-tuned rodando no servidor para responder dúvidas em linguagem natural
- **Busca Inteligente** — Pesquisa por palavras-chave com ranking de relevância
- **Guias Passo a Passo** — Tutoriais visuais para processos burocráticos (como solicitar auxílio, como denunciar assédio)
- **Responsivo e Acessível** — Interface adaptada para mobile e compatível com leitores de tela (WCAG 2.1 AA)
- **Painel Administrativo** — Para a equipe manter o conteúdo atualizado sem precisar de deploy

## Stack Tecnológica (Sugestão Inicial)

> **Nota:** A stack abaixo é apenas uma sugestão inicial e pode ser alterada conforme decisão da equipe durante o desenvolvimento.

| Camada | Tecnologia |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Framework | [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build | [Vite](https://vitejs.dev) |
| Estilização | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| IA / Chatbot | Modelo local fine-tuned (Ollama) |
| Servidor | VPS `omarchy` |

## Estrutura do Projeto

```
unb-acessivel/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários e configurações
│   ├── services/       # Integração com API e chatbot
│   ├── data/           # Conteúdo do FAQ e guias
│   └── types/          # Tipos TypeScript
├── server/
│   ├── api/            # Endpoints da API
│   └── ai/             # Integração com modelo local
├── public/             # Assets estáticos
├── docs/               # Documentação do projeto
│   └── PRD.md          # Product Requirements Document
└── README.md
```

## Requisitos

- [Bun](https://bun.sh) >= 1.0
- [Node.js](https://nodejs.org) >= 20 (compatibilidade)
- [Ollama](https://ollama.ai) (para o modelo de IA local)

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/fernando-augustop/trabalho-tp2-acessibilidade-unb-2026.1.git
cd trabalho-tp2-acessibilidade-unb-2026.1

# Instalar dependências
bun install

# Rodar em desenvolvimento
bun dev
```

## Equipe

Projeto desenvolvido por 11 alunos da disciplina de Técnicas de Programação 2 — UnB 2026.1.

| Aluno | GitHub |
|---|---|
| Fernando Augusto | [@fernando-augustop](https://github.com/fernando-augustop) |
| Gustavo Nascimento | [@PavanelliGustavo](https://github.com/PavanelliGustavo) |
| Eduardo Rocha | [@eduardofgc](https://github.com/eduardofgc) |
| Lucas Pereira | [@lucsap](https://github.com/lucsap) |
| Samara Gomes | [@samaragomess](https://github.com/samaragomess) |
| Augusto faller| [@tosgual](https://github.com/tosgual)|
| Lucas Centurion Netto | [@LucasCenturionNetto](https://github.com/LucasCenturionNetto) |
| Ricardo Rian | [@RianRSM](https://github.com/RianRSM) |
| _A preencher_ | |
| _A preencher_ | |
| _A preencher_ | |

## Licença

Este projeto é de uso acadêmico, desenvolvido para a Universidade de Brasília.
