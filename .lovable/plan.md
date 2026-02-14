

# Sistema de Gestão Financeira 💰

Um sistema completo de gestão financeira pessoal com interface moderna estilo fintech, totalmente em português (PT-BR), usando dados locais no navegador (localStorage).

---

## 1. Navegação Adaptável
- **Mobile**: Bottom Navigation fixa com 4 itens — Início, Transações, Relatórios, Ajustes — com ícones e labels, destaque no item ativo
- **Desktop**: Sidebar lateral fixa à esquerda com os mesmos 4 itens, conteúdo principal à direita em layout otimizado

## 2. Página Início (Dashboard)
- **Card de Saldo**: saldo atual com mês vigente em destaque
- **Resumo**: cards de Receitas (verde) e Despesas (vermelho)
- **Meta Mensal integrada**: card com valor da meta, total gasto, percentual e barra de progresso com cores dinâmicas (verde/amarelo/vermelho). Botão "Editar Meta"
- **Gráficos**: Pizza (despesas por categoria), Linha (evolução mensal), Comparativo (receita x despesa) — lado a lado no desktop, empilhados no mobile
- **Últimas Transações**: lista compacta das transações recentes

## 3. Página Transações
- **Duas abas internas**: "Transações" e "Categorias"
- **Aba Transações**: lista de transações com botão flutuante (+) no mobile e botão superior no desktop para adicionar via modal
- **Aba Categorias**: CRUD de categorias (criar, editar, excluir) com ícone e cor
- Formulários de criação/edição em modais/dialogs

## 4. Página Relatórios (Avançada)
- **Filtro de período**: segmented control com "Esse Mês", "Mês Passado", "Últimos 3 Meses"
- **Indicadores inteligentes**: Total Receitas, Total Despesas, Saldo, % economia, crescimento comparado ao período anterior com setas e cores
- **Gráfico Pizza interativo**: despesas por categoria com hover tooltip, clique filtra lista abaixo, legenda clicável
- **Gráfico Linha interativo**: receitas, despesas e saldo acumulado com toggle de linhas e tooltip
- **Gráfico Comparativo**: barras agrupadas receita x despesa com indicador de lucro/prejuízo
- **Lista dinâmica de transações**: filtra por período e por clique no gráfico pizza, com botão "Limpar Filtro"
- Layout responsivo: empilhado no mobile, lado a lado no desktop

## 5. Página Ajustes
- Editar perfil (nome e email local)
- Tema claro/escuro com toggle
- Exportar dados para Excel (.xlsx) com duas planilhas (Transações e Resumo)
- Botão Logout (limpa dados da sessão)

## 6. Exportação Excel
- Gera arquivo .xlsx usando a biblioteca SheetJS
- Planilha 1: Transações (data, tipo, categoria, descrição, valor)
- Planilha 2: Resumo (totais, saldo, % meta, taxa economia)
- Toast de confirmação ao exportar

## 7. Design & UX
- Estilo fintech moderno com Tailwind CSS
- Mobile first, totalmente responsivo
- Cards arredondados com sombras suaves
- Cores: verde (receita), vermelho (despesa), azul (info), amarelo (atenção)
- Transições e animações suaves
- Tratamento de estados vazios com mensagens e ilustrações
- Dados mock pré-populados para demonstração

## 8. Gerenciamento de Estado
- Context API para estado global (transações, categorias, metas, filtros, tema)
- Persistência em localStorage
- Atualizações dinâmicas sem reload

