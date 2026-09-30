/**
 * Define data-theme antes da primeira pintura.
 *
 * tokens/colors.css só aplica o tema escuro sob [data-theme="dark"] — não há
 * media query de prefers-color-scheme. Sem este script, quem usa o aparelho no
 * escuro veria o tema claro até o React hidratar. O tema escuro não é enfeite:
 * o criador acompanha eclosões de madrugada no galpão.
 */
const script = `
(function () {
  try {
    var salvo = localStorage.getItem("sisaves-tema");
    var tema = salvo === "light" || salvo === "dark"
      ? salvo
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", tema);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
