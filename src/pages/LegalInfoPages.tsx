import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { NexusLogo } from '../components/NexusLogo';

function PublicPageLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8FC] dark:bg-[#0D0E14] text-[#171725] dark:text-[#F4F4FA]">
      <header className="h-16 bg-white dark:bg-[#151722] border-b border-[#ECECF2] dark:border-[#23263A]">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <Link to="/">
            <NexusLogo size="md" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[#777789] hover:text-[#171725] dark:hover:text-white font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-xl bg-[#7955E8] text-white text-xs font-semibold hover:bg-[#6641D9]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[840px] w-full mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 sm:p-10">
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">{title}</h1>
          <p className="text-sm text-[#777789] dark:text-[#9C9DB2] mt-2">{subtitle}</p>
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#424256] dark:text-[#C8C9DA]">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#ECECF2] dark:border-[#23263A] py-6 text-center text-xs text-[#777789]">
        © 2026 NEXUS AI. All rights reserved.
      </footer>
    </div>
  );
}

export function AboutPage() {
  return (
    <PublicPageLayout
      title="About NEXUS AI"
      subtitle="Think Beyond. Build What Matters."
    >
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          Our Mission
        </h2>
        <p>
          NEXUS AI exists to bridge the gap between spotting an important real-world problem and
          shipping a well-engineered, verifiable project. Students, researchers, and hackathon teams
          often spend too much time scattered across disconnected notes, chat threads, and slide
          decks. NEXUS AI unifies problem discovery, comparative solution design, phased roadmaps,
          and presentation authoring in one calm workspace.
        </p>
      </section>
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          Human-Led, AI-Assisted
        </h2>
        <p>
          AI models accelerate research synthesis, root-cause framing, and technical drafting, but
          engineers and domain practitioners remain accountable for verification, field testing, and
          ethical deployment. All AI-generated feasibility scores and roadmaps in NEXUS AI are clearly
          labeled as estimates for human review.
        </p>
      </section>
    </PublicPageLayout>
  );
}

export function PrivacyPage() {
  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="Effective Date: November 2026"
    >
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          1. Information We Collect
        </h2>
        <p>
          We store only the account details you provide during registration (name, email address,
          optional institution, and role) along with the innovation briefs, tasks, team memberships,
          and generated reports you explicitly save inside your workspace.
        </p>
      </section>
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          2. Server-Side AI Processing
        </h2>
        <p>
          Prompts submitted to Discover or AI Studio are transmitted securely through our backend
          server to the Gemini API. Credentials and API keys are never exposed to client browsers.
        </p>
      </section>
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          3. Your Control
        </h2>
        <p>
          You may update your profile, export your project reports to PDF, or permanently delete
          projects you own at any time from your workspace settings.
        </p>
      </section>
    </PublicPageLayout>
  );
}

export function TermsPage() {
  return (
    <PublicPageLayout
      title="Terms of Service"
      subtitle="Last updated: November 2026"
    >
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          1. Acceptable Use
        </h2>
        <p>
          NEXUS AI is intended for legitimate research, educational innovation, software and
          hardware prototyping, and project planning. Users are responsible for the accuracy and
          safety of projects built using workspace outputs.
        </p>
      </section>
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          2. AI Output Disclaimer
        </h2>
        <p>
          AI-generated suggestions, complexity estimates, technology recommendations, and pitch text
          may contain inaccuracies or omissions and must be independently reviewed prior to real-world
          implementation or publication.
        </p>
      </section>
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          3. Intellectual Property
        </h2>
        <p>
          You retain full ownership of all problem statements, project plans, tasks, and documents
          you author or export within NEXUS AI.
        </p>
      </section>
    </PublicPageLayout>
  );
}

export function DocsPage() {
  return (
    <PublicPageLayout
      title="Platform Documentation"
      subtitle="Guide to Discover, AI Studio, Solution Comparison, and Project Execution."
    >
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          01. Problem Discovery
        </h2>
        <p>
          Use the Discover module to enter a raw problem statement, select one of eight focus domains,
          and run Gemini analysis to generate nine structured dimensions including root causes,
          stakeholders, blind spots, and research questions. Save any discovery directly into a
          tracked project.
        </p>
      </section>
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          02. Solution Comparison
        </h2>
        <p>
          Inside a project workspace, generate three contrasting technical solutions. Review
          working principles, complexity estimates, and risks in the comparison table, then select
          your primary direction to anchor subsequent roadmap and pitch generation.
        </p>
      </section>
      <section>
        <h2 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mb-2">
          03. Roadmaps, Teams & PDF Export
        </h2>
        <p>
          Generate phased roadmaps with automated tasks, invite collaborators with assigned roles,
          and export formal reports or 9-section pitch decks as clean PDF documents.
        </p>
      </section>
    </PublicPageLayout>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes('@') || !message.trim()) return;
    setSent(true);
  };

  return (
    <PublicPageLayout
      title="Contact NEXUS AI"
      subtitle="Questions, university partnerships, or hackathon support."
    >
      {sent ? (
        <div className="rounded-xl bg-[#EBF8F3] dark:bg-[#182A24] border border-[#2EA87E]/30 p-6 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#171725] dark:text-[#F4F4FA]">Message recorded</p>
            <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1">
              Thank you, {name}. Our team will follow up at {email}.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">Message</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your project, campus lab, or hackathon..."
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9]"
          >
            <Mail className="w-4 h-4" />
            <span>Send Message</span>
          </button>
        </form>
      )}
    </PublicPageLayout>
  );
}
