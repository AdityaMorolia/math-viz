export function mustGetElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

export function readNumberInput(id: string): number {
  const input = mustGetElement<HTMLInputElement>(id);
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}

export function setNumberInput(id: string, value: number): void {
  mustGetElement<HTMLInputElement>(id).value = formatNumber(value);
}

export function setCheckbox(id: string, checked: boolean): void {
  mustGetElement<HTMLInputElement>(id).checked = checked;
}

export function formatNumber(value: number): string {
  if (Math.abs(value) < 1e-10) {
    return "0";
  }
  return Number(value.toFixed(5)).toString();
}
