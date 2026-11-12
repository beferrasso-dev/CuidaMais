/**
 * Modal: janela de diálogo por cima da página.
 *
 *   const janela = Modal.abrir('Título', '<p>Conteúdo em HTML</p>', [
 *     { rotulo: 'Voltar',  tipo: 'outline' },
 *     { rotulo: 'Confirmar', tipo: 'primario', aoClicar: (janela) => { ...; return false; } }
 *   ]);
 *
 *  - tipo do botão: 'primario' | 'outline' | 'perigo' (padrão: 'outline')
 *  - aoClicar recebe a janela. Se devolver `false`, a janela continua aberta (útil para validar um formulário).
 *  - sem botões, aparece só o "Fechar".
 *  - fecha também com Esc e clicando fora. O foco volta para onde estava.
 *  - o conteúdo entra como HTML: use Formatadores.escapar() em tudo que vem do usuário.
 */
class Modal {
  static _fundo = null;
  static _focoAnterior = null;
  static _aoTeclar = null;

  /** Abre a janela e devolve o elemento `.modal` (dá para usar .querySelector nele). */
  static abrir(titulo, conteudoHtml = '', botoes = []) {
    Modal.fechar();
    Modal._focoAnterior = document.activeElement;

    const fundo = document.createElement('div');
    fundo.className = 'modal-fundo';
    fundo.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <h2 class="modal-titulo" id="modal-titulo"></h2>
        <div class="modal-corpo"></div>
        <div class="modal-acoes"></div>
      </div>`;
    const janela = fundo.querySelector('.modal');
    janela.querySelector('.modal-titulo').textContent = titulo;
    janela.querySelector('.modal-corpo').innerHTML = conteudoHtml;

    const lista = botoes.length ? botoes : [{ rotulo: 'Fechar', tipo: 'outline' }];
    const acoes = janela.querySelector('.modal-acoes');
    lista.forEach((b) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = `btn btn-${b.tipo || 'outline'}`;
      botao.textContent = b.rotulo;
      botao.addEventListener('click', () => {
        const resultado = b.aoClicar ? b.aoClicar(janela) : undefined;
        if (resultado !== false) Modal.fechar();
      });
      acoes.appendChild(botao);
    });

    fundo.addEventListener('mousedown', (evento) => {
      if (evento.target === fundo) Modal.fechar();
    });
    Modal._aoTeclar = (evento) => Modal._tratarTecla(evento, janela);
    document.addEventListener('keydown', Modal._aoTeclar);

    document.body.appendChild(fundo);
    document.body.style.overflow = 'hidden';
    Modal._fundo = fundo;

    const primeiro = janela.querySelector('input, select, textarea') || janela.querySelector('.modal-acoes .btn-primario, .modal-acoes .btn-perigo') || janela.querySelector('.modal-acoes .btn');
    if (primeiro) primeiro.focus();
    return janela;
  }

  static fechar() {
    if (!Modal._fundo) return;
    Modal._fundo.remove();
    Modal._fundo = null;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', Modal._aoTeclar);
    Modal._aoTeclar = null;
    if (Modal._focoAnterior && document.contains(Modal._focoAnterior)) Modal._focoAnterior.focus();
    Modal._focoAnterior = null;
  }

  /** Esc fecha; Tab fica circulando dentro da janela. */
  static _tratarTecla(evento, janela) {
    if (evento.key === 'Escape') {
      Modal.fechar();
      return;
    }
    if (evento.key !== 'Tab') return;
    const focaveis = [...janela.querySelectorAll('button, input, select, textarea, a[href]')].filter((el) => !el.disabled);
    if (focaveis.length === 0) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }
}
