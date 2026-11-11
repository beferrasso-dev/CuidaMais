class Validador {
    static obrigatorio(v) {
        if (typeof v !== "string" || v.trim() === "") {
            return false;
        }
        return true;
    }

    static email(v) {
        const padrao = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return padrao.test(v);
    }

    static senhaMinima(v, n) {
        return v.length >= n;

    }
}