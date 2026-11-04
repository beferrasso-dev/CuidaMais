/** MedicoService: consulta e atualiza os médicos. Todos os métodos são estáticos. */
class MedicoService {
  static _todos() {
    return Storage.ler(Storage.CHAVES.MEDICOS, []).map(Medico.de);
  }

  static listar() {
    return MedicoService._todos();
  }

  static buscarPorId(id) {
    return MedicoService._todos().find((m) => m.id === Number(id)) || null;
  }

  /** Lista de especialidades sem repetir, em ordem alfabética. */
  static listarEspecialidades() {
    const lista = MedicoService._todos().map((m) => m.especialidade);
    return [...new Set(lista)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  /**
   * Filtra os médicos. Todos os campos são opcionais.
   *   filtros = { especialidade: 'Cardiologia', nome: 'carlos', data: '12-11-2026' }
   * Com `data`, só ficam médicos que ainda têm algum horário livre naquele dia.
   */
  static filtrar({ especialidade = '', nome = '', data = '' } = {}) {
    const normalizar = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const busca = normalizar(nome);
    return MedicoService._todos().filter((m) => {
      if (especialidade && especialidade !== 'todas' && m.especialidade !== especialidade) return false;
      if (busca && !normalizar(m.nome).includes(busca)) return false;
      if (data && MedicoService.horariosLivres(m.id, data).length === 0) return false;
      return true;
    });
  }

  /**
   * Horários ("HH:MM") ainda livres do médico naquele dia ("DD-MM-AAAA").
   * Tira os já agendados, os horários que já passaram e fins de semana.
   */
  static horariosLivres(medicoId, data) {
    const medico = MedicoService.buscarPorId(medicoId);
    if (!medico || !data) return [];
    if (!Formatadores.dataValida(data)) return [];
    const diaSemana = Formatadores.paraDate(data).getDay();
    if (diaSemana === 0 || diaSemana === 6) return [];
    const agora = new Date();
    return medico.horarios.filter((hora) =>
      Formatadores.paraDate(data, hora) > agora && !ConsultaService.horarioOcupado(medico.id, data, hora)
    );
  }

  /** Aplica uma nova avaliação (1 a 5) na média do médico e salva. */
  static atualizarNota(medicoId, nota) {
    const todos = MedicoService._todos();
    const medico = todos.find((m) => m.id === Number(medicoId));
    if (!medico) throw new Error('Médico não encontrado.');
    medico.atualizarNota(nota);
    Storage.salvar(Storage.CHAVES.MEDICOS, todos.map((m) => m.paraObjeto()));
  }
}
