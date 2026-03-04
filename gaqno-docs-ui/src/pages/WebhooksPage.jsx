export function WebhooksPage() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Webhooks
      </h1>
      <p className="lead mt-6 text-lg text-zinc-600 dark:text-zinc-400">
        Configure webhooks to receive events when data changes in your account.
      </p>
      <h2 id="setup" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Setup
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Register a URL in your app settings. The API will send POST requests
        with a JSON payload when events occur.
      </p>
      <h2 id="signature" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Signature
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Verify requests using the <code>X-Webhook-Signature</code> header and
        your webhook secret.
      </p>
    </>
  );
}
