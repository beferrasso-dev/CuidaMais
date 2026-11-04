/** AvaliacaoService: regras de negócio das avaliações. Todos os métodos são estáticos. */
class AvaliacaoService {
  static _todas() {
    return Storage.ler(Storage.CHAVES.AVALIACOES, []).map(Avaliacao.de);
  }

  /**
   * Salva uma avaliação.
   *   dados = { consultaId, notaGeral, criterios: {atendimento, pontualidade, estrutura}, comentario, recomenda }
   * Regras: a consulta precisa estar "realizada" e ainda não avaliada; a nota vai de 1 a 5.
   * Depois de salvar, marca a consulta como avaliada e atualiza a média do médico.
   */
  static criar({ consultaId, notaGeral, criterios, comentario = '', recomenda = true }) {
    const consulta = ConsultaService.buscarPorId(consultaId);
    if (!consulta) throw new Error('Consulta não encontrada.');
    if (consulta.status !== Consulta.STATUS.REALIZADA) throw new Error('Só é possível avaliar consultas realizadas.');
    if (AvaliacaoService.jaAvaliada(consultaId)) throw new Error('Esta consulta já foi avaliada.');
    const nota = Number(notaGeral);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) throw new Error('Escolha uma nota geral de 1 a 5 estrelas.');

    const todas = AvaliacaoService._todas();
    const avaliacao = new Avaliacao({
      id: todas.reduce((maior, a) => Math.max(maior, a.id), 0) + 1,
      consultaId: consulta.id,
      medicoId: consulta.medicoId,
      notaGeral: nota,
      criterios,
      comentario: String(comentario).trim(),
      recomenda
    });
    todas.push(avaliacao);
    Storage.salvar(Storage.CHAVES.AVALIACOES, todas.map((a) => a.paraObjeto()));
    ConsultaService.marcarAvaliada(consulta.id);
    MedicoService.atualizarNota(consulta.medicoId, nota);
    return avaliacao;
  }

  static buscarPorConsulta(consultaId) {
    return AvaliacaoService._todas().find((a) => a.consultaId === Number(consultaId)) || null;
  }

  static jaAvaliada(consultaId) {
    const consulta = ConsultaService.buscarPorId(consultaId);
    return Boolean((consulta && consulta.avaliada) || AvaliacaoService.buscarPorConsulta(consultaId));
  }

  /** Nota média atual do médico (já considera as avaliações novas). */
  static mediaDoMedico(medicoId) {
    const medico = MedicoService.buscarPorId(medicoId);
    return medico ? medico.nota : 0;
  }
}
