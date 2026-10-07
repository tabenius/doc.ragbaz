---
title: "Draft — Agency, Assistance, and the Person in the Loop"
sidebar_position: 9
description: >
  A working review draft on what changes when machine capability outruns the
  person's ability to check it. Alpha: unpublished, unpeer-reviewed, and wrong
  in places that only review will find.
---

# Agency, Assistance, and the Person in the Loop

**Status: alpha draft.** Written to be argued with. Not reviewed, not cited to a
standard, and deliberately incomplete — the gaps are named rather than papered over.
Everything below is a claim someone should try to break.

## 0. What this draft is for

Agentic systems are arriving faster than the vocabulary for judging them. The
question is not whether a system is capable. It is whether a person remains the
one who decides, and can still tell when they have stopped deciding.

The argument of this draft: **capability and agency are independent, and only one of
them improves automatically.** A system can become arbitrarily capable while the
person's effective say over it goes to zero, and the usual metrics do not notice.

## 1. The measurement problem, stated precisely

An operator needs to know how much of a decision was theirs. That number does not
exist yet, and every proxy for it is contaminated.

Three distinct things get conflated:

| | what it is | what it measures | typical value |
|---|---|---|---|
| **Capability** | can the system do the task | success on held-out work | rising fast |
| **Reliance** | does the person check its output | acceptance rate of suggestions | rising fast |
| **Agency** | did the person decide | attributable authorship of an outcome | *not measured at all* |

Reliance is measurable and is almost always conflated with agency. Acceptance rate
rises for at least three distinct reasons, and only one of them is bad: the system
got better, the person got worse at the task, or the person stopped being in a
position to tell the difference. Only the third is a loss of agency, and it is
invisible in the metric.

### 1.1 The reliability ceiling nobody states out loud

Any trait-like quantity measured with imperfect instrument *r* cannot be predicted
better than *r*², no matter how good the features are. Test–retest reliability of
self-report inventories sits around 0.7–0.8 across well-established instruments. So:

> **max achievable R² ≈ 0.49 – 0.64, using the instrument's own reported reliability.**

This is a hard ceiling on a large family of claims about inferring psychological
attributes from behaviour, and it is routinely ignored in papers that report R² =
0.7 on such a target. Any model claiming high accuracy on a noisy trait label is
mostly reporting the label's noise.

The honest move is to report the ceiling next to the score, or to model the label as
a noisy observation and propagate the uncertainty.

## 2. Why people stop checking: six findings that hold up

Each is old, and each has been replicated often enough to be load-bearing.

**Cognition is capacity-limited, and it is capacity-limited hardest exactly when
stakes are highest.** Miller's magical 7±2 was a misreading of the data; the
corrected figure is roughly 4±1 chunks (Cowan). Under time pressure and high
stakes, working memory shrinks further. An operator who is being timed while
supervising an agent has less capacity for verification at the moment verification
matters most.

**Fitts's law is the most durable result in the interface literature** and survives
essentially every revision since 1954: movement time grows with
log(distance/size). It is the one law that has consistently predicted real
performance across decades of replications. Any supervision interface is, first, a
pointing-and-target problem, and it should be designed as one.

**Recognition beats recall.** Recalling a value is far more expensive than picking
it from a visible set. This is the empirical basis for showing system state rather
than asking the person to remember it, and it holds up.

**Instruction does not transfer.** Clark, Merrill and Gavin's 1955 "snow tire"
study — trainees shown the correct action without explanation transferred far better
than trainees given the explanation. The finding that explanation *interferes*
with later performance was one of the most counter-intuitive in the field and has
replicated robustly.

**Training transfer decays with effect size.** Baldwin and Ford's 1975 meta-analysis
found that training effect sizes in work settings are modest and transfer is worse
than laboratory studies suggest. Design for the transfer, not the lesson.

**Interruptions cost more than their duration, and more for complex tasks.** Work on
interruption resumption reports averages on the order of twenty minutes to regain
context for interrupted workers — and the cost rises with task complexity. Note the
common misquotation: the headline figure is an average for *interrupted* workers and
is much lower for people who habitually batch. The general finding is robust; the
number is a population average that flatters the prepared.

The mechanism behind several of these is **attention residue**: switching tasks
leaves part of attention on the previous one, and the residue persists on the
previous task, not the new one. Supervisors of an agent are, structurally, the most
interruptible people in an organisation.

## 3. Delay of gratification, and what happened to it

Mischel's marshmallow work is the famous part. The less famous part is what came
after, and it mostly **undermined** the popular reading.

- The effect sizes are modest once family background, cognitive ability and
  socioeconomic status are controlled. Marshmallow predicted outcomes already
  predicted by many other things.
- Delay of discounting is a better predictor than the marshmallow task itself, and
  discounting parameters vary with context — a hungry child discounts steeply, which
  is rational, not deficient.
- Delay **aversion** is a distinct and less well-known parameter: choices between an
  immediate negative and a delayed positive are systematically unlike their
  mirror images.

### 3.1 Why this matters for ADHD specifically

ADHD does not simply show *steeper discounting*. It often shows **delay aversion**:
a disproportionate preference for an immediate negative over a delayed positive.
These have different clinical and design implications, and papers that conflate
them produce contradictory results.

Two design consequences follow directly:

1. **Do not design supervision as "will you wait?"** An interface whose main ask is
   patience is testing exactly the parameter that is distorted.
2. **Make the immediate state of the world visible and completable.** If the agent
   is mid-task, the most useful thing the operator can act on is *now*, not a
   prediction about later.

The second is a design argument, not a clinical one: latency to first useful
feedback is probably a bigger lever on oversight quality than any trait
intervention.

## 4. Burnout: what is actually measurable

Burnout is not diagnosable the way a broken component is, which is why it is
routinely under-measured in tools that might cause it.

The most operationally useful result is **effort–recovery imbalance** (Sluiter et
al.): recovery after a shift is the variable that predicts burnout, more reliably
than hours worked or effort expended. The practical consequence is that a system
which shortens tasks but does not change recovery is not addressing burnout.

The Job Demands–Resources model frames it as two independent axes, which matters
because resources can be *added* to lower demands — or added alongside high demands,
which can make things worse by enabling more throughput per person.

**Technostress** is the specific occupational strain of being required to use
technology in ways that conflict with one's judgement. Monitoring systems create it
directly: the thing being measured becomes the thing that cannot be evaded. That is
a genuine ethical objection to "wellness" telemetry, not a hypothetical.

For an agentic workplace the obvious risk is that assistance *raises* demand
(everything the system can do, it can now be asked to do) without raising resources.
Perceived organisational support and decision latitude are the levers that
determine whether higher throughput produces mastery or depletion.

## 5. Gamification as project management: what the evidence supports

This is where I want to be blunt, because the practice is widely sold and thinly
evidenced.

**What is well supported:** Octalysis-style taxonomies are useful for *describing*
what a system does. Self-Determination Theory — autonomy, competence, relatedness —
is a well-supported account of intrinsic motivation, and it predicts which
gamification mechanics are likely to survive contact with a competent user.

**What is not well supported:** that gamification improves project outcomes. The
empirical base is thin, mostly self-report, and heavily confounded with the kind of
work being gamified.

**The specific trap:** Deci, Koestner and Ryan's meta-analysis found that
*expected* tangible rewards undermine intrinsic motivation for tasks that are already
interesting — and that the undermining effect reverses when the task is uninteresting.
Project work that people care about is, by definition, already interesting. So
mechanising project management is aimed at exactly the population for which the
mechanism is predicted to backfire, while feeling productive in the short term.

Points, badges and leaderboards also convert *visible* work into the measured
quantity. On a project with invisible work — research, review, maintenance — this
both mismeasures and actively discourages the work that matters.

The defensible use is narrow: gamification for *optional* surfaces that nobody is
obliged to touch, and never for anything that determines access, priority or
payoff.

## 6. A corrected claim: ego depletion is contested

Self-control-as-a-depleting-resource was for years treated as settled. Large
multi-lab replication efforts failed to reproduce the core effect reliably, including
the load-in-itself manipulation. Anything building on "willpower is a finite tank
that runs out" should be treated as unsupported, and the underlying behaviours —
delay discounting, structured environments, defaults — have better support than the
mechanism that was supposed to unify them.

Including this because it is a mechanism that sounded like physics, and because
design arguments built on it are still circulating.

## 7. What assistance should actually preserve

Synthesis of the above into design positions:

**The person must be able to notice.** Fitts and recognition say this: supervision is
a pointing-and-comparison task, and it fails if state is not visible.

**Verification must be cheaper than trust.** If checking costs more than accepting,
the person will accept. This is a property of the interface, not of the person's
character, and it is the single highest-leverage thing a team can change.

**Make refusals cheap and silent.** If declining an agent's suggestion is expensive
or visible, it will not happen, and no amount of training will fix that.

**Interruptions must be budgeted by the system, not absorbed by the person.** If the
agent acts asynchronously, it should batch its requests. Every asynchronous
interruption spends the operator's recovery budget, and recovery is the variable
that predicts burnout.

**Explanations are a double-edged tool.** Clark et al. found explanation can
*impede* subsequent performance. Progressive disclosure beats a wall of reasoning.

**Completion must be reachable in the present tense.** Not patience, not trust —
something to act on now.

## 8. Open questions this draft does not answer

1. Is agency measurable in a way an operator would accept as meaningful, or is it
   only ever a post-hoc attribution?
2. Does assistance that is *reliable* still reduce agency? If the system is right
   99% of the time, the rational operator stops checking — so reliable assistance
   may *cause* the loss of agency it appears to prevent.
3. What does the person become responsible for, if the system holds the capability?
   The accountability gap is not a solvable engineering problem; it is a
   governance one that engineers will be asked to solve anyway.
4. How much of the "trust calibration" literature survives contact with
   overconfident systems that are wrong in systematic rather than random ways?

## 9. Where to look

Behavioural: Skinner (1938); Ferster & Skinner (1957); Clark, Merrill & Gavin (1955);
Baldwin & Ford (1975); Reason (1990).

Cognitive/interaction: Fitts (1954); Hick & Hyman (1952); Miller (1956), corrected by
Cowan (2001, 2004); Norman (1983, 1988, 2013); Nielsen (1994) and Nielsen & Molich
(1990); Card, Moran & Newell (1983); Sweller (1988); Mark, Gudith & Klocke (2008);
Leroy (2009).

Motivation and gamification: Deci & Ryan (1985); Deci, Koestner & Ryan (1999);
Ryan & Deci (2020); Deterding (2011); Points & Sayre (2010); Hamari, Koivisto &
Sarsa (2014).

Self-regulation and ADHD: Mischel (1972, 1988); Sonuga-Barke (2003); Shimpock et al.
(2010); Strough et al. (2008); the ego-depletion replication efforts.

Burnout: Maslach & Leiter; Bakker & Demerouti; Sluiter et al. (2006); Tarafdar et al.
on technostress.

Psychometrics and the ceiling in §1: the test–retest reliability literature for
well-established five-factor inventories; measurement-error models generally.

## 10. Status

Alpha. Section 8 is the important part and is deliberately the most incomplete.
The claim in §7.2 — that verification must be cheaper than trust — is the one I
would defend hardest and the one most likely to be wrong.