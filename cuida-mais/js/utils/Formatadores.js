/** Formatadores: funções de apoio para mostrar dados na tela. Todos estáticos. */
class Formatadores {
  static DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  /** 280 -> "R$ 280,00" */
  static moeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /** "12-11-2026" -> "12/11/2026" (como aparece na tela) */
  static data(data) {
    return data ? data.replace(/-/g, '/') : '';
  }

  /** "12-11-2026" -> "Quinta, 12/11/2026" */
  static dataLonga(data) {
    if (!data) return '';
    return `${Formatadores.DIAS_SEMANA[Formatadores.paraDate(data).getDay()]}, ${Formatadores.data(data)}`;
  }

  /** Converte "DD-MM-AAAA" (+ "HH:MM" opcional) em objeto Date, para comparar e fazer contas. */
  static paraDate(data, hora = '00:00') {
    const [dia, mes, ano] = data.split('-').map(Number);
    const [h, min] = hora.split(':').map(Number);
    return new Date(ano, mes - 1, dia, h, min);
  }

  /** true se o texto está no formato "DD-MM-AAAA" e é uma data que existe (ex.: 31-02-2026 é inválida). */
  static dataValida(data) {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(data || '')) return false;
    const [dia, mes, ano] = data.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);
    return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
  }

  /** Date -> "DD-MM-AAAA" */
  static deDate(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  }

  /** "2026-11-12" (valor de <input type="date">) -> "12-11-2026" */
  static deInputData(iso) {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}-${mes}-${ano}`;
  }

  /** "12-11-2026" -> "2026-11-12" (para preencher um <input type="date">) */
  static paraInputData(data) {
    if (!data) return '';
    const [dia, mes, ano] = data.split('-');
    return `${ano}-${mes}-${dia}`;
  }

  /** "Dra. Ana Beatriz Souza" -> "AS" | "Maria Souza" -> "MS" (ignora Dr./Dra.) */
  static iniciais(nome) {
    const partes = String(nome || '')
      .replace(/^(dr|dra)\.?\s+/i, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  /** Protege texto que vai para dentro de innerHTML (evita quebrar o HTML com < > & "). */
  static escapar(texto) {
    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
