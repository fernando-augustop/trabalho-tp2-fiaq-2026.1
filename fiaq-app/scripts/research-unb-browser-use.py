"""Pesquisa inicial de fontes oficiais da UnB com browser-use.

Este script e opcional: ele gera sugestoes em
data/sources/unb-official/browser-use-findings.json. O crawler deterministico
continua sendo responsavel por validar, pontuar e materializar paginas para o
RAG.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "sources" / "unb-official" / "browser-use-findings.json"


def load_env() -> None:
    for name in (".env", ".env.local"):
        path = ROOT / name
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def make_llm():
    from browser_use import ChatBrowserUse, ChatGoogle, ChatOpenAI

    if os.getenv("BROWSER_USE_API_KEY"):
        return ChatBrowserUse()

    if os.getenv("OPENAI_API_KEY"):
        return ChatOpenAI(model=os.getenv("BROWSER_USE_OPENAI_MODEL", "gpt-4.1-mini"))

    if os.getenv("GOOGLE_API_KEY"):
        return ChatGoogle(model=os.getenv("BROWSER_USE_GOOGLE_MODEL", "gemini-flash-latest"))

    if os.getenv("OPENROUTER_API_KEY"):
        return ChatOpenAI(
            model=os.getenv("BROWSER_USE_OPENROUTER_MODEL", os.getenv("OPENROUTER_CHAT_MODEL", "openai/gpt-4.1-mini")),
            api_key=os.environ["OPENROUTER_API_KEY"],
            base_url="https://openrouter.ai/api/v1",
        )

    raise RuntimeError(
        "Defina BROWSER_USE_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY ou OPENROUTER_API_KEY para rodar browser-use."
    )


async def main() -> None:
    load_env()

    try:
        from browser_use import Agent, BrowserProfile
        from pydantic import BaseModel, Field
    except ModuleNotFoundError:
        print(
            "browser-use nao esta instalado. Instale com: uv pip install browser-use && uvx browser-use install",
            file=sys.stderr,
        )
        raise SystemExit(2)

    class FonteUnB(BaseModel):
        titulo: str = Field(description="Titulo curto da fonte")
        url: str = Field(description="URL oficial em dominio *.unb.br")
        categoria: str = Field(description="Area da UnB ou tema estudantil")
        motivo: str = Field(description="Por que essa fonte melhora o RAG")

    class ResultadoPesquisa(BaseModel):
        sources: list[FonteUnB] = Field(description="Fontes oficiais recomendadas")
        notes: str = Field(default="", description="Observacoes de cobertura ou riscos")

    llm = make_llm()
    profile = BrowserProfile(
        headless=True,
        allowed_domains=["*.unb.br", "unb.br"],
        minimum_wait_page_load_time=0.5,
        wait_between_actions=0.2,
    )

    task = """
    Acesse https://www.unb.br/ e pesquise fontes oficiais da Universidade de Brasilia
    que seriam uteis para um chatbot RAG sobre a UnB, especialmente para estudantes.

    Regras:
    - Use apenas dominios oficiais unb.br ou subdominios *.unb.br.
    - Priorize paginas permanentes, FAQs, servicos, calendarios, assistencia estudantil,
      graduacao, biblioteca, acessibilidade, saude, tecnologia, pesquisa, extensao e ouvidoria.
    - Evite noticias pontuais, redes sociais, paginas de login, arquivos soltos e conteudo duplicado.
    - Retorne de 20 a 40 fontes com titulo, URL, categoria e motivo.
    """

    agent = Agent(
        task=task,
        llm=llm,
        browser_profile=profile,
        output_model_schema=ResultadoPesquisa,
        max_failures=3,
    )

    history = await agent.run(max_steps=35)
    result = history.structured_output
    if result is None:
        payload = {"sources": [], "notes": history.final_result() or ""}
    else:
        payload = result.model_dump()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Pesquisa browser-use salva em {OUTPUT}")


if __name__ == "__main__":
    asyncio.run(main())
