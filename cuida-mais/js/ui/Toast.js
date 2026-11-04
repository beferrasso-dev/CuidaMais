/** Toast: aviso rápido no canto da tela. Toast.mostrar('Salvo!', 'sucesso') */
class Toast {
  /** tipo: 'sucesso' | 'erro' | 'info' */
  static mostrar(mensagem, tipo = 'info', duracaoMs = 3500) {
    let area = document.getElementById('toast-container');
    if (!area) {
      area = document.createElement('div');
      area.id = 'toast-container';
      area.setAttribute('role', 'status');
      area.setAttribute('aria-live', 'polite');
      document.body.appendChild(area);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;
    area.appendChild(toast);
    setTimeout(() => toast.remove(), duracaoMs);
  }
}
