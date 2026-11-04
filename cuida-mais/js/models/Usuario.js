/** Usuario: quem usa o site (paciente). */
class Usuario {
  constructor({ id, nome, email, senha }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senha = senha;
  }

  static de(objeto) { return new Usuario(objeto); }
  paraObjeto() { return { ...this }; }

  iniciais() { return Formatadores.iniciais(this.nome); }
}
