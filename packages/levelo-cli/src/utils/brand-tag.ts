export const brandColor = (str: string) => `\x1b[38;2;124;107;246m${str}\x1b[0m`;
export const brandBadge = (str: string) => `\x1b[48;2;124;107;246m\x1b[30m\x1b[1m ${str} \x1b[0m`;
export const brandTag = brandColor('[LEVELOJS]');
