class AuthService {

    static login(email, senha) {
        const usuarios = Storage.ler(Storage.CHAVES.USUARIOS);
        const usuario = usuarios.find(u => {
            return u.email === email && u.senha === senha;
        })

        if (usuario === undefined) {
            return null;
        }
        const sessao = {
            id: usuario.id,
            nome: usuario.nome
        }
        Storage.salvarSessao(sessao);
        return usuario;
    }


    static logout() {
        Storage.removerSessao();
    }

    static usuarioLogado() {
        return Storage.lerSessao();
    }

    static exigirLogin() {
        const usuario = AuthService.usuarioLogado();
        if (usuario === null) {
            window.location.href = 'index.html';
        }
    }

    static cadastrar(dados) {
        const usuarios = Storage.ler(Storage.CHAVES.USUARIOS);
        const usuario = usuarios.find(u => u.email === dados.email);
        if (usuario !== undefined) {
            return null;
        }
        const novoUsuario = {
            id: Math.max(...usuarios.map(u => u.id)) + 1,
            nome: dados.nome,
            email: dados.email,
            senha: dados.senha
        }
        usuarios.push(novoUsuario);
        Storage.salvar(Storage.CHAVES.USUARIOS, usuarios);
        return novoUsuario;
    }
}