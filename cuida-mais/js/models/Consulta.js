/** Consulta: um agendamento de um usuário com um médico. */
class Consulta {
  static STATUS = { AGENDADA: 'agendada', REALIZADA: 'realizada', CANCELADA: 'cancelada' };

  constructor({ id, usuarioId, medicoId, data, hora, modalidade = 'Presencial', observacoes = '', valor, status = 'agendada', avaliada = false }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.medicoId = medicoId;
    this.data = data;
    this.hora = hora;
    this.modalidade = modalidade;
    this.observacoes = observacoes;
    this.valor = valor;
    this.status = status;
    this.avaliada = avaliada;
  }

  static de(objeto) { return new Consulta(objeto); }
  paraObjeto() { return { ...this }; }

  estaNoPassado() {
    return Formatadores.paraDate(this.data, this.hora) < new Date();
  }

  podeCancelar() {
    return this.status === Consulta.STATUS.AGENDADA && !this.estaNoPassado();
  }

  podeAvaliar() {
    return this.status === Consulta.STATUS.REALIZADA && !this.avaliada;
  }

  cancelar() {
    if (!this.podeCancelar()) throw new Error('Esta consulta não pode ser cancelada.');
    this.status = Consulta.STATUS.CANCELADA;
  }

  remarcar(data, hora) {
    if (this.status !== Consulta.STATUS.AGENDADA) throw new Error('Só é possível remarcar consultas agendadas.');
    this.data = data;
    this.hora = hora;
  }

  marcarRealizada() {
    this.status = Consulta.STATUS.REALIZADA;
  }
}
