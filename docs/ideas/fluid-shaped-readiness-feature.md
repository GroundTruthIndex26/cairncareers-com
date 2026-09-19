# Feature idea: the "I don't know, but I can find out fast" signal

Status: NOT BUILT. Placement NOT DECIDED (see Open decision below).
Recorded: 2026-09-18. Moved from the deprecated college-entry-aijrc repo on 2026-09-19.

## The idea

Employers hiring entry-level right now want three linked behaviors:

1. Willing to say "I don't know."
2. Able to say "I know I can find out quickly."
3. Able to actually use AI to close the gap fast.

Cairn Careers should surface this on the Premium dashboard and turn it into something a student can evidence, score, and put into interview answers and resume bullets.

## Source

Innovate Carolina (UNC) fall 2026 AI workshop series, branded "Fluid-Shaped" (tm), tagline "skilled on demand, not skilled in advance." Brooke watched the event 1 teaser and took the idea from it.

- Event 1: Land Your First Fluid-Shaped AI-Ready Role, Sept 29 2026, Innovate Carolina Junction, Chapel Hill. Uses an unnamed "AI Job Assessment tool" that produces a "Readiness Snapshot" and an "AI Skills Checklist."
- Teaser video: https://youtu.be/Z2MBwxKSdWQ
- Eventbrite: https://www.eventbrite.com/e/land-your-first-fluid-shapedtm-ai-ready-role-tickets-1998488799798
- Research to date: no facilitator, vendor, or trademark record found. Lovable is named only as the build tool for event 3 (an inbox agent). Innovate Carolina contact quoted in press: Sheryl Waddell.

## Why it fits the existing dashboard

The dashboard already has a readiness score, an interview page built around the "won't AI just do this job" answer, and a resume page. The three behaviors above are interview-answer and resume-bullet material, and they can be evidenced with a record the engine already understands: an evidence record tied to a durable task.

Proposed underlying mechanic: a "learned on demand" evidence record. Fields on top of a normal evidence record:

- gap admitted (what the student did not know)
- start and end timestamps (how fast it was closed)
- AI-assisted flag (which tool, how used)
- result shipped (what it produced)

This is the one thing the task-level engine can do that a mindset workshop cannot: score it instead of just telling people to be that way.

## Open decision

Two placements under consideration. Brooke has not chosen.

(a) Fourth headline score on the dashboard, alongside coverage, exposure, and readiness.
    Pro: visible, differentiating. Con: a fourth number a student has to understand without explanation.

(b) Sub-score inside readiness that feeds the interview and resume pages.
    Pro: no new concept to explain; can be promoted to (a) later. Con: less visible as a selling point.

Deciding question: would a student understand a fourth number without explanation? If not, (b) is the safer default.

## Where it would be stored

Nothing exists for this in Supabase yet. The Cairn Careers project (`kxeqihuvmiurtksftfuj`) currently holds only `launch_notifications` and `contact_messages`. A real build would need new tables for evidence records; none should be created until the placement decision is made.

## Not yet thought through

- Rollout order (sample dashboard first, or wait for the real product build)
- How the sample persona (Maya Rivera) would show this with invented data
- Whether the AI Skills Checklist idea from the workshop is worth adapting as a resume/LinkedIn export
