/**
 * Storage: "banco de dados" do projeto, em cima do localStorage.
 * Dados do sistema ficam no localStorage; a sessão (quem está logado) fica no sessionStorage.
 * Todos os métodos são estáticos: Storage.ler(...), Storage.salvar(...).
 */
class Storage {
  static CHAVES = {
    INICIADO: 'cuida_iniciado',
    USUARIOS: 'cuida_usuarios',
    MEDICOS: 'cuida_medicos',
    CONSULTAS: 'cuida_consultas',
    AVALIACOES: 'cuida_avaliacoes',
    SESSAO: 'cuida_sessao'
  };

  /** Lê e converte (JSON) o valor guardado. Se não existir ou der erro, devolve `padrao`. */
  static ler(chave, padrao = null) {
    try {
      const texto = localStorage.getItem(chave);
      return texto === null ? padrao : JSON.parse(texto);
    } catch (erro) {
      return padrao;
    }
  }

  static salvar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
  }

  static remover(chave) {
    localStorage.removeItem(chave);
  }

  /** Carrega os dados iniciais só na primeira abertura (ou depois de um resetar). */
  static iniciar() {
    if (localStorage.getItem(Storage.CHAVES.INICIADO)) return;
    Storage.salvar(Storage.CHAVES.USUARIOS, [DadosIniciais.USUARIO_DEMO]);
    Storage.salvar(Storage.CHAVES.MEDICOS, DadosIniciais.MEDICOS_INICIAIS);
    Storage.salvar(Storage.CHAVES.CONSULTAS, DadosIniciais.CONSULTAS_INICIAIS);
    Storage.salvar(Storage.CHAVES.AVALIACOES, DadosIniciais.AVALIACOES_INICIAIS);
    localStorage.setItem(Storage.CHAVES.INICIADO, '1');
  }

  /** Apaga tudo e volta ao estado inicial. Útil para repetir a demonstração no vídeo. */
  static resetar() {
    Object.values(Storage.CHAVES).forEach((chave) => localStorage.removeItem(chave));
    sessionStorage.removeItem(Storage.CHAVES.SESSAO);
    Storage.iniciar();
  }

  /* ---- Sessão (usada pelo AuthService) ---- */

  static lerSessao() {
    try {
      return JSON.parse(sessionStorage.getItem(Storage.CHAVES.SESSAO));
    } catch (erro) {
      return null;
    }
  }

  static salvarSessao(valor) {
    sessionStorage.setItem(Storage.CHAVES.SESSAO, JSON.stringify(valor));
  }

  static removerSessao() {
    sessionStorage.removeItem(Storage.CHAVES.SESSAO);
  }
}
