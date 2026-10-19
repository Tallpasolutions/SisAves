/**
 * As portas de entrada do sistema, e se estão abertas.
 *
 * Enquanto o SisAves está no ar apenas para teste, o endereço é público: quem
 * recebesse o link entrava com a própria conta Google — ou preenchia três
 * campos em /cadastrar — e passava a ter conta e criatório dentro do projeto
 * de produção. A RLS isola os dados de um criatório dos do outro, então nada
 * do plantel do cliente ficava visível; mas conta de estranho no projeto é
 * linha em `auth.users`, é e-mail saindo pelo SMTP e é um convidado a mais
 * para quando as chaves forem rotacionadas.
 *
 * **Isto tranca o lado de cá, não o Supabase.** O endpoint
 * `/auth/v1/authorize?provider=google` do projeto responde a qualquer um com
 * a chave anônima, que é pública por desenho — quem souber montar a URL
 * continua recebendo sessão, mesmo sem o botão na tela. A tranca de verdade é
 * desligar o provedor em Authentication → Providers → Google e marcar
 * "Disable new user signups" em Authentication → Sign In / Providers. O que
 * mora aqui é o par disso: a tela não oferece a porta e a Server Action
 * recusa, para o caminho não ficar acessível por um POST direto.
 *
 * Ambas falham fechadas: só o valor exato `on` abre. Variável com erro de
 * digitação deixa a porta trancada, que é o lado certo para errar.
 */

/** Entrada por conta Google. Desligada até a abertura ao público. */
export const LOGIN_GOOGLE_ABERTO = process.env.LOGIN_GOOGLE === "on";

/**
 * Criação de conta por e-mail e senha.
 *
 * Fechar o Google e deixar este aberto não resolveria nada: é a mesma porta
 * com dois campos a mais. Quem já tem conta continua entrando normalmente —
 * o que está desligado é criar conta nova.
 */
export const CADASTRO_ABERTO = process.env.CADASTRO_ABERTO === "on";
