declare module 'secrets.js-grempe' {
  interface Secrets {
    share(secret: string, numShares: number, threshold: number): string[];
    combine(shares: string[]): string;
    init(): void;
  }

  const secrets: Secrets;
  export default secrets;
}
