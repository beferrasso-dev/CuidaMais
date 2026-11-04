/** Avaliacao: opinião do paciente sobre uma consulta realizada. */
class Avaliacao {
  constructor({ id, consultaId, medicoId, notaGeral, criterios, comentario = '', recomenda = true, criadaEm }) {
    this.id = id;
    this.consultaId = consultaId;
    this.medicoId = medicoId;
    this.notaGeral = notaGeral;
    this.criterios = criterios || { atendimento: 0, pontualidade: 0, estrutura: 0 };
    this.comentario = comentario;
    this.recomenda = recomenda;
    this.criadaEm = criadaEm || new Date().toISOString();
  }

  static de(objeto) { return new Avaliacao(objeto); }
  paraObjeto() { return { ...this, criterios: { ...this.criterios } }; }
}
