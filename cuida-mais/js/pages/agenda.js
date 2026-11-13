/**
 * agenda.js
 * ----------------------------------------------------------------------------
 * Controlador da página "Confirmar agendamento" (agenda.html).
 *
 * Responsabilidades da AgendaPage:
 *  - descobrir qual médico foi escolhido e exibir seus dados;
 *  - desenhar o calendário (classe Calendario) e os horários livres do médico;
 *  - controlar as seleções do usuário (data, horário e modalidade);
 *  - validar e criar a consulta (via ConsultaService).
 *
 * Não guarda dados próprios: médicos, consultas e sessão vêm de MedicoService,
 * ConsultaService e AuthService. Datas seguem o padrão do projeto "DD-MM-AAAA".
 *
 * ----------------------------------------------------------------------------
 * COMO A PÁGINA DE MÉDICOS (medicos.html) ABRE A AGENDA
 * ----------------------------------------------------------------------------
 *   agenda.html?medico=2
 *   agenda.html?medico=2&data=12-11-2026&hora=14:00     (data e hora opcionais)
 *
 * Também são aceitos `medicoId` no lugar de `medico`, `horario` no lugar de
 * `hora` e data no formato AAAA-MM-DD. Sem médico válido, volta para medicos.html.
 *
 * Dependências (carregar antes deste arquivo, nesta ordem): dados-iniciais.js,
 * Formatadores.js, Storage.js, Medico.js, Consulta.js, AuthService.js,
 * MedicoService.js, ConsultaService.js e Calendario.js.
 */
class AgendaPage {
  static ROTAS = Object.freeze({
    medicos: 'medicos.html',
    historico: 'historico.html',
    login: 'index.html',
  });

  static ATRASO_REDIRECIONAMENTO_MS = 1600;
  static HORARIO_SUGERIDO = '14:00';
  static LIMITE_DIAS_BUSCA = 366;

  static CLINICA = 'Clínica Cuida+ Esteio';
  static LOCAL = 'Clínica Cuida+ · Esteio';

  /** Chave usada no HTML (data-modalidade) -> valor gravado na consulta. */
  static MODALIDADES = Object.freeze({
    presencial: 'Presencial',
    telemedicina: 'Telemedicina',
  });

  #hoje;
  #parametros;
  #calendario;
  #medico = null;
  #usuario = null;
  #dataSelecionada = null;
  #horarioSelecionado = null;
  #modalidade = 'presencial';
  #confirmando = false;
  #elementos = {};

  /**
   * @param {{hoje?: Date, busca?: string}} [opcoes] Injetáveis para facilitar testes.
   *   `busca` é a query string da URL (ex.: "?medico=2").
   */
  constructor({ hoje = new Date(), busca = window.location.search } = {}) {
    this.#hoje = hoje;
    this.#parametros = new URLSearchParams(busca);
    this.#calendario = new Calendario(hoje);
  }

  // ---------------------------------------------------------------------------
  // Ciclo de vida
  // ---------------------------------------------------------------------------

  /** Ponto de entrada: valida login e médico, e monta a página. */
  iniciar() {
    Storage.iniciar();

    this.#usuario = AuthService.usuarioLogado();
    if (!this.#usuario) {
      AuthService.exigirLogin();
      return;
    }

    this.#medico = this.#resolverMedico();
    if (!this.#medico) {
      window.location.href = AgendaPage.ROTAS.medicos;
      return;
    }

    this.#obterElementos();
    this.#definirSelecaoInicial();
    this.#registrarEventos();
    this.#renderizarUsuario();
    this.#renderizarMedico();
    this.#renderizarTudo();
  }

  #obterElementos() {
    const porId = (id) => document.getElementById(id);

    this.#elementos = {
      avatarUsuario: porId('usuario-avatar'),
      nomeUsuario: porId('usuario-nome'),
      botaoSair: porId('btn-sair'),
      cartaoMedico: porId('cartao-medico'),
      tituloMes: porId('calendario-titulo'),
      botaoMesAnterior: porId('btn-mes-anterior'),
      botaoProximoMes: porId('btn-proximo-mes'),
      diasSemana: porId('calendario-dias-semana'),
      grade: porId('calendario-grade'),
      tituloHorarios: porId('horarios-titulo'),
      listaHorarios: porId('horarios-lista'),
      resumoMedico: porId('resumo-medico'),
      resumoEspecialidade: porId('resumo-especialidade'),
      resumoData: porId('resumo-data'),
      resumoHorario: porId('resumo-horario'),
      resumoLocal: porId('resumo-local'),
      resumoValor: porId('resumo-valor'),
      modalidades: porId('modalidades'),
      observacoes: porId('observacoes'),
      mensagem: porId('mensagem'),
      botaoConfirmar: porId('btn-confirmar'),
      botaoCancelar: porId('btn-cancelar'),
    };

    const faltando = Object.entries(this.#elementos)
      .filter(([, elemento]) => !elemento)
      .map(([nome]) => nome);

    if (faltando.length > 0) {
      throw new Error(`AgendaPage: elementos não encontrados no HTML: ${faltando.join(', ')}`);
    }
  }

  /** @returns {Medico|null} Médico indicado na URL, se existir no cadastro. */
  #resolverMedico() {
    const id = this.#parametros.get('medico') ?? this.#parametros.get('medicoId');
    return id === null ? null : MedicoService.buscarPorId(id);
  }

  #registrarEventos() {
    const el = this.#elementos;

    el.botaoMesAnterior.addEventListener('click', () => this.mudarMes(-1));
    el.botaoProximoMes.addEventListener('click', () => this.mudarMes(1));

    // Delegação de eventos: um único listener por lista, mesmo com re-renderização.
    el.grade.addEventListener('click', (evento) => {
      const botao = evento.target.closest('button[data-data]');
      if (botao && !botao.disabled) this.selecionarData(Calendario.lerPadrao(botao.dataset.data));
    });

    el.listaHorarios.addEventListener('click', (evento) => {
      const botao = evento.target.closest('button[data-horario]');
      if (botao && !botao.disabled) this.selecionarHorario(botao.dataset.horario);
    });

    el.modalidades.addEventListener('click', (evento) => {
      const botao = evento.target.closest('button[data-modalidade]');
      if (botao) this.selecionarModalidade(botao.dataset.modalidade);
    });

    el.botaoConfirmar.addEventListener('click', () => this.confirmar());
    el.botaoCancelar.addEventListener('click', () => this.cancelar());

    el.botaoSair.addEventListener('click', (evento) => {
      evento.preventDefault();
      AuthService.logout();
      window.location.href = AgendaPage.ROTAS.login;
    });
  }

  // ---------------------------------------------------------------------------
  // Ações do usuário
  // ---------------------------------------------------------------------------

  /** @param {Date|null} data */
  selecionarData(data) {
    if (!data || !this.#diaAgendavel(data)) return;

    this.#dataSelecionada = data;

    // Mantém o horário escolhido apenas se continuar livre na nova data.
    if (this.#horarioSelecionado && !this.#horariosLivresEm(data).includes(this.#horarioSelecionado)) {
      this.#horarioSelecionado = null;
    }

    this.#limparMensagem();
    this.#renderizarTudo();
  }

  /** @param {string} horario Ex.: "14:00". */
  selecionarHorario(horario) {
    if (!this.#horariosLivresEm(this.#dataSelecionada).includes(horario)) return;

    this.#horarioSelecionado = horario;
    this.#limparMensagem();
    this.#renderizarHorarios();
    this.#renderizarResumo();
  }

  /** @param {string} modalidade Uma das chaves de AgendaPage.MODALIDADES. */
  selecionarModalidade(modalidade) {
    if (!(modalidade in AgendaPage.MODALIDADES)) return;

    this.#modalidade = modalidade;
    this.#renderizarModalidades();
  }

  /** @param {-1|1} direcao -1 = mês anterior, 1 = próximo mês. */
  mudarMes(direcao) {
    if (direcao < 0) {
      if (!this.#calendario.podeVoltar(this.#hoje)) return;
      this.#calendario.irParaMesAnterior();
    } else {
      this.#calendario.irParaProximoMes();
    }

    this.#renderizarCalendario();
  }

  /** Cria a consulta pelo ConsultaService e redireciona para o histórico. */
  confirmar() {
    if (this.#confirmando) return;

    const erro = this.#validar();
    if (erro) {
      this.#tratarFalhaAoConfirmar(erro);
      return;
    }

    this.#confirmando = true;
    this.#elementos.botaoConfirmar.disabled = true;

    try {
      ConsultaService.criar({
        medicoId: this.#medico.id,
        data: Calendario.formatarPadrao(this.#dataSelecionada),
        hora: this.#horarioSelecionado,
        modalidade: AgendaPage.MODALIDADES[this.#modalidade],
        observacoes: this.#elementos.observacoes.value.trim(),
      });
    } catch (erro) {
      // O serviço devolve mensagens prontas para o usuário (ex.: horário ocupado).
      this.#confirmando = false;
      this.#tratarFalhaAoConfirmar(erro.message);
      return;
    }

    this.#exibirMensagem('Consulta agendada com sucesso! Redirecionando para o histórico...', 'sucesso');
    this.#renderizarHorarios();

    window.setTimeout(() => {
      window.location.href = AgendaPage.ROTAS.historico;
    }, AgendaPage.ATRASO_REDIRECIONAMENTO_MS);
  }

  cancelar() {
    window.location.href = AgendaPage.ROTAS.medicos;
  }

  /**
   * Mostra o erro e atualiza a tela. O horário escolhido pode ter sido ocupado
   * por outra pessoa enquanto o usuário decidia: nesse caso a escolha é limpa e
   * a grade é redesenhada com a disponibilidade atual.
   * @param {string} mensagem
   */
  #tratarFalhaAoConfirmar(mensagem) {
    const livres = this.#horariosLivresEm(this.#dataSelecionada);
    if (this.#horarioSelecionado && !livres.includes(this.#horarioSelecionado)) {
      this.#horarioSelecionado = null;
    }

    this.#exibirMensagem(mensagem, 'erro');
    this.#renderizarHorarios();
    this.#renderizarResumo();
  }

  // ---------------------------------------------------------------------------
  // Renderização
  // ---------------------------------------------------------------------------

  #renderizarTudo() {
    this.#renderizarCalendario();
    this.#renderizarHorarios();
    this.#renderizarModalidades();
    this.#renderizarResumo();
  }

  #renderizarUsuario() {
    this.#elementos.avatarUsuario.textContent = Formatadores.iniciais(this.#usuario.nome);
    this.#elementos.nomeUsuario.textContent = this.#usuario.nome;
  }

  #renderizarMedico() {
    const medico = this.#medico;
    const { cartaoMedico } = this.#elementos;
    cartaoMedico.replaceChildren();

    const avatar = AgendaPage.#criarElemento('div', {
      classe: 'avatar avatar--grande',
      texto: medico.iniciais(),
      atributos: { 'aria-hidden': 'true' },
    });
    avatar.style.backgroundColor = medico.cor;

    const info = AgendaPage.#criarElemento('div', { classe: 'cartao-medico__info' });
    info.append(
      AgendaPage.#criarElemento('h2', { classe: 'cartao-medico__nome', texto: medico.nome }),
      AgendaPage.#criarElemento('p', {
        classe: 'cartao-medico__detalhe',
        texto: `${medico.especialidade} · ${AgendaPage.CLINICA}`,
      }),
      this.#criarLinhaAvaliacao(),
    );

    cartaoMedico.append(avatar, info);
  }

  #criarLinhaAvaliacao() {
    const { nota, totalAvaliacoes } = this.#medico;
    const linha = AgendaPage.#criarElemento('p', { classe: 'cartao-medico__avaliacao' });

    const estrelas = AgendaPage.#criarElemento('span', {
      classe: 'estrelas',
      texto: '★'.repeat(Math.round(nota)),
      atributos: { role: 'img', 'aria-label': `Nota ${AgendaPage.#formatarNota(nota)} de 5` },
    });

    const texto = AgendaPage.#criarElemento('span', {
      texto: `${AgendaPage.#formatarNota(nota)} (${totalAvaliacoes} avaliações)`,
    });

    linha.append(estrelas, texto);
    return linha;
  }

  #renderizarCalendario() {
    const { tituloMes, botaoMesAnterior, diasSemana, grade } = this.#elementos;

    tituloMes.textContent = this.#calendario.titulo;
    botaoMesAnterior.disabled = !this.#calendario.podeVoltar(this.#hoje);

    // Cabeçalho dos dias da semana (D S T Q Q S S)
    diasSemana.replaceChildren(
      ...Calendario.DIAS_SEMANA_CURTO.map((letra, indice) =>
        AgendaPage.#criarElemento('span', {
          classe: 'calendario__dia-semana',
          texto: letra,
          atributos: { title: Calendario.DIAS_SEMANA_COMPLETO[indice] },
        }),
      ),
    );

    grade.replaceChildren(...this.#calendario.gerarGrade().map((data) => this.#criarCelulaDia(data)));
  }

  /** @param {Date|null} data `null` representa uma célula vazia de alinhamento. */
  #criarCelulaDia(data) {
    if (!data) return AgendaPage.#criarElemento('span', { classe: 'calendario__vazio' });

    const selecionado = Calendario.mesmoDia(data, this.#dataSelecionada);

    const botao = AgendaPage.#criarElemento('button', {
      classe: `calendario__dia${selecionado ? ' calendario__dia--selecionado' : ''}`,
      texto: String(data.getDate()),
      atributos: {
        type: 'button',
        'data-data': Calendario.formatarPadrao(data),
        'aria-label': Calendario.formatarComDiaSemana(data),
        'aria-pressed': String(selecionado),
      },
    });

    botao.disabled = !this.#diaAgendavel(data);
    return botao;
  }

  #renderizarHorarios() {
    const { tituloHorarios, listaHorarios } = this.#elementos;
    const livres = this.#horariosLivresEm(this.#dataSelecionada);

    tituloHorarios.textContent = `Horários disponíveis em ${Calendario.formatarDiaMes(this.#dataSelecionada)}`;

    listaHorarios.replaceChildren(
      ...this.#medico.horarios.map((horario) => {
        const selecionado = horario === this.#horarioSelecionado;

        const botao = AgendaPage.#criarElemento('button', {
          classe: `horario${selecionado ? ' horario--selecionado' : ''}`,
          texto: horario,
          atributos: { type: 'button', 'data-horario': horario, 'aria-pressed': String(selecionado) },
        });

        botao.disabled = !livres.includes(horario);
        return botao;
      }),
    );
  }

  #renderizarModalidades() {
    this.#elementos.modalidades.querySelectorAll('button[data-modalidade]').forEach((botao) => {
      const ativa = botao.dataset.modalidade === this.#modalidade;
      botao.classList.toggle('chip--ativo', ativa);
      botao.setAttribute('aria-pressed', String(ativa));
    });
  }

  #renderizarResumo() {
    const el = this.#elementos;
    const medico = this.#medico;

    el.resumoMedico.textContent = medico.nome;
    el.resumoEspecialidade.textContent = medico.especialidade;
    el.resumoData.textContent = Calendario.formatarComDiaSemana(this.#dataSelecionada);
    el.resumoHorario.textContent = this.#horarioSelecionado ?? '—';
    el.resumoLocal.textContent = AgendaPage.LOCAL;
    el.resumoValor.textContent = AgendaPage.#formatarMoeda(medico.preco);

    el.botaoConfirmar.disabled = this.#confirmando || !this.#horarioSelecionado;
  }

  // ---------------------------------------------------------------------------
  // Mensagens de feedback
  // ---------------------------------------------------------------------------

  /**
   * @param {string} texto
   * @param {'erro'|'sucesso'} tipo
   */
  #exibirMensagem(texto, tipo) {
    const { mensagem } = this.#elementos;
    mensagem.textContent = texto;
    mensagem.className = `mensagem mensagem--${tipo}`;
  }

  #limparMensagem() {
    const { mensagem } = this.#elementos;
    mensagem.textContent = '';
    mensagem.className = 'mensagem';
  }

  // ---------------------------------------------------------------------------
  // Regras de negócio
  // ---------------------------------------------------------------------------

  /** Horários ("HH:MM") livres do médico em `data`, segundo o MedicoService. */
  #horariosLivresEm(data) {
    return MedicoService.horariosLivres(this.#medico.id, Calendario.formatarPadrao(data));
  }

  /** Um dia só pode ser escolhido se é útil, não passou e ainda tem horário livre. */
  #diaAgendavel(data) {
    return Calendario.estaDisponivel(data, this.#hoje) && this.#horariosLivresEm(data).length > 0;
  }

  /**
   * Escolhe data e horário ao abrir a página.
   * Prioridade: valores da URL (?data=&hora=) -> primeiro dia útil com horário
   * livre e horário sugerido. Valores inválidos ou indisponíveis são ignorados.
   */
  #definirSelecaoInicial() {
    const dataDaUrl = this.#lerDataDaUrl();

    const dataUrlValida = dataDaUrl !== null && this.#diaAgendavel(dataDaUrl);

    this.#dataSelecionada = dataUrlValida ? dataDaUrl : this.#encontrarPrimeiraDataComHorario();
    this.#calendario = new Calendario(this.#dataSelecionada);

    const livres = this.#horariosLivresEm(this.#dataSelecionada);
    const horarioDaUrl = this.#parametros.get('hora') ?? this.#parametros.get('horario');

    if (livres.includes(horarioDaUrl)) {
      this.#horarioSelecionado = horarioDaUrl;
    } else if (livres.includes(AgendaPage.HORARIO_SUGERIDO)) {
      this.#horarioSelecionado = AgendaPage.HORARIO_SUGERIDO;
    }
  }

  /** Aceita "DD-MM-AAAA" (padrão do projeto) ou "AAAA-MM-DD". */
  #lerDataDaUrl() {
    const texto = this.#parametros.get('data');
    return Calendario.lerPadrao(texto) ?? Calendario.lerISO(texto);
  }

  /** Primeiro dia útil, a partir de hoje, que ainda tenha algum horário livre. */
  #encontrarPrimeiraDataComHorario() {
    let data = Calendario.proximoDiaDisponivel(this.#hoje);

    for (let i = 0; i < AgendaPage.LIMITE_DIAS_BUSCA && this.#horariosLivresEm(data).length === 0; i++) {
      // Expediente de hoje encerrado (ou dia lotado): tenta o próximo dia útil.
      const amanha = new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
      data = Calendario.proximoDiaDisponivel(amanha);
    }

    return data;
  }

  /** @returns {string|null} Mensagem de erro, ou `null` se estiver tudo válido. */
  #validar() {
    if (!this.#dataSelecionada) return 'Escolha uma data para a consulta.';
    if (!this.#horarioSelecionado) return 'Escolha um horário para a consulta.';
    if (!this.#horariosLivresEm(this.#dataSelecionada).includes(this.#horarioSelecionado)) {
      return 'Este horário não está mais disponível. Escolha outro.';
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Utilitários (internos à classe, para não criar nomes globais)
  // ---------------------------------------------------------------------------

  /**
   * Cria um elemento sem usar innerHTML (evita injeção de HTML).
   * @param {string} tag
   * @param {{classe?: string, texto?: string, atributos?: Object<string,string>}} [opcoes]
   * @returns {HTMLElement}
   */
  static #criarElemento(tag, { classe, texto, atributos = {} } = {}) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    Object.entries(atributos).forEach(([nome, valor]) => elemento.setAttribute(nome, valor));
    return elemento;
  }

  static #formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  static #formatarNota(nota) {
    return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
}

document.addEventListener('DOMContentLoaded', () => new AgendaPage().iniciar());
