class Validador {
    static obrigatorio(v) {
        if (typeof v !== "string" || v.trim() === "") {
            return false;
        }
        return true;
    }

    static email(v) {
        if (typeof v !== "string") {
            return false;
        }
        const padrao = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        return padrao.test(v.trim());
    }

    static senhaMinima(v, n = 6) {
        if (typeof v !== "string") {
            return false;
        }
        return v.length >= n;
    }
}
