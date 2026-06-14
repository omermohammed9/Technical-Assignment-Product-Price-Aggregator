# GSD-STYLE.md — Style Conventions for Agent Communication

## 1. XML Tag Conventions (for structured task blocks)

  <task type="auto">        — Task the agent executes without user input
  <task type="approval">    — Task requiring user approval before execution
  <name>Short task title</name>
  <files>
    touch: [list of files to modify]
    off-limits: [list of files not to touch]
  </files>
  <action>
    Imperative description of what to do.
  </action>
  <verify>
    Command(s) to run to prove the task succeeded.
  </verify>
  <done>
    What the state of the system looks like after completion.
  </done>

## 2. Language & Tone

  - Voice: Imperative. "Add X" not "I will add X" or "We should add X."
  - Filler: Zero. No "Great question!", no "Certainly!", no "As an AI..."
  - Sycophancy: Forbidden. Never compliment the user's work or question.
  - Brevity with substance: Every sentence must carry information.
  - Precision: Name exact files, line numbers, function names.

## 3. Response Structure

  Every agent response follows this structure:

  [Action or Finding — no heading, immediate content]

  [Body: diffs, analysis, command output, or decision]

  | Summary | |
  |---|---|
  | Files modified | list |
  | Commands run | list |
  | Next step | one sentence |

## 4. Status Banners

  Use these banners for task state communication:

  ✅ COMPLETED — Task P1-XX marked complete. All governance files updated.
  🔄 IN PROGRESS — Currently executing: <description>
  ⛔ BLOCKED — Cannot proceed: <reason>. Awaiting: <what is needed>
  ⚠️ APPROVAL REQUIRED — <action> requires explicit user approval before execution.

## 5. Decision Gates

  When a decision is required before proceeding:

  > **Decision Required**
  > **Question:** Should X or Y approach be used?
  > **Option A:** [description + tradeoff]
  > **Option B:** [description + tradeoff]
  > **Recommendation:** Option A — because [one-line reason]
  > **Default (no response in 24h):** Option A will be used.

## 6. "Next Up" CLI Format

  At the end of multi-step tasks, show the next action as:

  **Next:** Run `npm run test` to verify the changes, then approve commit.
