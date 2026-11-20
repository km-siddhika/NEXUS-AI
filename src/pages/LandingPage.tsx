import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileSpreadsheet,
  GitBranch,
  Layers,
  Menu,
  Moon,
  Presentation,
  Scale,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { NexusLogo } from '../components/NexusLogo';
import { HeroWorkspaceVisual, ProjectCoverIllustration } from '../components/ProjectArtwork';
import { useTheme } from '../contexts/ThemeContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

const FEATURES = [
  {
    num: '01',
    title: 'Discover Problems',
    description:
      'Break down messy real-world observations into structured root causes, affected stakeholders, research questions, and innovation gaps.',
    icon: Compass,
    accent: '#7955E8',
    span: 'lg:col-span-2',
  },
  {
    num: '02',
    title: 'AI-Powered Solutions',
    description:
      'Generate contrasting technical architectures and compare working principles, complexity, and tradeoffs side by side.',
    icon: Sparkles,
    accent: '#63CBEA',
    span: 'lg:col-span-1',
  },
  {
    num: '03',
    title: 'Intelligent Feasibility Analysis',
    description:
      'Evaluate implementation risks, missing evidence, and technical constraints with transparent AI-estimated boundaries.',
    icon: Scale,
    accent: '#F47BA7',
    span: 'lg:col-span-1',
  },
  {
    num: '04',
    title: 'Smart Project Roadmaps',
    description:
      'Convert chosen solutions into phased timelines with milestones, verification tests, dependencies, and trackable tasks.',
    icon: GitBranch,
    accent: '#FF895E',
    span: 'lg:col-span-2',
  },
  {
    num: '05',
    title: 'Team Collaboration',
    description:
      'Organize interdisciplinary contributors, assign clear roles, share project briefs, and capture structured review notes.',
    icon: Users,
    accent: '#7955E8',
    span: 'lg:col-span-1',
  },
  {
    num: '06',
    title: 'Professional Pitch Builder',
    description:
      'Draft structured 9-section hackathon decks, technical reports, and executive briefs ready for PDF export.',
    icon: Presentation,
    accent: '#2EA87E',
    span: 'lg:col-span-2',
  },
];

const WORKFLOW_STEPS = [
  { step: '01', label: 'Discover', detail: 'Capture a real-world problem and domain context.' },
  { step: '02', label: 'Analyze', detail: 'Surface root causes, stakeholders, and blind spots.' },
  { step: '03', label: 'Innovate', detail: 'Compare 3 distinct solution pathways objectively.' },
  { step: '04', label: 'Build', detail: 'Execute phased roadmaps and team milestones.' },
  { step: '05', label: 'Present', detail: 'Export judge-ready pitches and technical reports.' },
];

export default function LandingPage() {
  const { user, loginDemo } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showcaseTab, setShowcaseTab] = useState<'solutions' | 'roadmap'>('solutions');
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoStart = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/app');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8FC] dark:bg-[#0D0E14] text-[#171725] dark:text-[#F4F4FA]">
      {/* Sticky Top Navbar — 3-Zone Contract */}
      <header className="sticky top-0 z-40 bg-[#F8F8FC]/90 dark:bg-[#0D0E14]/90 backdrop-blur border-b border-[#ECECF2] dark:border-[#23263A]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <Link to="/" className="whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#7955E8] rounded-lg">
            <NexusLogo size="md" />
          </Link>

          {/* Zone 2: Concise Single-Line Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#777789] dark:text-[#9C9DB2]">
            <a href="#product" className="hover:text-[#171725] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Product
            </a>
            <a href="#features" className="hover:text-[#171725] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#171725] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              How it works
            </a>
            <a href="#showcase" className="hover:text-[#171725] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Solutions
            </a>
            <Link to="/about" className="hover:text-[#171725] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              About
            </Link>
          </nav>

          {/* Zone 3: Primary Action + Theme Switch */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              className="p-2 rounded-xl border border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722] text-[#777789] hover:text-[#171725] dark:hover:text-white transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {user ? (
              <Link
                to="/app"
                className="px-4 py-2 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors whitespace-nowrap shrink-0"
              >
                Open Workspace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-semibold text-[#171725] dark:text-[#F4F4FA] hover:text-[#7955E8] transition-colors whitespace-nowrap shrink-0"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors whitespace-nowrap shrink-0"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenu((m) => !m)}
            aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
            title="Toggle navigation menu"
            className="lg:hidden p-2 rounded-xl border border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722]"
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="lg:hidden border-t border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722] px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <a href="#product" onClick={() => setMobileMenu(false)} className="py-1.5">Product</a>
              <a href="#features" onClick={() => setMobileMenu(false)} className="py-1.5">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="py-1.5">How it works</a>
              <a href="#showcase" onClick={() => setMobileMenu(false)} className="py-1.5">Solutions</a>
              <Link to="/about" onClick={() => setMobileMenu(false)} className="py-1.5">About</Link>
            </div>
            <div className="pt-2 border-t border-[#ECECF2] dark:border-[#23263A] flex items-center gap-3">
              <Link
                to="/login"
                className="flex-1 text-center px-4 py-2 rounded-xl border border-[#ECECF2] dark:border-[#23263A] text-sm font-semibold"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center px-4 py-2 rounded-xl bg-[#7955E8] text-white text-sm font-semibold"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="product" className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-6 flex flex-col justify-center"
          >
            <p className="text-sm font-semibold text-[#7955E8] dark:text-[#A98FFF] tracking-tight mb-4">
              Introducing the future of intelligent innovation
            </p>
            <h1
              className="font-display font-extrabold tracking-tight text-[#171725] dark:text-[#F4F4FA] leading-[1.08] max-w-xl"
              style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.65rem)', textWrap: 'balance' }}
            >
              Great ideas deserve better execution.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#777789] dark:text-[#9C9DB2] leading-relaxed max-w-xl">
              From identifying real-world problems to developing practical solutions, NEXUS AI helps
              you transform ideas into projects that make an impact.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to={user ? '/app' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors whitespace-nowrap shrink-0 shadow-[0_8px_24px_-6px_rgba(121,85,232,0.5)]"
              >
                <span>Start Building</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#showcase"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] text-sm font-semibold text-[#171725] dark:text-[#F4F4FA] hover:border-[#7955E8]/50 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Platform</span>
              </a>
              {!user && (
                <button
                  type="button"
                  onClick={handleDemoStart}
                  disabled={demoLoading}
                  className="px-4 py-3 text-sm font-semibold text-[#7955E8] dark:text-[#B69EFF] hover:underline whitespace-nowrap shrink-0"
                >
                  {demoLoading ? 'Opening Demo...' : 'Try Judge Demo'}
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="lg:col-span-6"
          >
            <HeroWorkspaceVisual />
          </motion.div>
        </div>
      </section>

      {/* Trust / Audience Focus Strip */}
      <section className="border-y border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#171725] dark:text-[#F4F4FA]">
              Built for the next generation of problem solvers.
            </h2>
            <p className="text-sm text-[#777789] dark:text-[#9C9DB2] mt-1">
              Structured workflows designed for research rigor, rapid prototyping, and clear communication.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-[#777789] dark:text-[#9C9DB2]">
            <span>University Researchers</span>
            <span aria-hidden="true">·</span>
            <span>Hackathon Teams</span>
            <span aria-hidden="true">·</span>
            <span>Independent Builders</span>
            <span aria-hidden="true">·</span>
            <span>Civic Innovators</span>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold text-[#7955E8] mb-2">Platform Capabilities</p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
            One workspace from problem statement to presentation deck.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.num}
                className={`${feat.span} rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 sm:p-7 hover:border-[#7955E8]/40 transition-colors flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${feat.accent}18`, color: feat.accent }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-[#777789] dark:text-[#9C9DB2]">
                      {feat.num}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#171725] dark:text-[#F4F4FA]">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#777789] dark:text-[#9C9DB2] mt-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works — 5-Step Process */}
      <section id="how-it-works" className="bg-white dark:bg-[#151722] border-y border-[#ECECF2] dark:border-[#23263A]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-[#7955E8] mb-2">Execution Workflow</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
              Five deliberate stages from observation to shipped solution.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-5"
              >
                <span className="font-mono text-xs font-semibold text-[#7955E8]">{item.step}.</span>
                <h3 className="font-display font-bold text-base text-[#171725] dark:text-[#F4F4FA] mt-2">
                  {item.label}
                </h3>
                <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-1.5 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Showcase Preview */}
      <section id="showcase" className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#7955E8] mb-2">Workspace Preview</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#171725] dark:text-[#F4F4FA] tracking-tight">
              See how an innovation project takes shape.
            </h2>
          </div>
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A]">
            <button
              type="button"
              onClick={() => setShowcaseTab('solutions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showcaseTab === 'solutions'
                  ? 'bg-[#7955E8] text-white'
                  : 'text-[#777789] hover:text-[#171725] dark:hover:text-white'
              }`}
            >
              AI Solutions
            </button>
            <button
              type="button"
              onClick={() => setShowcaseTab('roadmap')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showcaseTab === 'roadmap'
                  ? 'bg-[#7955E8] text-white'
                  : 'text-[#777789] hover:text-[#171725] dark:hover:text-white'
              }`}
            >
              Roadmap Preview
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 sm:p-8 shadow-[0_18px_48px_-24px_rgba(23,23,37,0.12)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <ProjectCoverIllustration theme="cyan" domain="Environment" className="h-44" />
              <div className="text-xs text-[#777789] dark:text-[#9C9DB2]">
                <span>Environment</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>In Progress</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>Sample Workspace</span>
              </div>
              <h3 className="font-display font-bold text-xl text-[#171725] dark:text-[#F4F4FA]">
                Urban Heat-Island Microclimate Mesh
              </h3>
              <p className="text-sm text-[#777789] dark:text-[#9C9DB2] leading-relaxed">
                Solar-powered ESP32 LoRaWAN sensor nodes mounted on transit shelters to surface
                block-level wet-bulb heat advisories before dangerous peaks.
              </p>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#777789]">Execution Progress</span>
                  <span className="font-mono tabular-nums font-semibold text-[#171725] dark:text-[#F4F4FA]">
                    68%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#F8F8FC] dark:bg-[#1C1F2E] overflow-hidden">
                  <div className="h-full w-[68%] rounded-full bg-[#7955E8]" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              {showcaseTab === 'solutions' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#7955E8]/40 p-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-[#7955E8]">Selected Direction</span>
                      <span className="text-[#777789]">Est. Medium</span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-[#171725] dark:text-[#F4F4FA]">
                      Solar LoRaWAN Mesh + Pharmacy Gateways
                    </h4>
                    <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-2 leading-relaxed">
                      $38 sensor pucks transmitting 18-byte frames to community-hosted gateways with zero SIM fees.
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#ECECF2] dark:border-[#2A2E45] text-[11px] text-[#777789]">
                      ESP32-S3 · SX1262 · SHT45 · MapLibre GL
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-[#777789]">Alternative 02</span>
                      <span className="text-[#777789]">Est. Low</span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-[#171725] dark:text-[#F4F4FA]">
                      Fleet-Mounted Transit Bus Probes
                    </h4>
                    <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-2 leading-relaxed">
                      Rapid arterial corridor sweeps over existing bus cellular routers; less coverage in shaded courtyards.
                    </p>
                    <div className="mt-3 pt-3 border-t border-[#ECECF2] dark:border-[#2A2E45] text-[11px] text-[#777789]">
                      CAN-bus Logger · PT1000 · PostGIS
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#171725] dark:text-[#F4F4FA]">
                        Phase 1: Enclosure & Sensor Calibration
                      </span>
                      <span className="font-mono text-xs text-[#7955E8]">Weeks 1–2</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#777789] dark:text-[#9C9DB2]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Deliverable: Calibrated firmware image & PETG radiation shield CAD</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#171725] dark:text-[#F4F4FA]">
                        Phase 2: Gateway Mesh & Live Heatmap
                      </span>
                      <span className="font-mono text-xs text-[#7955E8]">Weeks 3–4</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#777789] dark:text-[#9C9DB2]">
                      <Layers className="w-3.5 h-3.5 text-[#7955E8]" />
                      <span>Test Gate: Packet delivery rate &gt; 96% across 600m urban blocks</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F8F8FC] dark:bg-[#1C1F2E] border border-[#ECECF2] dark:border-[#2A2E45] p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#171725] dark:text-[#F4F4FA]">
                        Phase 3: Pilot Dispatch & Pitch Export
                      </span>
                      <span className="font-mono text-xs text-[#7955E8]">Weeks 5–6</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#777789] dark:text-[#9C9DB2]">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF895E]" />
                      <span>Deliverable: Municipal partner report & 9-section presentation deck</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl bg-[#171725] dark:bg-[#151722] border border-[#2A2E45] px-6 py-12 sm:px-12 sm:py-16 text-center">
          <h2
            className="font-display font-bold text-2xl sm:text-4xl text-white max-w-2xl mx-auto tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Your next big innovation starts with one problem.
          </h2>
          <p className="text-sm sm:text-base text-[#B8B9CC] mt-3 max-w-xl mx-auto">
            Think Beyond. Build What Matters.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={user ? '/app' : '/register'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#ECECF2] dark:border-[#23263A] bg-white dark:bg-[#151722]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5">
              <NexusLogo size="md" />
              <p className="text-sm text-[#777789] dark:text-[#9C9DB2] mt-3 max-w-xs">
                Think Beyond. Build What Matters.
              </p>
              <p className="text-xs text-[#777789] dark:text-[#9C9DB2] mt-4 leading-relaxed max-w-sm">
                AI-generated analyses, feasibility notes, and roadmap estimates may contain inaccuracies
                and should be independently verified before implementation.
              </p>
            </div>
            <div className="md:col-span-2 space-y-2 text-sm">
              <p className="font-semibold text-[#171725] dark:text-[#F4F4FA] mb-3">Platform</p>
              <a href="#features" className="block text-[#777789] hover:text-[#7955E8]">Features</a>
              <a href="#how-it-works" className="block text-[#777789] hover:text-[#7955E8]">Workflow</a>
              <a href="#showcase" className="block text-[#777789] hover:text-[#7955E8]">Showcase</a>
              <Link to="/docs" className="block text-[#777789] hover:text-[#7955E8]">Documentation</Link>
            </div>
            <div className="md:col-span-2 space-y-2 text-sm">
              <p className="font-semibold text-[#171725] dark:text-[#F4F4FA] mb-3">Company</p>
              <Link to="/about" className="block text-[#777789] hover:text-[#7955E8]">About NEXUS</Link>
              <Link to="/contact" className="block text-[#777789] hover:text-[#7955E8]">Contact</Link>
              <Link to="/privacy" className="block text-[#777789] hover:text-[#7955E8]">Privacy Policy</Link>
              <Link to="/terms" className="block text-[#777789] hover:text-[#7955E8]">Terms of Service</Link>
            </div>
            <div className="md:col-span-3 space-y-2 text-sm">
              <p className="font-semibold text-[#171725] dark:text-[#F4F4FA] mb-3">Resources</p>
              <Link to="/login" className="block text-[#777789] hover:text-[#7955E8]">Sign In</Link>
              <Link to="/register" className="block text-[#777789] hover:text-[#7955E8]">Create Account</Link>
              <Link to="/docs" className="block text-[#777789] hover:text-[#7955E8]">API & Architecture</Link>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#ECECF2] dark:border-[#23263A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777789] dark:text-[#9C9DB2]">
            <span>© 2026 NEXUS AI. All rights reserved.</span>
            <span>Built for researchers, developers, and hackathon teams.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
