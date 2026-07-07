export function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

export function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}
