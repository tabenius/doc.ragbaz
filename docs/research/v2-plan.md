# Meta-analysis series — implementation plan, v2

Supersedes the plan implied by `agency-assistance-review.md`. That draft was a single
review on one question: how much of a decision was the operator's. This expands it into
a series with a shared measurement spine, and adds the perception, memory, compute and
value dimensions that the first draft gestured at and never operationalised.

## 0. What changed, and the one correction that drives the design

The v1 draft treated "the linearization trap" as an arithmetic curiosity. It is not.
It is the smallest available instance of a question that runs through this entire
series:

> **An encoding chosen for one consumer's hardware silently determines what structure
> the next stage of the pipeline can see.**

sRGB is a nonlinear transfer curve. Fit a model in the encoded domain and you are
fitting in a space whose coordinate axes are a power law apart. That does not corrupt
the fit — it changes which directions look like structure. Whether a "trait subspace"
survives is therefore partly a question about the encoding, and the honest experiment
runs the whole battery across encodings rather than picking one.

This is the template for the rest of the series. Where a choice was made for one
audience's benefit — gamma for CRTs, luma weighting for broadcast bandwidth, chunking
for human working memory, tokenization for subword vocabulary efficiency — the
question is what it costs the *next* stage.

### Structure

| # | Work | Status |
|---|---|---|
| 0 | Numerical spine: exact arithmetic, precision ladder | **done**, `e9e5e81` |
| 1 | Encoding invariance: does the subspace survive re-encoding | next |
| 2 | Perception and attention as timing constants | next |
| 3 | Memory: precision, recall, compaction, human vs machine | next |
| 4 | Representation packing and token economy | next |
| 5 | Cognitive load, depletion, recovery | next |
| 6 | Value dimensionality and the acute/valuable triage | next |
| 7 | Integrated predictive model, then explanatory model | last |

Each part is independently publishable and independently falsifiable. Work 0 is
already done and is the template for how the others get done.

---

## Part 1 — Why sRGB, why YUV, why both, and why neither

### 1.1 The honest answer to the question as posed

The question was "why sRGB and why not YUV, to correlate with human eye perception."
The premise needs one correction before the experiment can be designed, because
neither of those spaces actually does that.

- **sRGB** is a *display encoding*. Its transfer function approximates a display gamma
  of 2.2 with a linear toe, standardised as IEC 61966-2-1. It exists because CRTs emit
  light nonlinearly and a display needs codes that produce smooth ramps. It is
  **not** perceptually uniform: equal code steps do not look like equal perceptual
  steps, which is the whole reason the inverse EOTF exists.
- **YCbCr / "YUV"** is a *luma-chroma separation* for video transport. Y is a weighted
  sum of the channels (BT.709: 0.2126, 0.7152, 0.0722) chosen to approximate human
  luminance sensitivity; Cb/Cr carry the colour difference. Its purpose is **subsampling
  the chroma without destroying the image** — 4:2:0 throws away three quarters of the
  colour data and it looks fine, because we notice brightness more than hue. It is a
  compression decision, not a perceptual-uniformity decision.
- The spaces that *do* approximate perceptual uniformity are **CIELAB** (CIE 1976, `L*`
  uniform lightness) and **Oklab** (Ottosson 2020), which is what you would reach for
  if "correlate with perception" were the actual goal.

So the correct framing is not sRGB-versus-YUV. It is **encoding is a factor, and the
factor is itself worth testing.**

### 1.2 The design

Run the identical trait-subspace battery in five encodings, on identical underlying
data:

| Encoding | What it is | Why it is in the battery |
|---|---|---|
| sRGB encoded (nonlinear) | code values as stored | the default; display-referred |
| linear-light sRGB | inverse EOTF applied | physical radiance; compositing-correct |
| BT.709 luma/chroma | Y, Cb, Cr | subsampling-relevant; luma-weighted |
| Oklab | perceptual, near-uniform | the control that should behave |
| CIELAB | `L*`, `a*`, `b*` | historical perceptual control |

**Prediction.** If the subspace is a property of the data, it appears in all five, up
to a rotation. If it appears only in the nonlinear encoding, it is an artifact of the
transfer curve and there is no trait geometry to find.

**Falsification.** A subspace that appears in Oklab and CIELAB but *not* in linear-light
sRGB is a nonlinearity artifact. A subspace present in all five has survived the hardest
test available and is worth writing up.

This is the experiment the linearization trap was always a warning about, stated as a
design instead of an anomaly.

### 1.3 Why this is the right first experiment

It is cheap, it is decisive, and it is a genuine risk of finding nothing. Starting with
the experiment most likely to invalidate the framing is the correct order: a null result
here costs a day and saves the rest of the series from being about a gamma curve.

---

## Part 2 — Perception and attention as timing constants

### 2.1 Anchors

The four latency tiers were proposed as 30 ms / 10 s / 2 h / above. The boundaries
should come from perception, not from round numbers. The relevant constants:

| Interval | What happens | Source |
|---|---|---|
| ~10 ms | temporal ordering; events fuse into one percept | gap phases |
| ~30–100 ms | threshold for felt causality between stimuli | displays and input |
| **~135 ms** | **contingency window for perceived agency** | Ramachandran & Gregory 1991 |
| ~200–400 ms | active/passive motion discrimination threshold | Steinman and colleagues |
| ~1 s | gist of a display change; attention can be captured | change blindness |
| ~2 min | mind-wandering onset, reliably | Killingsworth & Gilbert 2010 |
| ~4 h | sustained-performance degradation begins | see Part 5 |

The 135 ms figure is the important one and it is directly on point: perceived agency in
apparent motion is lost above roughly 135 ms of contingency. An agent whose responses
lag beyond that is not experienced as *responding to you*. This is a hard perceptual
boundary on the relationship, not a performance preference, and it sits inside the
realtime band.

### 2.2 Revised stratification

The proposed boundaries are kept, with two corrections and an added sub-band.

| Tier | Range | Anchor | Emotional register |
|---|---|---|---|
| **Perceptual** | < 100 ms | sub-perceptual below ~30 ms; perceptible lag to ~135 ms | must feel reflexive |
| **Attentional** | 100 ms – 2 min | attention captured ~1 s, wanders ~2 min | must feel held |
| **Sustained** | 2 min – 4 h | one sitting; flow entry; pre-fatigue | must feel worth staying for |
| **Deliberative** | > 4 h, or across rest | spans sleep-dependent consolidation | may be deferred honestly |

Two changes from the original proposal:

1. **The realtime band splits.** Below ~30 ms is *imperceptible* — latency that cannot
   be felt and whose only cost is compute. Between ~30 and ~135 ms it is perceptible as
   lag but not yet as loss of causality. Collapsing these hides the distinction between
   "free" and "expensive."
2. **The boundary is 2 min, not 10 s.** A 10 s ceiling is below the onset of reliable
   mind-wandering, so it describes "will this hold attention" for about a third of the
   band and then silently stops describing anything. The tier should change where the
   *kind* of attention changes.

### 2.3 The resource question each tier implies

| Tier | Can compute be traded? | Failure mode if under-resourced |
|---|---|---|
| Perceptual | no — must be resident | feels broken; agency is lost at ~135 ms |
| Attentional | partly; can queue and stream | loses the thread; re-reads; abandons |
| Sustained | yes; can be queued with honest ETA | distrust; work is checked twice |
| Deliberative | yes; async is correct | nothing, provided the ETA is truthful |

The asymmetry is the point: **being slower in the perceptual tier costs the
relationship, while being slower in the deliberative tier costs nothing at all.** Most
systems have this backwards.

---

## Part 3 — Memory: precision, recall, compaction

### 3.1 The divergence

| | Human | LLM |
|---|---|---|
| Storage | lossy, interference-prone | largely verbatim within the window |
| Recall | lossy, reconstructive, biased by current goals | exact retrieval, no decay |
| Failure | confabulation; confident misrecall | context-window overflow; silent truncation |
| Silently wrong? | yes, pervasively | rarely, unless the window truncated |
| Capacity | a few chunks held, rest long-term | fixed window; no durable state without a tool |

The critical asymmetry: **the model has no degradation, and the human has no
durability.** Each is weak exactly where the other is strong. Perfect recall that
overflows is not a memory; lossy storage that never truncates is not either.

### 3.2 Compaction is the shared failure mode

Both systems must reduce a long history to something small enough to continue with.
Both do it badly and both do it silently:

- Context compaction summarises. The summary is generated by the same process that was
  wrong, and nothing downstream can tell a summary from the thing summarised.
- Human gist formation does the same thing — and the study literature is clear that
  people do not notice the substitution.

This is a measurable convergence and the series should treat it as one phenomenon with
two implementations. **Both are lossy compressors operating under a capacity
constraint, and both fail by dropping what was least salient at the moment of
compression.** Salience at compaction time is not salience at use time.

### 3.3 Experiments

1. **Compaction salience probe.** Present a long history where the load-bearing detail
   is not the most recent and not the most frequent. Compact. Ask for the detail.
   Measure recovery for human and model under matched conditions.
2. **Retrieval-vs-summary.** Replace summary with a retrieval index and re-measure.
   The gap between the two is the value of structure over narrative.
3. **Verification asymmetry.** Humans rarely check their own recall; models never can.
   Can a prompt make the model doubt a compacted fact as readily as a person doubts a
   remembered one? This is the tractable half.

---

## Part 4 — Representation packing and the token economy

### 4.1 The same problem, two hardware targets

What is a "good" representation depends entirely on the reader.

| | Human reader | Model reader |
|---|---|---|
| Good packing | schema over gist; a rule that re-derives instances | explicit facts; nothing re-derivable |
| Cost of compactness | loses the exceptions | saves tokens, risks ambiguity |
| What to omit | detail already absorbed by the schema | nothing; every token is load-bearing |
| Failure | overgeneralising a rule | confident fluent misreading |
| Optimal density | low; context is expensive per item | high; context is cheap per token |

The asymmetry worth naming: **for a human, compression is a knowledge claim. For a
model, compression is a savings claim.** A human who stores the rule believes they
stored the thing. A model that stores the rule has stored a pointer to something that
may not resolve.

### 4.2 Token economy for assistants

Concrete, in priority order:

1. **Do not re-derive what is already established.** The largest cost in agent sessions
   is restating settled ground. Persist decisions and their reasons; retrieve them.
2. **Structure beats narrative.** A table of decisions with reasons is cheaper and more
   reliable than the prose that produced them.
3. **Spend tokens where uncertainty is.** Verification against exact arithmetic is
   cheap in tokens and decisive; a paragraph of reflection on the same question is
   neither.
4. **Bound the context, not the memory.** Let the window hold the working set and
   nothing else.
5. **Measure it.** Tokens per resolved task, and tokens per correction. The second is
   the honest one.

### 4.3 The human analogue

The same five moves, translated to a person:

1. Do not re-litigate settled decisions; write down why once.
2. Schemas over narratives, for the same reason.
3. Spend effort where the answer is uncertain, not where it is comfortable.
4. Bound what you hold open; close loops deliberately.
5. Track re-work rate, not throughput.

**The recommendation is symmetrical and the symmetry is the interesting claim:** the
optimal strategy for a token-limited agent is close to the optimal strategy for a
sleep-limited human — because both are systems that lose their most expensive resource
to load and both recover it by unloading rather than by working harder.

---

## Part 5 — Cognitive load, depletion, recovery

### 5.1 The model

Working memory is small and it is smallest when it matters most. Load is cumulative.
Recovery is not instantaneous, and recovery time depends on the function being restored.

Three things must be modelled separately and are usually conflated:

- **Acute load** — right now, in the perceptual and attentional tiers. Recoverable by
  stopping. Minutes.
- **Fatigue** — accumulated across a session. Recoverable by rest. Hours.
- **Sleep-dependent consolidation** — what sleep actually consolidates. Not
  substitutable by rest. A full cycle.

Rest is not sleep. A person who rests for eight hours has not had consolidation.

### 5.2 Load and arousal: the Yerkes–Dodson inversion

This is where the user's "creative stressor" question gets an answer, and the answer is
that it is real and quantifiable.

The Yerkes–Dodson law: performance and cognitive flexibility follow an inverted U in
arousal. Moderate arousal *raises* performance on complex, exploratory tasks relative
to low arousal. High arousal helps simple tasks and wrecks complex ones.

This gives the triage model its asymmetry:

| Arousal | Complex task (novel, ill-structured) | Simple task (known, procedural) |
|---|---|---|
| low | under-aroused, poor | fine |
| **moderate** | **best** | fine |
| high | worst | best |

**An activating stressor is useful exactly when the task is ill-structured, and harmful
when the task is procedural.** So whether to raise or lower a person's activation
depends on whether the thing in front of them is a judgement or a lookup. That is
answerable per task, not per person.

### 5.3 Parameters that must be sourced, not guessed

The following need literature values before the model is fitted. I am not writing them
from memory, because the entire argument of the previous draft was that unreferenced
numbers in this area are how a draft becomes confidently wrong:

- reaction-time and accuracy degradation versus hours awake (military sleep-deprivation
  literature; Van Kyl and colleagues on PVT lapses, Walter and colleagues' systematic
  reviews)
- sleep inertia duration by sleep stage (Hildreth & Dement and successors)
- working-memory recovery time after acute load
- allostatic load markers and their half-lives (McEwen)

The plan is to source these into `data/` with citations, and to have the model refuse to
run on unsourced parameters rather than defaulting them.

### 5.4 The load taxonomy that drives triage

Not "how tired are you" but:

- **Cognitive load** — elements in working memory. Recoverable in minutes.
- **Effort load** — sustained attention. Hours.
- **Emotional load** — arousal held above baseline; the one that does not announce
  itself and does not resolve with a break. This is thereptilian-adjacent channel.
- **Consolidation load** — what must be encoded tonight to be available tomorrow.

---

## Part 6 — Values, and the acute/valuable triage

### 6.1 A discrepancy to settle first

The brief says "the 16 dimensions of inter-culturally studied human inner value
system." **There is no such standard instrument with 16 dimensions.** The nearest
established work is Schwartz:

- Schwartz 1992: **10** value types, 4 higher-order dimensions.
- Schwartz & Bardi 2003 (the current refinement): **19** values in **10 domains** under
  **4 higher-order factors** — Openness, Conscientiousness, Emotionality, Security.

Some countings produce 16 by dropping the Security-domain items or by counting domains
and higher-orders differently. Rather than pick one silently, the plan treats this as
an open specification question with a decision recorded. **Recommended: the Schwartz
& Bardi 19/10/4 model**, because it is the current standard and it keeps the
universalism-to-security contrast that the brief wants.

The brief's contrast is the valuable part and it survives the instrument question
exactly: **universalism versus a very small in-group and immediate comfort/safety.**
That is the axis between "this is right in general" and "this is right for me and this
person, now, and I am not moving."

### 6.2 Weighting

```
value_score = Σ wᵢ · vᵢ
```

with `wᵢ` learned, **not asserted**. The weights come from a small set of outcomes we
can observe — did the person come back, did they act, did they say it was worth it —
not from an assumption about what people should value. Letting a model learn "how much
people care about X" is fine. Hard-coding it is not.

### 6.3 The triage: acute or valuable

These are genuinely orthogonal and both can be true.

```
                    valuable
                       │
        DO IT NOW ◄────┼────► DO IT LATER, HONESTLY
                       │
   acute               │
                       └──────────────► neither: DROP IT
```

**Acute** is time-critical: it decays if unattended.
**Valuable** is weighted by the value model.
Neither matters alone — a high-value item with no decay is not urgent, and a decaying
item with no value is noise.

### 6.4 The Strange Situation analogue

Ainsworth's Strange Situation is an infant measure: reunion behaviour under mild
stress, classified secure / avoidant / ambivalent / disorganised. Adult attachment work
(Bartholomew & Horowitz 1991) maps these onto secure / dismissing / preoccupied /
fearful-avoidant.

**Used here as a design metaphor, not as a measure**, because the infant instrument
cannot be administered to an adult operator and pretending otherwise would be
methodological fraud. What is borrowed is the *shape*:

> Behaviour under reunion predicts later behaviour far better than trait scores do —
> **because the event is out of context and nobody has a script for it.**

That is precisely the situation this triage model exists for: a suddenly arising event
a person did not anticipate, for which there is no stored procedure. The Strange
Situation was clever to observe people exactly there.

Applied operationally: the model's behaviour when an event arrives *unscheduled* is
more diagnostic than its behaviour when queried directly. **Prediction should weight
unscheduled-event responses above directly-elicited ones.** That is a testable
prediction and it is the falsifiable content of this section.

### 6.5 The startle channel — named honestly

The brief asks for correlation with "primal reptile-brain responses" to sudden,
unexplainable, out-of-context events.

**The triune-brain model — reptile / mammalian / neocortex — is not current
neuroscience.** MacLean's model is largely superseded: there is no reptilian brain, the
lobes are not independent modules, and emotion is not localised in the way the metaphor
implies. It remains a useful *vocabulary* for fast-versus-deliberate response and
should be used as vocabulary.

What survives, and should be modelled:

- **Orienting response** — involuntary attention capture by an unexpected stimulus.
  Robust, measurable, well characterised.
- **Freeze / fight / flight with a fast component and a slow component** — dual-route
  processing is real; the two-route framing is defensible.
- **Stress-hormone response** — measurable, slower than the above.

So the dimension is implemented as **orienting-and-startle**, measured by latency and
autonomic markers, with the reptilian framing retained only as shorthand in figures.
The honest version is also the more useful one, because it is measurable.

### 6.6 Creative versus incoherent arousal

The distinction the brief is reaching for:

| | Source | Signature | Response |
|---|---|---|---|
| **Task-generated** | the work itself | wants to continue; appetite increases with difficulty | protect it; give it room |
| **Context-generated** | out-of-context event; unassignable threat | wants to stop; attention narrows; no appetite | reduce it; do not use it |

Both present as elevated arousal. Discriminating them is the entire question, and the
discriminators above are the testable ones: **does appetite for the task track the
arousal?** If yes, the arousal is functional. If the arousal rises while the appetite
for the task falls, it is load and needs removing.

---

## Part 7 — Architecture: predictive first, explanatory second

The brief's ordering is correct and is also the safety ordering.

### 7.1 Two models, one gate

**Predictive model.** Optimises accuracy. May be opaque. Answers "what happens next."

**Explanatory model.** Sparse, readable, falsifiable. Answers "why."

**The gate:** the explanatory model must

1. use features the predictive model actually uses, not a different story;
2. state a reason that can be contradicted;
3. reproduce the predictive model's top-N cases, not its average.

If the explanatory model cannot pass the gate, its story is not an explanation of the
prediction. **This is checked, not asserted** — the same discipline as the precision
study, where a plausible-looking residual passed six broken implementations.

### 7.2 Two-track output

| Track | For | Form |
|---|---|---|
| Prediction | the system | number, interval, confidence |
| Explanation | the person being helped | one sentence, one figure, one question |

The explanation track is not a debug view. It is the product. A prediction the operator
cannot interrogate is a prediction they must either obey or ignore.

### 7.3 Consent constraint — non-negotiable, and self-imposed

This series infers psychological state: values, fatigue, activation, attachment
dynamics. That is a surveillance capability if applied to people who did not ask for
it, and the whole point of part 1 of the v1 draft was to *protect* agency.

Therefore, as an architectural constraint rather than a disclaimer:

1. **Self-report outranks inference, always.** An inferred value never overrules a
   stated one.
2. **Inference never gates entitlements.** The model may reorder what is offered. It
   may not decide what a person is *owed*.
3. **No covert inference.** Nothing is inferred from a person who has not opted in.
4. **Every inference is legible** to the person it is about, in the same figures the
   explanation track uses.
5. **The triage is visible.** A person must always be able to see why something was
   deferred.

An agent that infers your state to decide what you deserve is the failure mode this
entire series documents. It is also the failure mode this series could accidentally
become. Constraint 2 exists for that reason.

---

## Part 8 — Figures

Every figure is interactive, animated, self-contained, and offline. No CDN. Common
libraries are vendored; `cytoscape` and `cytoscape-dagre` are already dependencies of
this site and carry the topology views.

### Figure 1 — The encoding isometry

*Why sRGB, why YUV, why both.*
A 3-D scatter of a colour cloud morphing continuously through five encodings, with the
**trait subspace drawn as a plane in every one**. The plane either survives the morph
or it does not. Scrub the encoding axis and watch a geometry appear and disappear.

- Encoding morph as an animated transition, one axis of the slider.
- The subspace as a semi-transparent plane, rotating with the data cloud.
- A residual readout: how much of the plane's structure survives, per encoding.
- Falling back: if the plane tilts between encodings, tilt is the finding, and the
  figure should make that legible rather than hide it.

### Figure 2 — The timing ladder

*The 135 ms line and the four tiers.*
A horizontal log-time axis from 1 ms to 48 h. Perceptual bands as background colour.
A marker at 135 ms labelled *loss of perceived agency*. Tiers as labelled regions with
the failure mode of each written inside it.

- A "you are here" probe: drop a task on the axis and it reports which tier it lands
  in, the compute budget that implies, and what under-resourcing costs.
- Animated: a request travelling left to right through the tiers, changing treatment at
  each boundary.

### Figure 3 — Compaction as a lossy channel

*The shared failure mode.*
Two pipelines, human and model, side by side, identical shape. A long history flows in,
passes a narrow gate marked *capacity*, and a short representation flows out. **Items
that do not survive the gate fade and fall away in full view.**

- The dropped items remain visible as ghosts. Nothing disappears silently.
- Add a card: "this detail was dropped" with the reason.
- Animated: repeated compaction, watching what survives and what degrades.

### Figure 4 — The representation matrix

*Human versus machine packing.*
A grid, human-optimal against model-optimal, over four packing strategies (narrative,
schema, table, index). Each cell animates *what the reader reconstructs* from that
packing. Cells where the two species need opposite strategies glow.

### Figure 5 — The recovery curves

*Load, fatigue, and what sleep actually does.*
Four stacked curves over 48 hours: acute load, fatigue, consolidation, and a
performance overlay. Rest and sleep are two different curves and the gap between them
is the point.

- Scrub across the sleep window and watch consolidation — only — accumulate.
- A single failure that rests for eight hours stays unfixed, and the figure shows that.

### Figure 6 — The triage quadrant

*Acute versus valuable.*
The four-quadrant field from 6.3, live. Drag an item in; the value model animates its
weights into the score. Clusters for the 19 Schwartz values orbit the edges.

- Above: the two axes update independently, so the four cases are all reachable.
- A toggle for the arousal inversion: the same item, ill-structured versus procedural,
  and the "activate or calm" recommendation flips.

### Figure 7 — The two brains, honestly

*The startle channel.*
Dual-route processing shown as two genuinely separate paths with different latencies.
A stimulus arrives; the fast path fires at ~100 ms, the slow one at ~300 ms, and the
figure shows them resolving at different times. Below, the value model, slow.

- Labelled as the dual-route finding, with the triune model marked as superseded
  vocabulary rather than anatomy.

### Figure 8 — The gate

*Predictive and explanatory, side by side.*
Two panels. Left: the predictive model's output. Right: the explanatory model's. The
gate is the seam between them — each case where the explanation fails to reproduce the
prediction lights up red, and those are the cases worth reading.

---

## Part 9 — Phases

Each phase ends with a result that could be "no".

| Phase | Deliverable | Fails if |
|---|---|---|
| 0 | Exact arithmetic, precision study | **done** |
| 1 | Encoding-invariance battery across five spaces | subspace appears in one encoding only |
| 2 | Timing constants, tier definitions, literature table | tiers cannot be justified from perception |
| 3 | Compaction probe, human and model | compaction loss is not measurable or not shared |
| 4 | Token-economy baseline and interventions | savings do not reduce corrections |
| 5 | Depletion/recovery model from sourced parameters | refuses to run without citations |
| 6 | Value model, triage, arousal inversion | weights cannot be learned from outcomes |
| 7 | Predictive then explanatory model | explanatory fails the gate |

Ordering rationale: phase 1 is first because it is cheap and can invalidate the series'
framing. Phase 5 is late because sourcing is slow and everything else is unblocked
without it. Phase 7 is last because a model trained on unsettled inputs is worse than
no model.

### Sequencing note

Phase 1 should start immediately and needs only the numeric layer already built. Phases
2, 3 and 5 are literature work and parallelise with it. Phases 4 and 6 need data that
does not exist yet.

---

## Part 10 — Honesty register

Claims in this plan that are contested, superseded, or not yet sourced, listed so a
reader does not have to find them.

| Claim | Status |
|---|---|
| "16 dimensions of human values" | **No such standard instrument.** Decision needed; Schwartz & Bardi 19/10/4 recommended |
| "Reptilian brain" | **Superseded.** Implemented as orienting/startle with measurable markers; triune framing is vocabulary only |
| Strange Situation applied to adults | **Metaphor, not measure.** The payload is the unscheduled-event prediction, which is testable |
| Yerkes–Dodson | Well established, and old. Applies as stated: moderate arousal helps ill-structured tasks |
| Sleep-deprivation parameters | **Not yet sourced.** Must not be filled in from memory |
| sRGB/YUV "correlate with perception" | **Incorrect as posed.** Neither is perceptually uniform; Oklab and CIELAB are the controls |
| Trait subspace existing at all | **Unestablished.** Phase 1 exists to test it |
| Load/recovery generalisation across people | Weak. Individual variation is large and must be modelled, not averaged away |

The last row matters most. Every model here describes a *typical* function, and the
individuals furthest from typical are precisely the ones the acute/valuable triage is
supposed to catch. An averaged model applied to a person at the tail of the
distribution is the failure mode this series is about, repeated one level up.

## Where to look

- `scripts/lib/exact.mjs`, `scripts/precision-study.mjs`, `scripts/exact.test.mjs` —
  the numeric spine, pattern for everything else
- `docs/research/numerical-verification.md` — how the spine is verified
- `docs/research/agency-assistance-review.md` — the v1 draft this supersedes