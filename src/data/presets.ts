import { ContextPreset, UserStory } from "../types";

export const SAMPLE_PRESETS: ContextPreset[] = [
  {
    id: "preset-pix",
    title: "Alerta de Limite Pix Excedido",
    category: "Bancos / Fintech",
    projectName: "App Banking Mobile",
    epicName: "Gestão de Transferências e Limites",
    contextText: `Problema atual: Quando o cliente tenta realizar uma transferência Pix que ultrapassa seu limite diário estabelecido, o aplicativo exibe um erro genérico "Serviço indisponível no momento. Tente novamente mais tarde." (Erro 500 silencioso). Isso gera indignação, pânico e sobrecarrega a central de atendimento com chamados sobre indisponibilidade do sistema.

Objetivo de Negócio: Tratar graciosamente a validação de limite transacional conforme Resolução BCB nº 142/2021. Exibir uma tela clara informando que o limite diário foi atingido, mostrando o saldo de limite disponível para o dia e oferecendo um botão direto para "Solicitar Aumento de Limite" com justificativa opcional.

Regras conhecidas:
- O limite noturno (20h às 06h) é reduzido por padrão para R$ 1.000,00.
- A solicitação de aumento de limite deve levar até 24h para ser aprovada por segurança do BCB.
- O histórico de tentativas excedidas deve registrar um log no sistema de prevenção a fraudes.`,
  },
  {
    id: "preset-senha",
    title: "Redefinição de Senha por WhatsApp/SMS",
    category: "Autenticação & Segurança",
    projectName: "Portal do Cliente SaaS",
    epicName: "Jornada de Acesso e Identidade",
    contextText: `A taxa de abandono na redefinição de senha via e-mail é de 38% porque muitos e-mails corporativos bloqueiam remetentes desconhecidos ou caem no filtro de spam. 

Queremos implementar a redefinição de senha via código OTP de 6 dígitos enviado por SMS ou WhatsApp para o telefone cadastrado.

Regras de negócio:
- O código expira estritamente em 5 minutos.
- Máximo de 3 tentativas incorretas bloqueiam o reenvio por 15 minutos.
- O usuário deve confirmar os últimos 4 dígitos do telefone cadastrado antes do disparo.
- Após alterar a senha, todas as sessões ativas do usuário em outros dispositivos devem ser encerradas.`,
  },
  {
    id: "preset-pdf",
    title: "Exportação de Relatório Financeiro PDF/Excel",
    category: "Enterprise / Backoffice",
    projectName: "ERP Financeiro Integrado",
    epicName: "Módulo de Fechamento Contábil",
    contextText: `Os analistas contábeis gastam cerca de 4 horas por semana copiando dados da tabela de vendas da tela para planilhas manuais para consolidar tributos e comissões do mês.

Necessidade: Criar funcionalidade de exportação do relatório financeiro consolidado em formatos XLSX (Excel) e PDF formatado com cabeçalho da empresa.

Fluxo e Regras:
- O usuário seleciona o período (mês/ano) e os filtros de filial.
- A exportação em Excel deve incluir fórmulas de somatório nas colunas de valor líquido, imposto e comissão.
- A exportação em PDF deve possuir layout para impressão A4 em formato paisagem com paginação (ex: "Página 1 de 5").
- Usuários com perfil "Consultor" só podem exportar dados de sua própria filial.`,
  },
  {
    id: "preset-tracking",
    title: "Rastreamento do Pedido em Tempo Real",
    category: "E-Commerce & Logística",
    projectName: "Plataforma E-commerce",
    epicName: "Pós-Venda e Logística de Entrega",
    contextText: `Cerca de 45% das interações no suporte via chat (SAC) são clientes perguntando "Onde está meu pedido?".

Objetivo: Integrar webhook de rastreamento com a transportadora para atualizar o status do pedido na área "Meus Pedidos" do cliente e enviar e-mail/Push a cada etapa chave (Separado, Em Trânsito, Saiu para Entrega, Entregue).

Detalhes:
- Exibir mapa interativo simples com a última localização registrada do pacote.
- Se houver insucesso na entrega (ex: destinatário ausente), exibir alerta destacado em amarelo com orientação de próxima tentativa.`,
  },
];

export const INITIAL_SAMPLE_STORY: UserStory = {
  id: "story-pix-001",
  title: "Notificação e Solicitação de Limite Pix Excedido",
  story: {
    role: "Cliente do banco no aplicativo mobile",
    want: "visualizar uma mensagem clara ao tentar realizar um Pix acima do meu limite diário e poder solicitar o aumento de limite diretamente na tela",
    soThat: "eu compreenda exatamente o motivo do impedimento da transação e consiga pedir mais limite sem precisar acionar o suporte telefônico",
  },
  context: "Atualmente, ao ultrapassar o limite Pix, o aplicativo apresenta uma falha genérica de 'Serviço indisponível', sobrecarregando o SAC. A alteração visa adequar o app à Resolução BCB nº 142/2021, informando o saldo restante do limite e oferecendo fluxo direto para solicitação de aumento com prazo claro de análise.",
  acceptanceCriteria: [
    {
      id: "AC01",
      text: "Ao tentar confirmar uma transferência Pix superior ao limite disponível no período (diurno ou noturno), o sistema deverá bloquear a transação antes da digitação da senha e exibir tela de limite excedido conforme RN01 e RN02.",
    },
    {
      id: "AC02",
      text: "A tela de aviso deverá exibir expressamente o valor que tentou ser transferido, o limite diário total configurado e o saldo de limite ainda disponível para o dia.",
    },
    {
      id: "AC03",
      text: "A tela de aviso deverá disponibilizar o botão 'Solicitar Aumento de Limite', direcionando o usuário para o formulário de ajuste conforme RN03.",
    },
    {
      id: "AC04",
      text: "O sistema deverá registrar um log de tentativa de transação excedida no serviço de monitoramento de risco conforme RN04.",
    },
  ],
  businessRules: [
    {
      id: "RN01",
      text: "O limite transacional Noturno (20h às 06h) possui teto padrão de R$ 1.000,00, salvo se o cliente já tiver personalizado um valor inferior.",
    },
    {
      id: "RN02",
      text: "O saldo de limite diário disponível é recalculado instantaneamente a cada transação Pix concluída no mesmo dia civil.",
    },
    {
      id: "RN03",
      text: "Solicitações de aumento de limite Pix devem exibir aviso informativo de prazo de homologação de até 24 horas, em conformidade com as regras do Banco Central.",
    },
    {
      id: "RN04",
      text: "Logs de limite excedido devem conter ID do cliente, valor tentado, horário e dispositivo para análise do motor antifraude.",
    },
  ],
  bddScenarios: [
    {
      title: "Tentativa de Pix acima do limite diurno disponível",
      given: "Dado que sou um cliente autenticado no app bancário com limite diurno de R$ 2.000,00 e saldo disponível de R$ 500,00",
      when: "Quando eu tento realizar uma transferência Pix no valor de R$ 800,00 às 14:00h",
      then: "Então o sistema não deve solicitar a senha PIN\nE deve exibir a tela 'Limite Pix Excedido'\nE deve mostrar que o limite disponível é de R$ 500,00\nE deve apresentar o botão 'Solicitar Aumento de Limite'",
    },
    {
      title: "Solicitação de aumento de limite a partir da tela de bloqueio",
      given: "Dado que estou na tela de 'Limite Pix Excedido'",
      when: "Quando eu clico no botão 'Solicitar Aumento de Limite'",
      then: "Então o sistema deve abrir o formulário de ajuste de limite pré-preenchido com o valor tentado\nE deve exibir o aviso de aprovação em até 24 horas",
    },
  ],
  rawMarkdown: `# Título
Notificação e Solicitação de Limite Pix Excedido

---

# História
Como Cliente do banco no aplicativo mobile
Quero visualizar uma mensagem clara ao tentar realizar um Pix acima do meu limite diário e poder solicitar o aumento de limite diretamente na tela
Para eu compreenda exatamente o motivo do impedimento da transação e consiga pedir mais limite sem precisar acionar o suporte telefônico

---

# Contexto
Atualmente, ao ultrapassar o limite Pix, o aplicativo apresenta uma falha genérica de 'Serviço indisponível', sobrecarregando o SAC. A alteração visa adequar o app à Resolução BCB nº 142/2021, informando o saldo restante do limite e oferecendo fluxo direto para solicitação de aumento com prazo claro de análise.

---

# Critérios de Aceitação
AC01 - Ao tentar confirmar uma transferência Pix superior ao limite disponível no período (diurno ou noturno), o sistema deverá bloquear a transação antes da digitação da senha e exibir tela de limite excedido conforme RN01 e RN02.
AC02 - A tela de aviso deverá exibir expressamente o valor que tentou ser transferido, o limite diário total configurado e o saldo de limite ainda disponível para o dia.
AC03 - A tela de aviso deverá disponibilizar o botão 'Solicitar Aumento de Limite', direcionando o usuário para o formulário de ajuste conforme RN03.
AC04 - O sistema deverá registrar um log de tentativa de transação excedida no serviço de monitoramento de risco conforme RN04.

---

# Regras de Negócio
RN01 - O limite transacional Noturno (20h às 06h) possui teto padrão de R$ 1.000,00, salvo se o cliente já tiver personalizado um valor inferior.
RN02 - O saldo de limite diário disponível é recalculado instantaneamente a cada transação Pix concluída no mesmo dia civil.
RN03 - Solicitações de aumento de limite Pix devem exibir aviso informativo de prazo de homologação de até 24 horas, em conformidade com as regras do Banco Central.
RN04 - Logs de limite excedido devem conter ID do cliente, valor tentado, horário e dispositivo para análise do motor antifraude.

---

# Cenários BDD
## Cenário 01: Tentativa de Pix acima do limite diurno disponível
Dado Dado que sou um cliente autenticado no app bancário com limite diurno de R$ 2.000,00 e saldo disponível de R$ 500,00
Quando Quando eu tento realizar uma transferência Pix no valor de R$ 800,00 às 14:00h
Então Então o sistema não deve solicitar a senha PIN
E E deve exibir a tela 'Limite Pix Excedido'
E E deve mostrar que o limite disponível é de R$ 500,00
E E deve apresentar o botão 'Solicitar Aumento de Limite'

## Cenário 02: Solicitação de aumento de limite a partir da tela de bloqueio
Dado Dado que estou na tela de 'Limite Pix Excedido'
Quando Quando eu clico no botão 'Solicitar Aumento de Limite'
Então Então o sistema deve abrir o formulário de ajuste de limite pré-preenchido com o valor tentado
E E deve exibir o aviso de aprovação em até 24 horas
`,
  projectName: "App Banking Mobile",
  epicName: "Gestão de Transferências e Limites",
  requester: "Ana Paula Costa - GPM de Pagamentos & Pix",
  status: "refinement",
  storyPoints: 5,
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Vence em 2 dias
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: ["Pix", "Bacen", "UX", "Limites"],
};
