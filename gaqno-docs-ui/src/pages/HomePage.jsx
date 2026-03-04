import { Button } from '@/components/Button';
import { Guides } from '@/components/Guides';
import { HeroPattern } from '@/components/HeroPattern';

export function HomePage() {
  return (
    <>
      <HeroPattern />
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
        API Documentation
      </h1>
      <p className="lead mt-6 text-lg text-zinc-600 dark:text-zinc-400">
        Use the Gaqno API to integrate with your product. This guide covers
        authentication, errors, webhooks, and core resources.
      </p>
      <div className="not-prose mb-16 mt-6 flex gap-3">
        <Button href="/quickstart" arrow="right">
          Quickstart
        </Button>
        <Button href="/api-overview" variant="outline">
          API Overview
        </Button>
      </div>
      <h2 className="scroll-mt-24 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white" id="getting-started">
        Getting started
      </h2>
      <p className="lead mt-2 text-zinc-600 dark:text-zinc-400">
        Create an application in your developer settings, then use the HTTP API
        or SDKs to access the resources you need.
      </p>
      <div className="not-prose mt-4">
        <Button href="/quickstart" variant="text" arrow="right">
          Get started
        </Button>
      </div>
      <Guides />
    </>
  );
}
