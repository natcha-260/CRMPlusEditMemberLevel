export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          CRM Plus — Edit Member Level
        </h1>
        <p className="text-base text-black/60 dark:text-white/60">
          The project is set up and running. Start building in{" "}
          <code className="rounded bg-black/[.05] px-1.5 py-0.5 font-mono text-sm dark:bg-white/[.08]">
            src/app
          </code>
          .
        </p>
      </div>
    </main>
  );
}
