// Only available outside production — used by Playwright visual regression tests
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { SampleBreakdown } from '@/components/leaderboard/SampleBreakdown';
import { FuzzyReviewPanel } from '@/components/scoring/FuzzyReviewPanel';
import { FlightProgressBar } from '@/components/tasting/FlightProgressBar';
import { BlindCard } from '@/components/blind/BlindCard';
import { FixtureInputs } from './FixtureInputs';

export default function TestFixturesPage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  // ── Shared mock players ────────────────────────────────────────────────────
  const PLAYERS = [
    { id: 'p1', discord_username: 'barrel_nerd',    discord_avatar_url: null },
    { id: 'p2', discord_username: 'mashbill_mike',  discord_avatar_url: null },
    { id: 'p3', discord_username: 'cask_collector', discord_avatar_url: null },
  ];

  const LEADERBOARD_ENTRIES = [
    { profile: PLAYERS[0]!, total: 47, nose: 18, taste: 29, pending: 0 },
    { profile: PLAYERS[1]!, total: 33, nose: 12, taste: 21, pending: 1 },
    { profile: PLAYERS[2]!, total: 21, nose:  8, taste: 13, pending: 0 },
  ];

  // ── Sample breakdown mock data ─────────────────────────────────────────────
  const BREAKDOWN_SAMPLES = [
    {
      id: 's1', label: 'A',
      attributes: [
        { questionId: 'q1', attrId: 'a1', name: 'distillery',  correctValue: "Maker's Mark", round: 'taste' as const, scoringType: 'exact'   as const },
        { questionId: 'q2', attrId: 'a2', name: 'age',         correctValue: '6',             round: 'taste' as const, scoringType: 'bracket' as const },
        { questionId: 'q3', attrId: 'a3', name: 'proof',       correctValue: '90',            round: 'taste' as const, scoringType: 'bracket' as const },
        { questionId: 'q4', attrId: 'a4', name: 'nose notes',  correctValue: 'caramel, oak',  round: 'taste' as const, scoringType: 'none'    as const },
      ],
    },
    {
      id: 's2', label: 'B',
      attributes: [
        { questionId: 'q5', attrId: 'a5', name: 'distillery',  correctValue: 'Buffalo Trace', round: 'taste' as const, scoringType: 'exact'   as const },
        { questionId: 'q6', attrId: 'a6', name: 'age',         correctValue: '8',             round: 'taste' as const, scoringType: 'bracket' as const },
        { questionId: 'q7', attrId: 'a7', name: 'proof',       correctValue: '90',            round: 'taste' as const, scoringType: 'bracket' as const },
      ],
    },
  ];

  const ANSWER_MAP: Record<string, Record<string, { value: string | null; points: number | null; fuzzyPending: boolean; answerId: string; hostApproved: boolean | null }>> = {
    p1: {
      q1: { value: "Maker's Mark", points: 3,    fuzzyPending: false, answerId: 'a1',  hostApproved: null },
      q2: { value: '6',            points: 5,    fuzzyPending: false, answerId: 'a2',  hostApproved: null },
      q3: { value: '96',           points: 3,    fuzzyPending: false, answerId: 'a3',  hostApproved: null },
      q4: { value: 'sweet, oaky',  points: null, fuzzyPending: false, answerId: 'a4',  hostApproved: null },
      q5: { value: 'Buffalo Trace',points: 3,    fuzzyPending: false, answerId: 'a5',  hostApproved: null },
      q6: { value: '10',           points: 2,    fuzzyPending: false, answerId: 'a6',  hostApproved: null },
      q7: { value: '90',           points: 5,    fuzzyPending: false, answerId: 'a7',  hostApproved: null },
    },
    p2: {
      q1: { value: 'Wild Turkey',  points: 0,    fuzzyPending: false, answerId: 'a8',  hostApproved: null },
      q2: { value: '8',            points: 3,    fuzzyPending: false, answerId: 'a9',  hostApproved: null },
      q3: { value: '90',           points: 5,    fuzzyPending: false, answerId: 'a10', hostApproved: null },
      q4: { value: 'fruity',       points: null, fuzzyPending: false, answerId: 'a11', hostApproved: null },
      q5: { value: 'Evan Williams',points: 0,    fuzzyPending: false, answerId: 'a12', hostApproved: null },
      q6: { value: '8',            points: 5,    fuzzyPending: false, answerId: 'a13', hostApproved: null },
      q7: { value: '86',           points: 3,    fuzzyPending: false, answerId: 'a14', hostApproved: null },
    },
    p3: {
      q1: { value: "Maker's Mar",  points: null, fuzzyPending: true,  answerId: 'a15', hostApproved: null },
      q2: { value: '10',           points: 1,    fuzzyPending: false, answerId: 'a16', hostApproved: null },
      q3: { value: null,           points: null, fuzzyPending: false, answerId: 'a17', hostApproved: null },
      q4: { value: '',             points: null, fuzzyPending: false, answerId: 'a18', hostApproved: null },
      // Sample B not submitted for p3
    },
  };

  // ── Fuzzy review mock data ─────────────────────────────────────────────────
  const FUZZY_ANSWERS = [
    {
      id: 'fa1',
      value: "Maker's Mar",
      host_approved: null,
      user_id: 'p3',
      profile: { discord_username: 'cask_collector' },
      question: {
        round: 'taste',
        attribute: { name: 'distillery', value: "Maker's Mark", sample: { label: 'A' } },
      },
    },
    {
      id: 'fa2',
      value: 'Bufalo Trace',
      host_approved: null,
      user_id: 'p2',
      profile: { discord_username: 'mashbill_mike' },
      question: {
        round: 'taste',
        attribute: { name: 'distillery', value: 'Buffalo Trace', sample: { label: 'B' } },
      },
    },
  ];

  // ── Flight progress mock data ─────────────────────────────────────────────
  const FLIGHT_SAMPLES = [
    { id: 'fs1', label: 'A', display_order: 0 },
    { id: 'fs2', label: 'B', display_order: 1 },
    { id: 'fs3', label: 'C', display_order: 2 },
    { id: 'fs4', label: 'D', display_order: 3 },
  ];

  // ── Blind card mock data ──────────────────────────────────────────────────
  const BLIND_MEMBERS = [
    { user_id: 'p1', role: 'host',        profile: PLAYERS[0]! },
    { user_id: 'p2', role: 'participant', profile: PLAYERS[1]! },
    { user_id: 'p3', role: 'participant', profile: PLAYERS[2]! },
  ];

  const BLIND_BASE = {
    samples: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
    blind_members: BLIND_MEMBERS,
    nosing_enabled: false,
    created_at: new Date().toISOString(),
    host: PLAYERS[0]!,
  };

  return (
    <div className="p-8 space-y-16 min-h-screen max-w-5xl">

      {/* ── Existing primitives ─────────────────────────────────────────── */}

      <section id="section-button">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Button</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center mt-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section id="section-badge">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Badge</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="default">Default</Badge>
          <Badge variant="green">Green</Badge>
          <Badge variant="amber">Amber</Badge>
          <Badge variant="grey">Grey</Badge>
          <Badge variant="blue">Blue</Badge>
        </div>
      </section>

      <section id="section-input">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Input</h2>
        <div className="flex flex-col gap-3 max-w-xs">
          <Input placeholder="Placeholder text" />
          <Input defaultValue="Filled value" />
          <Input disabled placeholder="Disabled" />
        </div>
      </section>

      {/* ── Leaderboard ────────────────────────────────────────────────── */}

      <section id="section-leaderboard">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Leaderboard — Taste only</h2>
        <div className="max-w-lg">
          <Leaderboard
            entries={LEADERBOARD_ENTRIES}
            currentUserId="p2"
            nosingEnabled={false}
          />
        </div>
      </section>

      <section id="section-leaderboard-nosing">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Leaderboard — Nose + Taste</h2>
        <div className="max-w-lg">
          <Leaderboard
            entries={LEADERBOARD_ENTRIES}
            currentUserId="p1"
            nosingEnabled={true}
          />
        </div>
      </section>

      <section id="section-leaderboard-empty">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Leaderboard — Empty</h2>
        <div className="max-w-lg">
          <Leaderboard entries={[]} currentUserId="p1" nosingEnabled={false} />
        </div>
      </section>

      {/* ── Sample Breakdown ───────────────────────────────────────────── */}

      <section id="section-sample-breakdown">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Sample Breakdown</h2>
        <SampleBreakdown
          samples={BREAKDOWN_SAMPLES}
          players={[
            { id: 'p1', discord_username: 'barrel_nerd' },
            { id: 'p2', discord_username: 'mashbill_mike' },
            { id: 'p3', discord_username: 'cask_collector' },
          ]}
          answerMap={ANSWER_MAP}
          nosingEnabled={false}
        />
      </section>

      {/* ── Fuzzy Review Panel ─────────────────────────────────────────── */}

      <section id="section-fuzzy-review">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Fuzzy Review — Pending items</h2>
        <div className="max-w-lg">
          <FuzzyReviewPanel blindId="test-fixture" answers={FUZZY_ANSWERS as any} />
        </div>
      </section>

      <section id="section-fuzzy-review-empty">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Fuzzy Review — Empty</h2>
        <div className="max-w-lg">
          <FuzzyReviewPanel blindId="test-fixture" answers={[]} />
        </div>
      </section>

      {/* ── Flight Progress Bar ────────────────────────────────────────── */}

      <section id="section-flight-progress">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Flight Progress Bar</h2>
        <div className="space-y-8 max-w-md">
          <div>
            <p className="text-xs text-[#999] mb-3">Taste only — 2 done, 1 current, 1 locked</p>
            <FlightProgressBar
              samples={FLIGHT_SAMPLES}
              currentSampleId="fs3"
              revealedSampleIds={new Set(['fs1', 'fs2'])}
              nosingEnabled={false}
            />
          </div>
          <div>
            <p className="text-xs text-[#999] mb-3">Nose + Taste — 1 done, 1 nosed, 1 current, 1 locked</p>
            <FlightProgressBar
              samples={FLIGHT_SAMPLES}
              currentSampleId="fs3"
              revealedSampleIds={new Set(['fs1'])}
              nosedSampleIds={new Set(['fs2'])}
              nosingEnabled={true}
            />
          </div>
          <div>
            <p className="text-xs text-[#999] mb-3">All complete</p>
            <FlightProgressBar
              samples={FLIGHT_SAMPLES}
              currentSampleId="fs4"
              revealedSampleIds={new Set(['fs1', 'fs2', 'fs3', 'fs4'])}
              nosingEnabled={false}
            />
          </div>
        </div>
      </section>

      {/* ── Blind Card ────────────────────────────────────────────────── */}

      <section id="section-blind-card">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-smoke mb-4">Blind Card</h2>
        <div className="max-w-lg space-y-3">
          <BlindCard
            blind={{ id: 'b1', name: 'Spring Bourbon Flight', status: 'active', ...BLIND_BASE, group: null }}
            currentUserId="p1"
          />
          <BlindCard
            blind={{ id: 'b2', name: 'Saturday Night Rye', status: 'setup', ...BLIND_BASE, group: { name: 'BBC Dev', icon_url: null } }}
            currentUserId="p2"
          />
          <BlindCard
            blind={{ id: 'b3', name: 'Holiday Scotch Tasting', status: 'complete', ...BLIND_BASE, nosing_enabled: true, group: { name: 'BBC Dev', icon_url: null } }}
            currentUserId="p3"
          />
        </div>
      </section>

      {/* ── Question Inputs (client component) ────────────────────────── */}

      <FixtureInputs />

    </div>
  );
}
