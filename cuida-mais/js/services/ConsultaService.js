/** ConsultaService: regras de negócio das consultas. Todos os métodos são estáticos. */
class ConsultaService {
  static _todas() {
    return Storage.ler(Storage.CHAVES.CONSULTAS, []).map(Consulta.de);
  }

  static _salvarTodas(lista) {
    Storage.salvar(Storage.CHAVES.CONSULTAS, lista.map((c) => c.paraObjeto()));
  }

  static _proximoId(lista) {
    return lista.reduce((maior, c) => Math.max(maior, c.id), 0) + 1;
  }

  /** Valida data ("DD-MM-AAAA") e hora ("HH:MM"). Lança Error com mensagem para mostrar ao usuário. */
  static _validarDataHora(data, hora) {
    if (!Formatadores.dataValida(data)) throw new Error('Escolha uma data válida.');
    if (!/^\d{2}:\d{2}$/.test(hora || '')) throw new Error('Escolha um horário.');
    const diaSemana = Formatadores.paraDate(data).getDay();
    if (diaSemana === 0 || diaSemana === 6) throw new Error('Não há atendimento aos fins de semana.');
    if (Formatadores.paraDate(data, hora) < new Date()) throw new Error('Escolha uma data e um horário futuros.');
  }

  /** Consultas do usuário (por padrão, o logado), da mais recente para a mais antiga. */
  static listarDoUsuario(usuarioId = AuthService.usuarioLogado()?.id) {
    ConsultaService.atualizarStatusAutomatico();
    return ConsultaService._todas()
      .filter((c) => c.usuarioId === usuarioId)
      .sort((a, b) => Formatadores.paraDate(b.data, b.hora) - Formatadores.paraDate(a.data, a.hora));
  }

  static buscarPorId(id) {
    return ConsultaService._todas().find((c) => c.id === Number(id)) || null;
  }

  /**
   * Cria uma consulta para o usuário logado.
   *   dados = { medicoId, data, hora, modalidade, observacoes }
   * Lança Error se: não há login, médico inexistente, data/hora inválida ou horário ocupado.
   */
  static criar({ medicoId, data, hora, modalidade = 'Presencial', observacoes = '' }) {
    const usuario = AuthService.usuarioLogado();
    if (!usuario) throw new Error('Faça login para agendar.');
    const medico = MedicoService.buscarPorId(medicoId);
    if (!medico) throw new Error('Médico não encontrado.');
    ConsultaService._validarDataHora(data, hora);
    if (ConsultaService.horarioOcupado(medico.id, data, hora)) throw new Error('Este horário acabou de ser ocupado. Escolha outro.');

    const todas = ConsultaService._todas();
    const consulta = new Consulta({
      id: ConsultaService._proximoId(todas),
      usuarioId: usuario.id,
      medicoId: medico.id,
      data, hora, modalidade, observacoes,
      valor: medico.preco,
      status: Consulta.STATUS.AGENDADA,
      avaliada: false
    });
    todas.push(consulta);
    ConsultaService._salvarTodas(todas);
    return consulta;
  }

  static cancelar(id) {
    const todas = ConsultaService._todas();
    const consulta = todas.find((c) => c.id === Number(id));
    if (!consulta) throw new Error('Consulta não encontrada.');
    consulta.cancelar();
    ConsultaService._salvarTodas(todas);
  }

  static remarcar(id, data, hora) {
    const todas = ConsultaService._todas();
    const consulta = todas.find((c) => c.id === Number(id));
    if (!consulta) throw new Error('Consulta não encontrada.');
    ConsultaService._validarDataHora(data, hora);
    if (ConsultaService.horarioOcupado(consulta.medicoId, data, hora, consulta.id)) throw new Error('Este horário já está ocupado. Escolha outro.');
    consulta.remarcar(data, hora);
    ConsultaService._salvarTodas(todas);
  }

  /** true se já existe consulta AGENDADA do médico nesse dia e horário (`ignorarId` serve para remarcar). */
  static horarioOcupado(medicoId, data, hora, ignorarId = null) {
    return ConsultaService._todas().some((c) =>
      c.medicoId === Number(medicoId) && c.data === data && c.hora === hora &&
      c.status === Consulta.STATUS.AGENDADA && c.id !== ignorarId
    );
  }

  /** Consultas agendadas cujo horário já passou viram "realizada". */
  static atualizarStatusAutomatico() {
    const todas = ConsultaService._todas();
    let mudou = false;
    todas.forEach((c) => {
      if (c.status === Consulta.STATUS.AGENDADA && c.estaNoPassado()) {
        c.marcarRealizada();
        mudou = true;
      }
    });
    if (mudou) ConsultaService._salvarTodas(todas);
  }

  /** `status` = "agendada" | "realizada" | "cancelada" | "todas" (ou vazio = todas). */
  static filtrarPorStatus(status, usuarioId = AuthService.usuarioLogado()?.id) {
    const lista = ConsultaService.listarDoUsuario(usuarioId);
    return !status || status === 'todas' ? lista : lista.filter((c) => c.status === status);
  }

  /** Totais para os cards do Histórico: { total, realizadas, canceladas, agendadas }. */
  static resumo(usuarioId = AuthService.usuarioLogado()?.id) {
    const lista = ConsultaService.listarDoUsuario(usuarioId);
    const conta = (s) => lista.filter((c) => c.status === s).length;
    return { total: lista.length, realizadas: conta('realizada'), canceladas: conta('cancelada'), agendadas: conta('agendada') };
  }

  /** Chamado pelo AvaliacaoService depois de salvar a avaliação. */
  static marcarAvaliada(id) {
    const todas = ConsultaService._todas();
    const consulta = todas.find((c) => c.id === Number(id));
    if (!consulta) throw new Error('Consulta não encontrada.');
    consulta.avaliada = true;
    ConsultaService._salvarTodas(todas);
  }
}
