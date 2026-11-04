/** Medico: profissional que atende as consultas. */
class Medico {
  constructor({ id, nome, especialidade, crm, preco, nota, totalAvaliacoes, cor, horarios }) {
    this.id = id;
    this.nome = nome;
    this.especialidade = especialidade;
    this.crm = crm;
    this.preco = preco;
    this.nota = nota;
    this.totalAvaliacoes = totalAvaliacoes;
    this.cor = cor;
    this.horarios = horarios;
  }

  static de(objeto) { return new Medico(objeto); }
  paraObjeto() { return { ...this, horarios: [...this.horarios] }; }

  iniciais() { return Formatadores.iniciais(this.nome); }

  /** Recalcula a média ponderada com a nova nota (1 a 5) e soma 1 avaliação. */
  atualizarNota(novaNota) {
    const soma = this.nota * this.totalAvaliacoes + Number(novaNota);
    this.totalAvaliacoes += 1;
    this.nota = Math.round((soma / this.totalAvaliacoes) * 10) / 10;
  }
}
