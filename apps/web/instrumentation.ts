/**
 * Next's instrumentation hook, run once when the server starts. A malformed
 * ENCRYPTION_KEY must fail here, at boot, instead of on the first secret write
 * — by then the install looks healthy and the failure reads as corrupt data.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEncryptionKey } = await import("@enerthya/core/crypto");
    validateEncryptionKey();
  }
}
