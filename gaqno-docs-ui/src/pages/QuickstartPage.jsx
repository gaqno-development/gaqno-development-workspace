import { Button } from '@/components/Button';

export function QuickstartPage() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Quickstart
      </h1>
      <p className="lead mt-6 text-lg text-zinc-600 dark:text-zinc-400">
        Get set up and make your first API request to the Gaqno API.
      </p>
      <h2 id="api-key" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        API key
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Before making requests, obtain your API key from the dashboard under
        Settings → API.
      </p>
      <h2 id="first-request" className="scroll-mt-24 mt-10 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        First request
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Use the base URL <code>https://api.gaqno.com.br</code> and send the
        API key in the <code>Authorization</code> header as a Bearer token.
      </p>
      <pre className="mt-4 rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-800 dark:text-zinc-200">
        {`curl -X GET "https://api.gaqno.com.br/v1/..." \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
      </pre>
      <div className="not-prose mt-6">
        <Button href="/authentication" variant="text" arrow="right">
          Authentication details
        </Button>
      </div>
    </>
  );
}
