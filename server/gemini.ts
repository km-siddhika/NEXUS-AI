import { GoogleGenAI, Type } from '@google/genai';
import type {
  PitchDeckData,
  ProblemAnalysis,
  ReportType,
  RoadmapPhase,
  SolutionOption,
  StudioToolId,
} from '../src/types/nexus.ts';

const MODEL = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('API_KEY') || msg.includes('PERMISSION_DENIED') || msg.includes('NOT_FOUND')) {
        throw err;
      }
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function analyzeProblemWithGemini(input: {
  title: string;
  description: string;
  domain: string;
  targetAudience: string;
  supportingInfo?: string;
}): Promise<ProblemAnalysis> {
  const ai = getAiClient();
  const prompt = `Analyze this real-world innovation problem thoroughly and constructively.
Title: ${input.title}
Domain: ${input.domain}
Target Audience: ${input.targetAudience}
Description: ${input.description}
Supporting Context: ${input.supportingInfo || 'None provided'}

Return concrete, practical, non-generic insights grounded in the domain. Do not invent fake statistics.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an experienced systems researcher and product strategist at NEXUS AI. Provide structured, clear, realistic analysis without hype or fabricated metrics.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Concise 2-3 sentence executive summary.' },
            refinedStatement: {
              type: Type.STRING,
              description: 'A crisp, actionable How-Might-We or problem framing statement.',
            },
            rootCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
            stakeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
            currentChallenges: { type: Type.ARRAY, items: { type: Type.STRING } },
            possibleImpact: { type: Type.ARRAY, items: { type: Type.STRING } },
            researchQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
            opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'summary',
            'refinedStatement',
            'rootCauses',
            'stakeholders',
            'currentChallenges',
            'possibleImpact',
            'researchQuestions',
            'missingInformation',
            'opportunities',
          ],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Omit<ProblemAnalysis, 'updatedAt'>;
  return {
    summary: parsed.summary || '',
    refinedStatement: parsed.refinedStatement || '',
    rootCauses: Array.isArray(parsed.rootCauses) ? parsed.rootCauses : [],
    stakeholders: Array.isArray(parsed.stakeholders) ? parsed.stakeholders : [],
    currentChallenges: Array.isArray(parsed.currentChallenges) ? parsed.currentChallenges : [],
    possibleImpact: Array.isArray(parsed.possibleImpact) ? parsed.possibleImpact : [],
    researchQuestions: Array.isArray(parsed.researchQuestions) ? parsed.researchQuestions : [],
    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
    opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
    updatedAt: new Date().toISOString(),
  };
}

export async function generateComparisonSolutions(input: {
  title: string;
  domain: string;
  description: string;
  targetAudience: string;
  constraints?: string;
}): Promise<SolutionOption[]> {
  const ai = getAiClient();
  const prompt = `Propose 3 genuinely distinct technical/product solution approaches for this problem.
Project Title: ${input.title}
Domain: ${input.domain}
Target Audience: ${input.targetAudience}
Problem Description: ${input.description}
Constraints/Notes: ${input.constraints || 'Standard student/startup build budget'}

Make each of the 3 options represent a meaningfully different architectural tradeoff (for example: hardware-first vs software-first vs hybrid/community workflow). Clearly treat complexity and impact ratings as estimates.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a principal solutions architect. Produce 3 contrasting, implementable solution concepts with honest limitations and risks.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              shortDescription: { type: Type.STRING },
              workingPrinciple: { type: Type.STRING },
              requiredTechnologies: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedComplexity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
              potentialImpact: { type: Type.STRING, enum: ['Moderate', 'High', 'Transformative'] },
              advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
              limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'name',
              'shortDescription',
              'workingPrinciple',
              'requiredTechnologies',
              'estimatedComplexity',
              'potentialImpact',
              'advantages',
              'limitations',
              'risks',
            ],
          },
        },
      },
    })
  );

  const raw = JSON.parse((response.text ?? '[]').trim()) as Array<
    Omit<SolutionOption, 'id' | 'isEstimate'>
  >;
  return raw.slice(0, 3).map((item, idx) => ({
    id: `sol_${Date.now()}_${idx}`,
    name: item.name || `Approach ${idx + 1}`,
    shortDescription: item.shortDescription || '',
    workingPrinciple: item.workingPrinciple || '',
    requiredTechnologies: Array.isArray(item.requiredTechnologies) ? item.requiredTechnologies : [],
    estimatedComplexity: (['Low', 'Medium', 'High'].includes(item.estimatedComplexity)
      ? item.estimatedComplexity
      : 'Medium') as SolutionOption['estimatedComplexity'],
    potentialImpact: (['Moderate', 'High', 'Transformative'].includes(item.potentialImpact)
      ? item.potentialImpact
      : 'High') as SolutionOption['potentialImpact'],
    advantages: Array.isArray(item.advantages) ? item.advantages : [],
    limitations: Array.isArray(item.limitations) ? item.limitations : [],
    risks: Array.isArray(item.risks) ? item.risks : [],
    isEstimate: true,
  }));
}

export async function generateRoadmapWithGemini(input: {
  title: string;
  domain: string;
  description: string;
  selectedSolution?: string;
  timeframe?: string;
}): Promise<{
  phases: RoadmapPhase[];
  suggestedTasks: Array<{
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    phaseIndex: number;
    daysFromNow: number;
  }>;
}> {
  const ai = getAiClient();
  const prompt = `Create a practical, phased execution roadmap and concrete actionable tasks.
Project: ${input.title} (${input.domain})
Description: ${input.description}
Selected Solution Direction: ${input.selectedSolution || 'Best practical MVP approach'}
Target Timeframe: ${input.timeframe || '6 weeks'}

Generate 3 to 4 sequential phases plus 6 to 8 specific tasks mapped to phaseIndex (0-based).`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an engineering program lead. Build realistic, sequenced project roadmaps with concrete verification tests and deliverables.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  testingRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'title',
                  'duration',
                  'objective',
                  'milestones',
                  'dependencies',
                  'testingRequirements',
                  'deliverables',
                ],
              },
            },
            suggestedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                  phaseIndex: { type: Type.INTEGER },
                  daysFromNow: { type: Type.INTEGER },
                },
                required: ['title', 'description', 'priority', 'phaseIndex', 'daysFromNow'],
              },
            },
          },
          required: ['phases', 'suggestedTasks'],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim()) as {
    phases?: Array<Omit<RoadmapPhase, 'id'>>;
    suggestedTasks?: Array<{
      title: string;
      description: string;
      priority: 'Low' | 'Medium' | 'High';
      phaseIndex: number;
      daysFromNow: number;
    }>;
  };

  const phases: RoadmapPhase[] = (parsed.phases ?? []).map((p, idx) => ({
    id: `phase_${Date.now()}_${idx}`,
    title: p.title,
    duration: p.duration,
    objective: p.objective,
    milestones: p.milestones ?? [],
    dependencies: p.dependencies ?? [],
    testingRequirements: p.testingRequirements ?? [],
    deliverables: p.deliverables ?? [],
  }));

  return {
    phases,
    suggestedTasks: parsed.suggestedTasks ?? [],
  };
}

export async function generatePitchDeckWithGemini(input: {
  title: string;
  domain: string;
  description: string;
  targetAudience: string;
  selectedSolution?: string;
}): Promise<PitchDeckData> {
  const ai = getAiClient();
  const prompt = `Draft a compelling, clear, hackathon & grant-ready 9-section project pitch.
Title: ${input.title}
Domain: ${input.domain}
Target Audience: ${input.targetAudience}
Description: ${input.description}
Selected Solution: ${input.selectedSolution || 'Not yet finalized — propose the strongest practical architecture'}

Keep each section concise, specific, and persuasive without inflated claims.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a startup and research pitch editor. Write clear, grounded, presentation-ready sections.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectTitle: { type: Type.STRING },
            problemStatement: { type: Type.STRING },
            existingLimitations: { type: Type.STRING },
            proposedSolution: { type: Type.STRING },
            innovation: { type: Type.STRING },
            technologyStack: { type: Type.STRING },
            implementationPlan: { type: Type.STRING },
            expectedImpact: { type: Type.STRING },
            futureScope: { type: Type.STRING },
          },
          required: [
            'projectTitle',
            'problemStatement',
            'existingLimitations',
            'proposedSolution',
            'innovation',
            'technologyStack',
            'implementationPlan',
            'expectedImpact',
            'futureScope',
          ],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Omit<PitchDeckData, 'updatedAt'>;
  return {
    ...parsed,
    updatedAt: new Date().toISOString(),
  };
}

export async function generateDocumentReportWithGemini(input: {
  reportType: ReportType;
  projectTitle: string;
  domain: string;
  description: string;
  contextSummary?: string;
}): Promise<{ title: string; sections: { heading: string; content: string }[] }> {
  const ai = getAiClient();
  const prompt = `Generate a structured "${input.reportType}" document.
Project Title: ${input.projectTitle}
Domain: ${input.domain}
Description: ${input.description}
Additional Project Context: ${input.contextSummary || 'None'}

Produce 4 to 6 well-structured sections suitable for formal review, PDF export, or presentation.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a technical writer creating formal innovation documentation. Write clear prose without placeholder text or fabricated user metrics.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ['heading', 'content'],
              },
            },
          },
          required: ['title', 'sections'],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim()) as {
    title?: string;
    sections?: { heading: string; content: string }[];
  };

  return {
    title: parsed.title || `${input.reportType} — ${input.projectTitle}`,
    sections: parsed.sections ?? [],
  };
}

export async function runStudioToolWithGemini(input: {
  toolId: StudioToolId;
  promptInput: string;
  context?: string;
  projectTitle?: string;
  domain?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}): Promise<{
  headline: string;
  summary: string;
  sections: Array<{ title: string; items: string[]; note?: string }>;
  markdownText: string;
}> {
  const ai = getAiClient();

  if (input.toolId === 'project_chat') {
    const historyBlock = (input.history ?? [])
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'User' : 'NEXUS Copilot'}: ${m.text}`)
      .join('\n');

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL,
        contents: `Project Context: ${input.projectTitle || 'General Innovation'} (${input.domain || 'General'})
Additional Context: ${input.context || 'None'}

Conversation History:
${historyBlock}

Latest User Question:
${input.promptInput}`,
        config: {
          systemInstruction:
            'You are the NEXUS Project AI Copilot. Answer directly, practically, and concisely. Highlight tradeoffs, technical steps, and caveats honestly.',
        },
      })
    );
    const reply = response.text ?? 'No response generated.';
    return {
      headline: 'Project Copilot Response',
      summary: reply,
      sections: [],
      markdownText: reply,
    };
  }

  const toolPrompts: Record<Exclude<StudioToolId, 'project_chat'>, string> = {
    problem_analyzer:
      'Perform a rigorous Problem Analysis: clarify the core tension, stakeholder pain points, evidence gaps, and testable hypotheses.',
    solution_generator:
      'Propose 3 distinct, practical solution pathways with core mechanics, build tradeoffs, and immediate validation experiments.',
    root_cause:
      'Conduct a 5-Whys and systems-level Root Cause Analysis separating surface symptoms from structural, behavioral, and technical drivers.',
    feasibility:
      'Evaluate Technical, Operational, Financial, and Adoption Feasibility. Clearly mark all ratings or effort timelines as AI estimates.',
    roadmap_generator:
      'Design a phased MVP-to-Pilot Roadmap with concrete milestones, verification criteria, and critical path dependencies.',
    tech_stack:
      'Recommend a modern, pragmatic Technology Stack (frontend, backend/API, hardware/ML if applicable, storage, deployment) with rationale and alternatives.',
    pitch_assistant:
      'Craft a judge-ready Hackathon & Innovation Pitch script covering hook, problem proof, live demo narrative, architecture, and impact.',
  };

  const fullPrompt = `Tool Task: ${toolPrompts[input.toolId]}
Project / Topic: ${input.projectTitle || 'Untitled Innovation'}
Domain: ${input.domain || 'General'}
Additional Context: ${input.context || 'None'}
User Input:
${input.promptInput}`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: fullPrompt,
      config: {
        systemInstruction:
          'You are NEXUS AI Studio, an innovation engineering copilot. Return clean, structured JSON with concrete, non-generic technical and strategic guidance. Never invent fake statistics.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  note: { type: Type.STRING },
                },
                required: ['title', 'items'],
              },
            },
          },
          required: ['headline', 'summary', 'sections'],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim()) as {
    headline?: string;
    summary?: string;
    sections?: Array<{ title: string; items: string[]; note?: string }>;
  };

  const sections = parsed.sections ?? [];
  const markdownText = [
    `# ${parsed.headline || 'AI Studio Analysis'}`,
    '',
    parsed.summary || '',
    '',
    ...sections.flatMap((s) => [
      `## ${s.title}`,
      ...(s.items ?? []).map((i) => `- ${i}`),
      ...(s.note ? [`Note: ${s.note}`] : []),
      '',
    ]),
  ].join('\n');

  return {
    headline: parsed.headline || 'Analysis Complete',
    summary: parsed.summary || '',
    sections,
    markdownText,
  };
}
