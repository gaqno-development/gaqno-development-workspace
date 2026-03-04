export function ApiOverviewPage() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
        API Overview
      </h1>
      <p className="lead mt-6 text-lg text-zinc-600 dark:text-zinc-400">
        The Gaqno API is RESTful. Base URL: <code>https://api.gaqno.com.br</code>.
      </p>
      <h2 id="base" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Base URL
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        All endpoints are relative to the base URL. Versioning is in the path
        (e.g. <code>/v1/...</code>).
      </p>
      <h2 id="content-type" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Content type
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Send <code>Content-Type: application/json</code> for request bodies and
        expect JSON responses.
      </p>
    </>
  );
}
