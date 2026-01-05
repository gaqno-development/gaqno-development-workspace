

export function formatDate(
  input: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale: string = 'pt-BR'
): string {
  if (!input) return '-'
  try {
    const date = input instanceof Date ? input : new Date(input)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString(locale, options)
  } catch {
    return '-'
  }
}


