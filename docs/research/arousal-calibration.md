# Arousal calibration

### A chapter on moderate arousal, discriminating good stress from bad, and
### calibrating yourself or your agent

*For peers, caregivers, and anyone who has ever tried to fix a bad mood and made
the day worse.*

---

## 0. The claim in one paragraph

Performance and flexible thinking follow an **inverted U** in arousal. Too little and
you are dull; too much and you are rigid, narrow, and slow. Moderate is best — but
only for *hard, novel, ill-structured* work. For *routine, procedural, well-learned*
work the curve is flat or even slopes the other way: you want to be calm, because
calm is what lets you execute something you already know without improvising badly.

So "manage your stress" is the wrong instruction. The instruction is **"move your
arousal toward the target that this particular task has."** Those targets differ, the
same person needs different ones on different days, and getting this wrong is
routine and expensive.

Everything below is about the second half: how to tell which target you are aiming at,
how to tell whether your current arousal is the helpful kind or the harmful kind, and
how to do this for a human or an agent without talking yourself into something stupid.

---

## 1. Where the inverted U comes from, and what is actually solid

Yerkes and Dodson, 1908: arousal rises with difficulty or motivation, and performance
peaks at a moderate point before declining. The shape has held up as a *heuristic* for
a century. But three caveats matter more than the shape, and most write-ups of this
literature skip them.

**It is a heuristic, not a law.** Some task types improve monotonically with arousal
until near the point of impairment. The inverted U is common, not universal. Anyone
telling you it always holds is overselling it.

**The optimal point moves with task difficulty.** Harder tasks have peaks at lower
arousal. The peak is not a personality trait; it is a property of the *task*, indexed
by the person.

**Individual differences are large.** The between-person spread in optimal arousal is
comparable to or larger than the effect being measured. A target that is right on
average can be badly wrong for an individual, which is why any prescription expressed
as "everyone should aim for moderate" is close to useless.

What *is* solid, and what this chapter rests on:

- **Under high stakes and time pressure, working memory shrinks.** This is the
  mechanism that makes over-arousal costly: you lose the capacity to hold the problem
  in mind, and the problem is what you are holding.
- **Under-arousal has a different signature.** It produces boredom and drift rather
  than error, and it is much less damaging than over-arousal.
- **Asymmetry in the penalty follows from the first two points**, and it is the single
  most useful structural fact in this chapter: *over-arousal is punished harder than
  under-arousal is.* Over-arousal makes you wrong; under-arousal mostly makes you
  slow and unhappy. So almost every practical rule should be asymmetric.

---

## 2. The discriminator — what shape is it, actually?

This is the technical heart, and the answer is **not "a sigmoid."**

### 2.1 What has to be discriminated

Two things raise arousal and they are not remotely equivalent:

| | Source | What it feels like | Effect |
|---|---|---|---|
| **Task-generated** | the work itself | absorbed, alert, wanting more | helps ill-structured work |
| **Context-generated** | an out-of-context event, unassignable threat | intrusive, narrowing, wanting out | hurts everything |

Same outward signal. Opposite sign of effect. If you cannot tell them apart, any
arousal intervention is a coin flip.

### 2.2 The discriminator is a derivative, not a level

The discriminator is not "how high is arousal." It is:

> **Does my appetite for this task go up or down as arousal rises?**

- Appetite **rises** with arousal → task-generated → functional. Do not calm this.
- Appetite **falls** while arousal rises → context-generated → load. Reduce this.

Let `p(a)` be appetite for the task at arousal `a`, and `D = dp/da`. The discriminator
is the **sign of `D`**. This is why "measure the stress level" is insufficient: a
stress level cannot distinguish the two kinds, and a derivative can.

Operationally, appetite is observable without instruments:

- Do you want to keep going?
- Is the difficulty interesting or aversive?
- Does your mind generate more ideas, or fewer and more repetitive ones?
- Are you curious about the next step, or are you bracing for it?

Those four are cheap to answer and they carry most of the signal. A wearable does not.

### 2.3 Why a linear function cannot work

`p(a) = a`. Then `D = 1` always. Appetite only ever rises with arousal, so nothing is
ever classified as load, and the model is structurally incapable of noticing that a
person has gone past the point of being useful. Linear is not a simplification here;
it is a category error, because it cannot represent the phenomenon.

### 2.4 Why a plain sigmoid is not enough either

The logistic `σ(z) = 1/(1+e^-z)` is the natural, defensible choice for a *probability*,
and `σ` is monotone. Its derivative is therefore always positive. So a single logistic
in arousal says appetite rises forever, which is false.

The sigmoid *is* useful — but for a different job. Use it to turn a **signed deviation
from an estimated target** into a decision probability:

```
P(should activate) = σ( (θ − a) / τ )
P(should calm)     = σ( (a − θ) / τ )
```

where `θ` is the target arousal and `τ` the sharpness. This separates two things that
a single logistic otherwise conflates: **where the peak is** (`θ`) and **how steeply
performance falls off** (`τ`). You want to estimate them separately, because they mean
different things and they behave differently — `θ` moves with the task, `τ` is more
like a person.

### 2.5 The shape that actually fits: a bump on signed deviation

The inverted U is a **peak**, and no monotone link function can express a peak. You
need one of:

```
(a)  Gaussian bump            p(a) = exp( −½ · ((a − θ)/τ)² )
(b)  Logistic window           p(a) = σ((a−θ)/τ) · σ((θ'−a)/τ),  θ < θ'
(c)  Second-order term         p(a) = 1 − ((a − θ)/τ)²
(d)  Asymmetric bump           (a) with different τ below and above θ
```

**Recommendation: (d), the asymmetric Gaussian bump, as the default, with (b) if you
need hard zeros.**

```js
// Appetite for the task, given arousal a, target θ, and widths τ₋ / τ₊.
const appetite = (a, theta, tauBelow = 0.18, tauAbove = 0.10) => {
  const t = a <= theta ? tauBelow : tauAbove;
  return Math.exp(-0.5 * ((a - theta) / t) ** 2);
};

// The discriminator: positive = task-generated (do not calm it),
// negative = context-generated (reduce it).
const discriminator = (a, theta, tauBelow, tauAbove) =>
  appetite(a + 1e-4, theta, tauBelow, tauAbove) - appetite(a - 1e-4, theta, tauBelow, tauAbove);
```

Why asymmetric, and why `τ₊ < τ₋` as the default: the asymmetry from §1 is
structural, not cosmetic. Just below target you are dull; just above target you are
impaired. So the region above `θ` should be narrower and more punishing, and the
default widths encode that belief rather than leaving it to be re-derived each time.

(b) is worth preferring when you want the bump to reach exactly zero rather than
asymptote to it, e.g. when you are gating an action and want a hard no rather than a
very small yes.

### 2.6 The decision rule

```js
function arousalAction(a, theta, eps = 0.05) {
  if (a < theta - eps) return { action: 'activate', toward: theta };
  if (a > theta + eps) return { action: 'calm',    toward: theta };
  return { action: 'hold', toward: theta };
}
```

The `eps` band is not slack. Refusing to act inside a band around the target is what
stops you from oscillating — the classic failure where a person (or an agent)
oscillates around the setpoint, which is worse than either error because it spends
attention on regulation instead of on the task.

### 2.7 And the part most write-ups omit

**`θ` is a function of the task, not of the person.**

| Task property | Target `θ` |
|---|---|
| Novel, ill-structured, exploratory | moderate-to-high |
| Diagnosis of an ambiguous problem | moderate |
| Routine, procedural, well-learned | **low** |
| Creative ideation, divergent | moderate-to-high |
| Careful checking, proofreading, review | **low** |
| Crisis, time-pressured, high stakes | **low** despite the adrenaline** |

That last row is the one people get wrong most often. Adrenaline is high and the
curve still slopes *down*, because high stakes shrink working memory exactly when the
task needs it. Feeling alert is not evidence of being well-calibrated.

---

## 3. Calibrating your own bio-feedback

You cannot apply this without knowing your own `θ`. That is the hard part, and it is
where almost all attempts die.

### 3.1 Why you cannot eyeball it

Self-assessed arousal correlates poorly with actual state, and worse with state on an
unfamiliar task. The number you would guess for your own `θ` is the number most likely
to be wrong, precisely because it is the number you have never checked.

### 3.2 What actually works: collect a curve

```
for each session, log:
  task type            (from the §2.7 table)
  arousal estimate     (1–5, or whatever instrument you use)
  whether you finished  (binary, not a quality rating)
  what you did next    (kept going / drifted / bailed)
```

Then, **per task type**, find the arousal at which "kept going" is most common and
"bailed" is least. That is your `θ` for that task type. Fit it; do not set it by
opinion.

Two rules that matter:

1. **Separate by task type before averaging.** A single pooled `θ` across procedural
   and exploratory work is the average of two different answers and is right for
   neither.
2. **Binary outcomes only.** "How well did that go, 1–10" is contaminated by your
   current mood, which is the variable you are trying to measure. Whether you
   finished is much harder to bias.

### 3.3 The protocol

1. Pick **one** task type. Not "work."
2. Log ~15 sessions. Fewer than that will not resolve a peak.
3. Estimate `θ` per task type from the curve.
4. Set the target. Re-derive it every few weeks; it drifts with sleep debt and load.
5. Before the task, take one reading. If above `θ + eps`, do the calming step. If
   below, do the activation step. Inside the band, **work**.

### 3.4 Activation and calming steps, chosen by mechanism

Pick steps that act on the thing you are trying to change, not on the label.

**To activate** (when `a < θ`, task is ill-structured):
- Movement with a rising arc, then a task transition. Not a stimulant.
- Social contact with low stakes.
- Ambiguity in the task itself — an open question rather than a checklist item.
- Deliberately raising the difficulty of the first step.

**To calm** (when `a > θ`):
- Exhale-dominant breathing, which is physiologically distinct from inhale-dominant
  and is the one that reliably lowers arousal.
- Task segmentation with an explicit finish line — the unresolved open loop is a
  common driver of elevated arousal that does not go away by resting.
- Naming the specific worry in one sentence. Vague dread does not resolve; named,
  specific worry frequently does.
- Reducing the visual and auditory load of the environment.

### 3.5 Bio-feedback specifically

Wearable arousal estimates are one input among several and should never be the target.
Two failure modes:

- **Chasing noise.** Actuating on a noisy estimate produces over-correction, which
  lands you outside `eps` in the other direction, which produces more correction. If
  your regulation oscillates, suspect the instrument before suspecting yourself.
- **Regulating the display, not the state.** Once you know the number, you can start
  managing how it looks. The instrument then reports calm while you are not.

The mitigation for both is the same: require a **hysteresis band wider than the
instrument's noise floor**, and require the outcome measure (did you finish) to agree
before you believe the state measure.

---

## 4. Calibrating an agentic system

An agent has an activation state too, and it is just as real, because it is the same
kind of thing: a parameter governing how much it acts versus how much it deliberates.

### 4.1 The mapping

| Human | Agent | Over-activation looks like |
|---|---|---|
| Appetite for the task | Willingness to proceed without asking | Improvising where it should ask |
| Peak `θ` for ill-structured work | Permitted exploration | Confident invention |
| Low `θ` for procedural work | Low autonomy, follow the known path | Silent deviation from instructions |
| Narrowing under stress | Premature commitment | Not revising on new evidence |
| Dull under-arousal | Endless hedging, requesting permission for everything | No progress, all caution |

### 4.2 The same bump, the same asymmetry

Over-activation is worse for an agent too, and for the same reason plus one more: an
agent that improvises when it should ask produces work that is *harder to detect* than
work it simply did not do. Under-activation produces visible, harmless delay.

```js
// Same bump. theta set by task structure; tauAbove narrower.
const agentAction = (activation, taskNovelty) => {
  const theta = 0.30 + 0.45 * taskNovelty;   // routine -> 0.30, novel -> 0.75
  return arousalAction(activation, theta, 0.08);
};
```

### 4.3 What the discriminator means for an agent

The agent's version of "appetite for the task" is not a feeling, so you must supply a
proxy. The honest options:

- **Does it have a proposed next action that it can justify?** Sustained justification
  under rising difficulty is the agent's version of appetite.
- **Does its output get shorter or more repetitive as activation rises?** For a model
  this is measurable, and it is the closest available analogue of narrowing attention.
- **Does it ask better questions, or fewer?** Rising activation should raise the rate
  of good clarifying questions on ill-structured work and *lower* it on procedural work.
  If the rate falls in both, the agent is over-activated regardless of what it says
  about its state.

This last one is measurable from transcripts and is the one I would actually build.

### 4.4 Save tokens by not over-activating

This connects directly to the token economy work. Over-activated agents spend tokens on
recoverable mistakes: re-deriving, second-guessing, verbose hedging, and long
self-corrections. Under-activated agents spend them on permission requests. Both are
avoidable, and the `eps` band plus the asymmetry are what avoid them.

The predicted saving is larger for the over-activated case, because an error costs more
tokens to discover than a delay costs to prevent.

---

## 5. Actual versus perceived helpfulness

The most important section for anyone acting on this, because it is where interventions
that feel successful fail.

### 5.1 The gap

- **Actually helpful**: improves the outcome that the intervention was for.
- **Perceived helpful**: the recipient judges it to have helped.

They dissociate, and they dissociate in the *worst possible direction*: an
intervention can reliably raise perceived helpfulness while lowering actual
helpfulness.

The canonical case: you raise someone's arousal before a routine procedural task. They
feel more engaged, more "on," more ready. They perform the same or slightly worse. Both
parties report success. The only thing that would have caught it was comparing outcomes
across arousal levels, which nobody does because the intervention felt good.

### 5.2 What this means for calibration

**Never calibrate on perceived alone.** Perceived helpfulness is a *system-1 reading*
of the situation, and it moves with arousal in the same direction as engagement. It is
therefore maximally biased exactly in the regime where you need it.

Practical rules:

- Measure outcome quality and perceived helpfulness **separately**, always.
- For a caregiver or peer: **your sense that they seemed more with it is close to
  useless evidence.** It is the intervention's own effect being fed back to you.
- Prefer outcome measures that cannot be moved by the intervention's felt quality:
  did they finish, was the output correct, did they have to redo it.
- When the two disagree, **believe the outcome.** The felt quality is part of what you
  are trying to manage.

### 5.3 And the self-application is hardest

When you regulate your own arousal, the perceived effect is strong and the actual
effect is unmeasured. Feeling sharper after activating yourself is *strong* evidence
that it worked, and it is nearly worthless. You are the worst available observer of
your own calibration, for the same reason you are the best-placed person to notice
someone else's mood.

This is an argument for logging outcomes rather than feelings, and it is uncomfortable,
because it asks you to distrust the one data source you have.

---

## 6. Who is this for, and what does it require of whom

The target arousal is not a property of the task alone. It depends on **whose stakes
they are** and **who is doing the regulating**. This changes who should be calibrating.

### 6.1 Three positions

| Position | Who they are | Whose `θ` | Who controls it | Main failure |
|---|---|---|---|---|
| **First** | you, on your own task | yours | you | misreading signal as deficiency |
| **Second** | benefactor, friend, supervisor | theirs, not yours | them | they optimise their utility, not your performance |
| **Third** | neutral party, partner, rival | shared, or contested | negotiation | activation as leverage |

### 6.2 First person — self

Your self-report is at its most reliable here, because nobody else has better
information and the stakes are single-valued.

**Requires**: a log, a target per task type, and the refusal in §7.2.

### 6.3 Second person — benefactor, friend, supervisor

The benefactor's utility rises with *your effort*, so their preferred `θ` is usually
higher than yours. **Their genuinely helpful intervention can reduce your
performance**, and it will feel supportive when it does.

This is the structural asymmetry, and it is worth stating plainly to someone who
cares about you: *wanting you more alert is not the same as you being better at the
task.* On procedural work, the caring move is often to leave you alone.

**Requires** of the benefactor: ask before regulating. Ask which task type. Accept
"this task doesn't need me sharp" as an answer. Distinguish helping from managing.
**Requires** of you: say which task you are on, and let the person help with the task
type rather than your general state.

### 6.4 Second person — supervisor

Same asymmetry plus a power gradient, which makes refusal harder. Hierarchical
pressure reliably produces activation, and reliably produces over-activation on
procedural work.

**Requires** of the supervisor: default to *not* pumping people up. Make the procedural
work procedural. Do not read fatigue as low commitment.
**Requires** of the subordinate: name the task type when you are given advice, because
the advice is usually correct for some task type and just not this one.

### 6.5 Third party — cooperative partner

Shared stakes align the targets better than any other case. Both parties want the
*joint* outcome, so both are penalised by the same over-activation.

**Requires**: one shared `θ` per shared task, negotiated explicitly. This is the
easiest case in the chapter and the one most often left implicit.

### 6.6 Third party — rival or enemy

Here activation is a weapon, not an accident. Raising an opponent's arousal before
procedural work is a real tactic and it works *because* of exactly the mechanism in
this chapter.

This is stated as a mechanism, not a recommendation. Two consequences:

- **Defensively**, if you notice yourself oddly activated before a procedural task
  with an adversary present, check whether it was manufactured. The startle channel
  (§8) is cheap to run.
- **Ethically**, this is the point where mood calibration stops being a wellbeing
  technology. An agent that raises a person's arousal *to impair them* is an agent
  doing harm, and no framing as "engagement" changes that.

### 6.7 Task properties across the positions

| | acute | important | valuable to me | valuable to them | valuable to a third party |
|---|---|---|---|---|---|
| **Self** | act now | as normal | own the target | n/a | usually not mine to trade |
| **Benefactor** | escalate | calm the over-work | they want more activation | their `θ` is lower | risk of them spending you |
| **Supervisor** | escalate | normalise it | under-reported | over-reported | often invisible |
| **Partner** | escalate | shared | align first | align first | this is the real stakeholder |
| **Rival** | exploit | exploit | not your welfare | not your welfare | third-party cost is externalised |

The recurring lesson: **acute and valuable are orthogonal to whose value it is**, and
the parties systematically weight them differently. A benefactor who escalates an
acute task and raises your activation has optimised for *their* urgency, not the
outcome.

---

## 7. Two failures that are not calibration failures

The model above is easy to misuse in two specific ways, and both are common enough to
name.

### 7.1 Regulating the wrong thing

Under-arousal on a task you do not care about is **correct signal**, not malfunction.
The bump says appetite is low. The correct read is not "you are under-activated, fix
it" — it is "this task is not engaging you, and that is information."

### 7.2 The self-respect clause

If you apply this model to yourself with the implicit goal of being better at
everything, it becomes an instrument for converting *not wanting to do a thing* into a
correctable physiological defect. That is the misuse, and it is worth refusing
explicitly because the model itself cannot tell you — `θ` is defined relative to a task,
so "below target" is always available as a conclusion and never implies you should do
anything.

**The rule: before acting on a below-target reading, ask whether the task is one you
value.** If it is not, the reading is the answer, not the problem. There is no
deficit to correct.

And the goal stated in §0 is **functioning *and* well-being**. Calibration that only
moves performance is half the technique, and the half that damages people.

---

## 8. The startle channel, briefly

Arousal from an out-of-context event has a signature that generated arousal does not:
a fast involuntary component (orienting, roughly 100 ms) followed by a slow deliberate
one. If the fast component fired and the slow one is now narrating, that is a startle,
not engagement, and no amount of deliberate reframing will convert it into appetite.

Practically: if your arousal rose in under a second and you did not choose it, treat it
as context-generated by default. This is a cheap prior and it is right often enough to
be worth applying.

*(The popular "reptilian brain" framing for this is superseded neuroscience and is used
here only as shorthand. The measurable content is the latency signature and the
autonomic response, both of which are real.)*

---

## 9. Falsifiable predictions

If this framework is wrong, these should fail. They are stated so they can be checked
rather than believed.

1. **Asymmetry.** Over-arousal should cost more than under-arousal of equal distance
   from target. If not, the asymmetric bump's default is wrong.
2. **Task-type dependence.** `θ` should differ significantly between procedural and
   exploratory tasks *within the same person*. If a single pooled `θ` fits both, the
   §2.7 table is decoration.
3. **Perceived/actual dissociation.** Raising arousal before procedural work should
   raise perceived helpfulness while leaving or lowering outcome quality. If perceived
   and actual track together here, §5 is overstated.
4. **Appetite as the discriminator.** Change in appetite should predict outcome
   better than arousal level alone. If arousal level alone is as good, the derivative
   framing adds nothing and §2.2 is over-engineered.
5. **The `eps` band.** Regulation without a hysteresis band should produce
   oscillation and worse outcomes than no regulation. If it does not, the band is
   unnecessary complexity.

Prediction 4 is the sharpest test of the chapter's central claim, and it is the one I
would run first.

---

## 10. Honest limitations

- **The inverted U is a heuristic, not a law.** Some task types improve monotonically
  with arousal. Treat `θ` as a quantity to measure, never as a constant to assume.
- **All parameters here are priors, not fitted values.** The τ defaults are a
  defensible starting point and nothing more. `θ` must be measured per person.
- **Self-report is contaminated.** The whole chapter is undermined if the outcome
  measure moves with mood. Use binary completion, not quality ratings.
- **Bio-feedback evidence is mixed.** Wearable-driven regulation is not reliably
  better than the alternatives, and instrument noise can make it worse.
- **No mechanism here tells you what to *care about*.** `θ` is defined only against a
  task you have already chosen. The model is downstream of that choice and silent
  about it — which is why §7.2 exists.

---

## Where to look

- `docs/research/v2-plan.md` — the series this chapter belongs to, Part 5
- `docs/research/numerical-verification.md` — how the numeric layer is verified, and
  the method that produced the asymmetry finding about refinement
- `docs/research/agency-assistance-review.md` — the v1 draft on agency and assistance