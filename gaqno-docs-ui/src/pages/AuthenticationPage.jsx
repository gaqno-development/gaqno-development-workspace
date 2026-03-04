export function AuthenticationPage() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Authentication
      </h1>
      <p className="lead mt-6 text-lg text-zinc-600 dark:text-zinc-400">
        All API requests require authentication using a Bearer token.
      </p>
      <h2 id="bearer" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Bearer token
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Include your API key in the <code>Authorization</code> header:
      </p>
      <pre className="mt-4 rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-800 dark:text-zinc-200">
        {`Authorization: Bearer YOUR_API_KEY`}
      </pre>
      <h2 id="scopes" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Scopes
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        API keys can be restricted by scope. Ensure your key has the required
        permissions for the endpoints you call.
      </p>
    </>
  );
}
