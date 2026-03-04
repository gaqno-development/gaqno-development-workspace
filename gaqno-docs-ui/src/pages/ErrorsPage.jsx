export function ErrorsPage() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Errors
      </h1>
      <p className="lead mt-6 text-lg text-zinc-600 dark:text-zinc-400">
        The API uses standard HTTP status codes and returns a JSON body with
        error details.
      </p>
      <h2 id="codes" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        HTTP status codes
      </h2>
      <ul className="mt-4 list-disc pl-6 text-zinc-600 dark:text-zinc-400">
        <li><strong>400</strong> — Bad Request: invalid parameters or body</li>
        <li><strong>401</strong> — Unauthorized: missing or invalid API key</li>
        <li><strong>404</strong> — Not Found: resource does not exist</li>
        <li><strong>429</strong> — Too Many Requests: rate limit exceeded</li>
        <li><strong>5xx</strong> — Server error: retry with backoff</li>
      </ul>
      <h2 id="body" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Error body
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Error responses include a <code>message</code> and optional
        <code>code</code> or <code>details</code> fields.
      </p>
      <pre className="mt-4 rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-800 dark:text-zinc-200">
        {`{
  "statusCode": 400,
  "message": "Validation failed",
  "path": "/v1/..."
}`}
      </pre>
    </>
  );
}
