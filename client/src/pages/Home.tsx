function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Virtual GD Trainer
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:text-white"
            >
              Login
            </a>

            <a
              href="/login"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-7xl px-6 pb-24 pt-24">
          <div className="max-w-4xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              AI-Powered Communication Training
            </p>

            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Practice.
              <br />
              Speak.
              <br />
              <span className="text-slate-400">Improve.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">
              Practice realistic Group Discussions with AI participants,
              analyze your communication performance, and receive personalized
              feedback to improve your speaking skills.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/login"
                className="rounded-xl bg-white px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Start Practicing →
              </a>

              <a
                href="/login"
                className="rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-7 py-3.5 font-semibold text-indigo-200 transition hover:border-indigo-300 hover:text-white"
              >
                Public Speaking
              </a>

              <a
                href="#features"
                className="rounded-xl border border-white/15 px-7 py-3.5 font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
              >
                Explore Features
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-y border-white/10 bg-slate-900/50"
        >
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                What you get
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                More than just a chatbot.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Feature
                number="01"
                title="Realistic GD Practice"
                description="Interact with multiple AI participants and practice expressing your ideas in a discussion environment."
              />

              <Feature
                number="02"
                title="Communication Analysis"
                description="Analyze speech patterns, fluency, filler words, pauses, language, and response quality."
              />

              <Feature
                number="03"
                title="Personalized Feedback"
                description="Understand your strengths, identify weaknesses, and receive actionable recommendations."
              />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-10 md:p-16">
            <h2 className="max-w-2xl text-3xl font-bold md:text-5xl">
              Your next GD starts here.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-slate-400">
              Practice consistently, understand your communication patterns,
              and track your progress over time.
            </p>

            <a
              href="/login"
              className="mt-8 inline-block rounded-xl bg-white px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Start a Session →
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-7">
      <span className="text-sm font-semibold text-slate-500">{number}</span>

      <h3 className="mt-8 text-xl font-semibold">{title}</h3>

      <p className="mt-4 leading-7 text-slate-400">{description}</p>
    </div>
  );
}

export default Home;