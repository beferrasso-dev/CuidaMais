/**
 * Layout: cabeçalho e rodapé iguais em todas as telas.
 * Cada HTML interno precisa ter <div id="cabecalho"></div> e <footer id="rodape"></footer>
 * e chamar, ao abrir:   if (!Layout.iniciar('historico')) return;
 */
class Layout {
  /* >>> TROCAR pelos nomes reais dos 4 integrantes (aparece no rodapé de todas as telas) <<< */
  static INTEGRANTES = ['Nome do Integrante 1', 'Nome do Integrante 2', 'Nome do Integrante 3', 'Nome do Integrante 4'];

  static PAGINAS = [
    { id: 'medicos', rotulo: 'Agendar consulta', href: 'medicos.html' },
    { id: 'agenda', rotulo: 'Minha agenda', href: 'agenda.html' },
    { id: 'avaliacao', rotulo: 'Avaliar consulta', href: 'avaliacao.html' },
    { id: 'historico', rotulo: 'Histórico', href: 'historico.html' }
  ];

  /**
   * Prepara a página interna: carrega dados, exige login, atualiza status das consultas
   * e desenha cabeçalho e rodapé. Devolve false (e redireciona) se não houver login.
   */
  static iniciar(paginaAtiva) {
    Storage.iniciar();
    AuthService.exigirLogin();
    if (!AuthService.usuarioLogado()) return false;
    ConsultaService.atualizarStatusAutomatico();
    Layout.renderHeader(paginaAtiva);
    Layout.renderFooter();
    Layout.ligarBotaoSair();
    return true;
  }

  /** paginaAtiva: 'medicos' | 'agenda' | 'avaliacao' | 'historico' */
  static renderHeader(paginaAtiva) {
    const usuario = AuthService.usuarioLogado();
    const nome = usuario ? Formatadores.escapar(usuario.nome) : '';
    const iniciais = usuario ? Formatadores.iniciais(usuario.nome) : '';
    const menu = Layout.PAGINAS.map((p) =>
      `<a href="${p.href}"${p.id === paginaAtiva ? ' class="ativo" aria-current="page"' : ''}>${p.rotulo}</a>`
    ).join('');
    document.getElementById('cabecalho').innerHTML = `
      <header class="cabecalho">
        <a class="logo" href="medicos.html"><span class="logo-marca" aria-hidden="true"></span>Cuida+</a>
        <nav class="menu" aria-label="Menu principal">${menu}</nav>
        <div class="usuario">
          <span class="avatar" aria-hidden="true">${iniciais}</span>
          <span class="usuario-nome">${nome}</span>
          <button type="button" class="btn-link" id="btn-sair">Sair</button>
        </div>
      </header>`;
  }

  static renderFooter() {
    document.getElementById('rodape').innerHTML = `
      <div class="rodape">
        <span class="esmaecido">© 2026 Cuida+ · Desafio Extensionista</span>
        <span>Integrantes: ${Layout.INTEGRANTES.map(Formatadores.escapar).join(' · ')}</span>
      </div>`;
  }

  static ligarBotaoSair() {
    const botao = document.getElementById('btn-sair');
    if (!botao) return;
    botao.addEventListener('click', () => {
      AuthService.logout();
      window.location.href = 'index.html';
    });
  }
}
