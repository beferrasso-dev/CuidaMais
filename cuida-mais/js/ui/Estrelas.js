/** Estrelas: desenha uma nota de 0 a 5 (só para mostrar). Estrelas.html(4.8, 14) devolve um texto HTML. */
class Estrelas {
  static PONTOS = '12,2 15.1,8.6 22.3,9.4 17,14.3 18.5,21.4 12,17.8 5.5,21.4 7,14.3 1.7,9.4 8.9,8.6';

  static _svg(tamanho, classe) {
    return `<svg class="estrela ${classe}" width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" aria-hidden="true"><polygon points="${Estrelas.PONTOS}"/></svg>`;
  }

  /** nota (0 a 5, arredonda para o inteiro mais próximo), tamanho em pixels. */
  static html(nota, tamanho = 14) {
    const cheias = Math.max(0, Math.min(5, Math.round(Number(nota) || 0)));
    let svgs = '';
    for (let i = 1; i <= 5; i++) svgs += Estrelas._svg(tamanho, i <= cheias ? 'estrela-cheia' : 'estrela-vazia');
    return `<span class="estrelas" role="img" aria-label="Nota ${cheias} de 5">${svgs}</span>`;
  }
}

/**
 * EstrelasInput: estrelas clicáveis para o usuário escolher uma nota de 1 a 5.
 *   const notaGeral = new EstrelasInput(document.getElementById('nota-geral'), 0, (n) => { ... });
 *   notaGeral.getValor();   // 0 se ainda não escolheu
 */
class EstrelasInput {
  constructor(container, valorInicial = 0, onChange = null, tamanho = 36) {
    this.container = container;
    this.valor = valorInicial;
    this.onChange = onChange;
    this.tamanho = tamanho;
    this.renderizar();
    this.container.addEventListener('click', (evento) => {
      const botao = evento.target.closest('[data-valor]');
      if (botao) this.setValor(Number(botao.dataset.valor));
    });
    this.container.addEventListener('mouseover', (evento) => {
      const botao = evento.target.closest('[data-valor]');
      if (botao) this._pintar(Number(botao.dataset.valor));
    });
    this.container.addEventListener('mouseleave', () => this._pintar(this.valor));
  }

  renderizar() {
    let botoes = '';
    for (let i = 1; i <= 5; i++) {
      botoes += `<button type="button" class="estrela-botao" data-valor="${i}" aria-label="${i} ${i === 1 ? 'estrela' : 'estrelas'}">${Estrelas._svg(this.tamanho, '')}</button>`;
    }
    this.container.classList.add('estrelas-input');
    this.container.setAttribute('role', 'group');
    this.container.innerHTML = botoes;
    this._pintar(this.valor);
  }

  _pintar(ate) {
    this.container.querySelectorAll('[data-valor]').forEach((b) => {
      const ativa = Number(b.dataset.valor) <= ate;
      b.classList.toggle('ativa', ativa);
      b.setAttribute('aria-pressed', String(Number(b.dataset.valor) === this.valor));
    });
  }

  setValor(n) {
    this.valor = n;
    this._pintar(n);
    if (this.onChange) this.onChange(n);
  }

  getValor() {
    return this.valor;
  }
}
