/**
 * Hold login password in memory only for the session.
 * Used to sign transactions (e.g. EIP-7702) without re-prompting.
 * Never persisted to sessionStorage or localStorage.
 */

let loginPassword: string | null = null;

export function setLoginPasswordInMemory(password: string): void {
  loginPassword = password;
}

export function getLoginPasswordInMemory(): string | null {
  return loginPassword;
}

export function clearLoginPasswordInMemory(): void {
  loginPassword = null;
}
