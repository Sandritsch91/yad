/** Wraps one locale object in a UMD script that registers it on `yad.Yad.regional[key]`. */
export function umdLocale(key: string, locale: object, label?: string): string;
