const useAnsi =
  Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;

function ansi(open) {
  return (s) => (useAnsi ? `\x1b[${open}m${s}\x1b[0m` : s);
}

export const bold = ansi(1);
export const dim = ansi(2);
export const cyan = ansi(36);
export const green = ansi(32);

export function printSuiteBanner(title) {
  const bar = "━".repeat(56);
  console.log("");
  console.log(`${cyan(bar)}`);
  console.log(`${cyan("  ")}${bold(title)}`);
  console.log(`${cyan(bar)}`);
}

export function printSuiteGateChain() {
  console.log(
    dim(
      "  Gates: flat components · folder names · feature names · shared span · subdomain bucket · root contract",
    ),
  );
  console.log("");
}

export function printSuiteFooter() {
  console.log("");
  console.log(`${green("  ✓")} ${bold("All page-structure gates passed")}${dim(" (7 checks)")}`);
  console.log("");
}

export function printSuiteStep(label) {
  console.log(dim(`  ▸ ${label}`));
}
