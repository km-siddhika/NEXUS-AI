import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  ActivityLog,
  AppNotification,
  GeneratedReport,
  Project,
  ProjectComment,
  ProjectTask,
  Team,
  User,
  UserRole,
} from '../src/types/nexus.ts';

export interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface NexusDatabase {
  users: StoredUser[];
  sessions: SessionRecord[];
  projects: Project[];
  tasks: ProjectTask[];
  teams: Team[];
  comments: ProjectComment[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  reports: GeneratedReport[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'nexus-db.json');

const EMPTY_DB: NexusDatabase = {
  users: [],
  sessions: [],
  projects: [],
  tasks: [],
  teams: [],
  comments: [],
  notifications: [],
  activityLogs: [],
  reports: [],
};

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function toPublicUser(u: StoredUser): User {
  const { passwordHash: _ph, passwordSalt: _ps, ...rest } = u;
  return rest;
}

export function readDb(): NexusDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf-8');
    return structuredClone(EMPTY_DB);
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<NexusDatabase>;
    return {
      users: parsed.users ?? [],
      sessions: parsed.sessions ?? [],
      projects: parsed.projects ?? [],
      tasks: parsed.tasks ?? [],
      teams: parsed.teams ?? [],
      comments: parsed.comments ?? [],
      notifications: parsed.notifications ?? [],
      activityLogs: parsed.activityLogs ?? [],
      reports: parsed.reports ?? [],
    };
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

export function writeDb(db: NexusDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NX';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function seedDemoWorkspaceForUser(db: NexusDatabase, user: StoredUser): void {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400_000).toISOString();
  const daysAhead = (d: number) => new Date(now.getTime() + d * 86400_000).toISOString().slice(0, 10);

  const p1Id = createId('proj');
  const p2Id = createId('proj');
  const p3Id = createId('proj');
  const teamId = createId('team');

  const p1Sol1 = createId('sol');
  const p1Sol2 = createId('sol');
  const p1Sol3 = createId('sol');

  const projects: Project[] = [
    {
      id: p1Id,
      ownerId: user.id,
      teamId,
      title: 'Urban Heat-Island Microclimate Mesh',
      domain: 'Environment',
      status: 'In Progress',
      archived: false,
      bookmarked: true,
      description:
        'Low-cost solar LoRaWAN sensor nodes paired with shade-canopy routing to alert vulnerable neighborhoods before dangerous urban heat peaks.',
      targetAudience: 'Municipal climate planners and elderly residents in dense urban wards',
      supportingInfo: 'Pilot ward shows 4.2°C variance between shaded parks and asphalt transit corridors.',
      coverTheme: 'cyan',
      progress: 68,
      selectedSolutionId: p1Sol1,
      problemAnalysis: {
        summary:
          'Dense urban districts lack hyper-local thermal telemetry, causing city cooling centers and shade transit advisories to activate hours after street-level heat stress peaks.',
        refinedStatement:
          'How might municipal health teams capture block-level wet-bulb temperature gradients in real time to dispatch mobile cooling resources before heat-related hospitalizations spike?',
        rootCauses: [
          'Weather stations sit at airports miles away from asphalt-heavy residential corridors',
          'Commercial microclimate sensors cost $1,200+ per node, preventing block-level coverage',
          'Cooling center alerts rely on static daily forecasts rather than real-time pedestrian exposure',
        ],
        stakeholders: [
          'Older adults and outdoor transit commuters',
          'Municipal public health & emergency response coordinators',
          'Urban forestry and streetscape planning departments',
        ],
        currentChallenges: [
          'Battery degradation inside unshaded solar enclosures above 45°C',
          'Zero-connectivity dead zones along concrete underpasses',
          'Communicating actionable cool-route alerts without smartphone dependency',
        ],
        possibleImpact: [
          'Earlier activation of neighborhood cooling hubs during peak afternoon humidity',
          'Empirical street-level heat maps to prioritize urban tree canopy funding',
        ],
        researchQuestions: [
          'What node spacing (250m vs 500m) yields reliable interpolation across mixed-height blocks?',
          'How can community pharmacies act as passive LoRaWAN gateway hosts?',
        ],
        missingInformation: [
          'Historical ward-level EMS heat dispatch timestamps for baseline validation',
          'Local municipal permitting rules for streetlight pole mounting',
        ],
        opportunities: [
          'Combine passive radiative-cooling enclosures with sub-GHz mesh relays',
          'Publish open GeoJSON heat feeds for local transit routing apps',
        ],
        updatedAt: daysAgo(1),
      },
      solutions: [
        {
          id: p1Sol1,
          name: 'Solar LoRaWAN Mesh + Community Pharmacy Gateways',
          shortDescription:
            'Self-powered ESP32-S3 + SHT45 sensor pucks mounted on transit shelters relaying hourly thermal deltas through neighborhood pharmacy gateways.',
          workingPrinciple:
            'Sensors wake every 5 minutes, sample temperature, humidity, and solar irradiance, and transmit compressed 18-byte payloads via LoRaWAN to a cloud ingestion pipeline.',
          requiredTechnologies: ['ESP32-S3', 'SX1262 LoRa', 'SHT45 Sensor', 'TimescaleDB', 'MapLibre GL'],
          estimatedComplexity: 'Medium',
          potentialImpact: 'Transformative',
          advantages: [
            'Under $38 bill of materials per street node in small batches',
            'Zero cellular SIM fees via community-hosted gateways',
            'Operates up to 14 days on LiFePO4 reserve without direct sun',
          ],
          limitations: [
            'Requires mounting permission from transit authority or local storefronts',
            'Line-of-sight attenuation in high-rise canyons',
          ],
          risks: [
            'Enclosure thermal drift if radiation shield airflow is obstructed',
            'Vandalism if mounted below 3 meters',
          ],
          isEstimate: true,
        },
        {
          id: p1Sol2,
          name: 'Fleet-Mounted Transit Bus Thermal Probes',
          shortDescription:
            'Attach ruggedized thermal-GPS loggers to municipal buses to map street corridors dynamically throughout service hours.',
          workingPrinciple:
            'Buses sweep major arterials every 15 minutes, uploading geo-tagged temperature traces over existing onboard cellular routers.',
          requiredTechnologies: ['CAN-bus Logger', 'PT1000 Probe', 'PostGIS', 'MQTT'],
          estimatedComplexity: 'Low',
          potentialImpact: 'High',
          advantages: [
            'Instant multi-ward spatial coverage without fixed pole permits',
            'Direct access to reliable 24V vehicle power',
          ],
          limitations: [
            'Measures roadway asphalt corridors rather than residential courtyards',
            'Engine heat skews readings at low speeds or idling stops',
          ],
          risks: [
            'Transit union and fleet maintenance scheduling delays',
          ],
          isEstimate: true,
        },
        {
          id: p1Sol3,
          name: 'Satellite LST + Citizen SMS Micro-Survey',
          shortDescription:
            'Downscale Landsat/ECOSTRESS thermal imagery with targeted SMS comfort check-ins from community volunteers.',
          workingPrinciple:
            'Combines morning satellite land-surface passes with regression downscaling and hyper-local human comfort reports.',
          requiredTechnologies: ['Google Earth Engine', 'Python Rasterio', 'Twilio SMS', 'FastAPI'],
          estimatedComplexity: 'Low',
          potentialImpact: 'Moderate',
          advantages: [
            'Zero hardware manufacturing or maintenance overhead',
            'Rapid deployment within a single hackathon weekend',
          ],
          limitations: [
            'Cloud cover blocks thermal satellite passes on humid days',
            'Land surface temperature differs significantly from shaded air temperature',
          ],
          risks: [
            'Volunteer survey fatigue during multi-day heat waves',
          ],
          isEstimate: true,
        },
      ],
      roadmapPhases: [
        {
          id: createId('phase'),
          title: 'Phase 1: Enclosure & Sensor Calibration',
          duration: 'Weeks 1–2',
          objective: 'Benchmark SHT45 accuracy inside a passive Stevenson radiation shield against reference lab probes.',
          milestones: ['3D-print louvered PETG radiation shield', 'Run 48-hour rooftop drift calibration'],
          dependencies: ['BOM hardware procurement'],
          testingRequirements: ['±0.3°C variance check against NIST-traceable thermometer'],
          deliverables: ['Calibrated firmware image', 'CAD enclosure STL files'],
        },
        {
          id: createId('phase'),
          title: 'Phase 2: Gateway Mesh & Live Heatmap',
          duration: 'Weeks 3–4',
          objective: 'Connect 5 pilot nodes to a ChirpStack LoRaWAN server and render ward-level heat advisories.',
          milestones: ['Deploy pharmacy gateway node', 'Launch live corridor thermal dashboard'],
          dependencies: ['Phase 1 calibrated hardware'],
          testingRequirements: ['Packet delivery rate > 96% across 600m urban blocks'],
          deliverables: ['Ingestion API', 'Public ward heat advisory map'],
        },
      ],
      pitch: {
        projectTitle: 'Urban Heat-Island Microclimate Mesh',
        problemStatement:
          'Citywide heat warnings rely on airport weather stations miles away, leaving vulnerable neighborhoods blind to 4°C+ street-level thermal spikes.',
        existingLimitations:
          'Commercial environmental stations cost over $1,200 per unit and require cellular contracts, making block-by-block deployment financially impossible.',
        proposedSolution:
          'A $38 solar-powered LoRaWAN sensor mesh hosted on neighborhood storefronts, streaming live wet-bulb heat alerts and cool-route maps.',
        innovation:
          'Combines ultra-low-power radiative shielding with zero-fee community gateways and automated cooling-center dispatch triggers.',
        technologyStack: 'ESP32-S3, SX1262 LoRaWAN, SHT45, TimescaleDB, MapLibre GL, React + TypeScript',
        implementationPlan:
          'Phase 1 calibrates 5 pilot nodes; Phase 2 partners with 3 community pharmacies for gateway hosting; Phase 3 integrates municipal SMS alerts.',
        expectedImpact:
          'Gives city health teams 2–3 hours of earlier intervention window and empirical data for targeted shade-tree planting.',
        futureScope:
          'Expand telemetry to particulate air-quality indexing (PM2.5) for wildfire smoke events.',
        updatedAt: daysAgo(1),
      },
      createdAt: daysAgo(14),
      updatedAt: daysAgo(1),
    },
    {
      id: p2Id,
      ownerId: user.id,
      title: 'Tactile STEM Lab Companion for Low-Vision Learners',
      domain: 'Accessibility',
      status: 'Planning',
      archived: false,
      bookmarked: false,
      description:
        'Audio-guided benchtop electronics & chemistry assistant using real-time camera verification and spoken spatial cues for blind and low-vision students.',
      targetAudience: 'High-school and undergraduate STEM students with visual impairments',
      supportingInfo: 'Built with university disability resource center advisors.',
      coverTheme: 'lavender',
      progress: 35,
      createdAt: daysAgo(9),
      updatedAt: daysAgo(2),
    },
    {
      id: p3Id,
      ownerId: user.id,
      title: 'Smallholder Soil Moisture & Drip Automation',
      domain: 'Agriculture',
      status: 'Completed',
      archived: false,
      bookmarked: true,
      description:
        'Capacitive root-zone moisture sensing and gravity-fed solenoid valve scheduler designed to cut smallholder irrigation water waste.',
      targetAudience: 'Small-acreage vegetable cooperatives in semi-arid regions',
      supportingInfo: 'Field-tested across 2 cooperative greenhouses over a 6-week growing cycle.',
      coverTheme: 'coral',
      progress: 100,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(4),
    },
  ];

  const tasks: ProjectTask[] = [
    {
      id: createId('task'),
      projectId: p1Id,
      ownerId: user.id,
      title: 'Validate SHT45 radiation shield airflow',
      description: 'Compare shaded vs direct-sun enclosure readings over 48 hours on campus roof.',
      status: 'Done',
      priority: 'High',
      deadline: daysAhead(2),
      assigneeName: user.name,
      createdAt: daysAgo(6),
      updatedAt: daysAgo(2),
    },
    {
      id: createId('task'),
      projectId: p1Id,
      ownerId: user.id,
      title: 'Configure ChirpStack LoRaWAN payload decoder',
      description: 'Write compact binary decoder for 18-byte temperature, RH, and battery voltage frames.',
      status: 'In Progress',
      priority: 'High',
      deadline: daysAhead(5),
      assigneeName: 'Maya Lin',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
    {
      id: createId('task'),
      projectId: p1Id,
      ownerId: user.id,
      title: 'Draft municipal streetlight mounting brief',
      description: 'Prepare 2-page safety and non-invasive zip-tie clamp spec for city review.',
      status: 'Todo',
      priority: 'Medium',
      deadline: daysAhead(9),
      assigneeName: user.name,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: createId('task'),
      projectId: p2Id,
      ownerId: user.id,
      title: 'Interview 4 accessibility lab instructors',
      description: 'Document top 5 breadboard & multimeter verification bottlenecks during lab hours.',
      status: 'In Progress',
      priority: 'High',
      deadline: daysAhead(4),
      assigneeName: user.name,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(2),
    },
    {
      id: createId('task'),
      projectId: p3Id,
      ownerId: user.id,
      title: 'Publish open-source PCB & valve BOM',
      description: 'Finalize KiCad schematics and waterproof silicone potting instructions.',
      status: 'Done',
      priority: 'Medium',
      deadline: daysAhead(-2),
      assigneeName: user.name,
      createdAt: daysAgo(12),
      updatedAt: daysAgo(4),
    },
  ];

  const teams: Team[] = [
    {
      id: teamId,
      ownerId: user.id,
      name: 'Civic Climate Lab',
      description: 'Interdisciplinary hardware + urban informatics squad tackling extreme urban heat.',
      members: [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'Lead',
          status: 'Active',
          joinedAt: daysAgo(14),
        },
        {
          id: createId('mem'),
          name: 'Maya Lin',
          email: 'maya.lin@example.edu',
          role: 'Engineer',
          status: 'Active',
          joinedAt: daysAgo(12),
        },
        {
          id: createId('mem'),
          name: 'Arjun Patel',
          email: 'arjun.p@example.edu',
          role: 'Researcher',
          status: 'Active',
          joinedAt: daysAgo(10),
        },
      ],
      projectIds: [p1Id],
      createdAt: daysAgo(14),
      updatedAt: daysAgo(1),
    },
  ];

  const comments: ProjectComment[] = [
    {
      id: createId('cmt'),
      projectId: p1Id,
      teamId,
      authorId: user.id,
      authorName: user.name,
      authorRole: 'Lead',
      content: 'Rooftop shield test held within 0.25°C of reference probe even at 2 PM peak sun.',
      createdAt: daysAgo(2),
    },
    {
      id: createId('cmt'),
      projectId: p1Id,
      teamId,
      authorId: 'mem_maya',
      authorName: 'Maya Lin',
      authorRole: 'Engineer',
      content: 'Payload decoder is wired up. Next step is confirming gateway range past the concrete overpass.',
      createdAt: daysAgo(1),
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: createId('notif'),
      userId: user.id,
      title: 'Solution direction selected',
      message: 'Solar LoRaWAN Mesh set as primary direction for Urban Heat-Island Microclimate Mesh.',
      type: 'project',
      read: false,
      link: `/app/projects/${p1Id}`,
      createdAt: daysAgo(1),
    },
    {
      id: createId('notif'),
      userId: user.id,
      title: 'Upcoming task deadline',
      message: 'Configure ChirpStack LoRaWAN payload decoder is due in 5 days.',
      type: 'task',
      read: false,
      link: `/app/projects/${p1Id}`,
      createdAt: daysAgo(1),
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: createId('act'),
      userId: user.id,
      projectId: p1Id,
      action: 'Updated problem brief & pitch outline',
      entityTitle: 'Urban Heat-Island Microclimate Mesh',
      category: 'project',
      createdAt: daysAgo(1),
    },
    {
      id: createId('act'),
      userId: user.id,
      projectId: p1Id,
      action: 'Completed calibration task',
      entityTitle: 'Validate SHT45 radiation shield airflow',
      category: 'task',
      createdAt: daysAgo(2),
    },
    {
      id: createId('act'),
      userId: user.id,
      projectId: p3Id,
      action: 'Marked project completed',
      entityTitle: 'Smallholder Soil Moisture & Drip Automation',
      category: 'project',
      createdAt: daysAgo(4),
    },
  ];

  const reports: GeneratedReport[] = [
    {
      id: createId('rep'),
      userId: user.id,
      projectId: p1Id,
      projectTitle: 'Urban Heat-Island Microclimate Mesh',
      reportType: 'Executive Summary',
      title: 'Executive Summary — Urban Heat-Island Microclimate Mesh',
      sections: [
        {
          heading: 'Problem Context',
          content:
            'Airport weather readings routinely underestimate asphalt-corridor street temperatures by 3–5°C, delaying municipal cooling center activations.',
        },
        {
          heading: 'Proposed Architecture',
          content:
            'Deploy $38 solar-powered ESP32-S3 LoRaWAN nodes inside passive radiation shields, routing hyper-local wet-bulb telemetry through community pharmacy gateways.',
        },
        {
          heading: 'Next Milestone',
          content:
            'Finalize 5-node pilot deployment and integrate live GeoJSON heat advisories with local transit routing.',
        },
      ],
      createdAt: daysAgo(2),
    },
  ];

  db.projects.push(...projects);
  db.tasks.push(...tasks);
  db.teams.push(...teams);
  db.comments.push(...comments);
  db.notifications.push(...notifications);
  db.activityLogs.push(...activityLogs);
  db.reports.push(...reports);
}

export function createUserRecord(params: {
  name: string;
  email: string;
  password: string;
  institution?: string;
  role?: UserRole;
  isDemo?: boolean;
}): StoredUser {
  const { hash, salt } = hashPassword(params.password);
  const colors = ['#7955E8', '#F47BA7', '#FF895E', '#63CBEA'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return {
    id: createId('usr'),
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    institution: (params.institution ?? '').trim(),
    role: params.role ?? 'Innovator',
    avatarColor: color,
    avatarInitials: getInitials(params.name),
    themePreference: 'light',
    notificationsEnabled: true,
    aiDepthPreference: 'balanced',
    isDemo: Boolean(params.isDemo),
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
}
