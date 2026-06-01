# Mapeamento do FAQ do CIC/UnB

- URL mapeada: https://www.cic.unb.br/informacoes/faq#cursos-do-cic
- Título da página: Departamento de Ciências da Computação - CIC - FAQ
- Cabeçalho principal: Perguntas Frequentes (Graduação)
- Extraído em: 2026-04-13 08:48:09
- Painéis/accordions encontrados: 90
- Seções de topo: 7
- Links no conteúdo principal: 201

## Como foi verificado

1. A página foi aberta com Browser Use CLI.
2. O estado inicial identificou os painéis `slider-*` do FAQ.
3. Todos os corpos de accordion foram forçados a ficar visíveis no browser para conferência visual.
4. As evidências full-page foram salvas em `evidencias/`.
5. O conteúdo foi extraído do HTML do FAQ, preservando a hierarquia dos painéis e os links.

## Arquivos principais

- `00-indice.md`: árvore dos painéis e caminhos dos arquivos por seção.
- `01-faq-completo.md`: conteúdo completo em um único Markdown.
- `02-links.md`: inventário de links encontrados no conteúdo principal.
- `03-tabela-de-paineis.md`: tabela compacta dos 90 painéis.
- `secoes/`: um arquivo Markdown por seção de topo, com suas subseções.
- `evidencias/`: screenshots full-page capturados com Browser Use.

## Escopo

O mapeamento cobre a página de FAQ de graduação do CIC/UnB e todos os painéis de accordion contidos nela. Links externos e páginas apontadas foram inventariados, mas não foram recrawleados como novos sites.
