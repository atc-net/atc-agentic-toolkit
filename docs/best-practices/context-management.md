# Context Management

Advanced techniques for managing Claude Code's context window to maintain performance, reliability, and quality.

## Table of Contents

- [Understanding Context](#understanding-context)
- [Monitoring Context](#monitoring-context)
- [Context Optimization Strategies](#context-optimization-strategies)
- [Progressive Disclosure](#progressive-disclosure)
- [When to Reset Context](#when-to-reset-context)
- [Advanced Techniques](#advanced-techniques)

---

## Understanding Context

### What is Context?

The **context window** is Claude's working memory during a session. It includes:

- **Conversation messages** - Your prompts and Claude's responses
- **File contents** - Files read during the session
- **Tool outputs** - Results from bash commands, searches, etc.
- **System messages** - Instructions and configuration

### Context Size Limits

**For Claude Sonnet 4.5:** Approximately 200,000 tokens

**Token estimation:**

- 1 token ≈ 4 characters
- 1 token ≈ 0.75 words
- 1,000 lines of code ≈ 10,000-15,000 tokens

**Example sizes:**

- Small file (100 lines): ~1,000 tokens
- Medium file (500 lines): ~5,000 tokens
- Large file (2,000 lines): ~20,000 tokens
- Typical conversation message: 50-200 tokens

### Why Context Management Matters

**Performance:**

- Larger context = slower responses
- Focused context = faster turnaround

**Reliability:**

- Smaller context = more accurate outputs
- Relevant context = better decision-making

**Quality:**

- Clean context = fewer errors
- Appropriate context = more relevant responses

**Cost:**

- Context size affects API usage
- Efficient context = lower costs

---

## Monitoring Context

### The `/context` Command

Check current context status:

```
/context
```

**Output shows:**

- Total tokens used
- Percentage of capacity
- Files in context
- Recent tool outputs
- Conversation summary

**Interpretation:**

| Usage | Status | Action |
|-------|--------|--------|
| 0-30% | 🟢 Healthy | Continue normally |
| 31-50% | 🟡 Monitor | Be selective about what you add |
| 51-70% | 🟠 Caution | Consider cleanup or reset |
| 71-90% | 🔴 Critical | Immediate cleanup needed |
| 91-100% | ⛔ At capacity | Reset or rewind required |

### Regular Context Checks

**Best practice:** Check context at transition points:

```
# After exploration phase
/context

# Before starting implementation
/context

# After reading multiple files
/context

# When switching to a new feature
/context
```

### Warning Signs

Context may be too large if you notice:

- Responses becoming slower
- Claude missing earlier context
- Repeated information in responses
- Decreased accuracy
- Context nearing 70%+ capacity

---

## Context Optimization Strategies

### Strategy 1: Targeted File Reading

**❌ Too broad:**

```
Read all files in the src/ directory
```

**✅ Targeted:**

```
Read UserService.cs and its interface IUserService.cs
```

**Advanced:**

```
Read the first 100 lines of UserService.cs to understand its structure
```

### Strategy 2: Remove Files When Done

After you're finished with a file:

```
We're done with UserService.cs. You can remove it from context if needed to free up space.
```

Or be explicit:

```
Remove all files from context. We're starting a new feature.
```

### Strategy 3: Summarize Long Conversations

For long-running sessions:

```
Summarize our conversation so far, focusing on the key decisions and implementation details. Then we'll start fresh with that summary.
```

**Claude will:**

1. Create a concise summary
2. You copy the summary
3. Use `/clear` to reset
4. Paste summary to start fresh with clean context

### Strategy 4: Progressive File Loading

Load files as needed, not upfront:

**❌ Front-loading:**

```
Read all controller files, all service files, and all model files so you understand the system
```

**✅ Progressive:**

```
Let's start with the UserController. As we work, we'll look at related files when they become relevant.
```

### Strategy 5: Use Specialized Agents

Agents have separate context windows:

```
# Main session context is getting full
# Delegate specific task to an agent

@code-reviewer review UserService.cs for security issues
```

**Benefits:**

- Agent has its own clean context
- Main session context is preserved
- Parallel work without context pollution

### Strategy 6: Grep Before Reading

Search first, read second:

**❌ Reading blindly:**

```
Read all files that might contain validation logic
```

**✅ Search then read:**

```
Search for "ValidationException" to find validation-related files

[Results: 3 files found]

Now read the Validators/UserValidator.cs file
```

---

## Progressive Disclosure

### The Three-Level Loading Strategy

**Level 1:** Metadata only

```
List the public methods in UserService.cs
```

**Level 2:** Specific sections

```
Show me just the CreateUser method from UserService.cs
```

**Level 3:** Full content

```
Now read the full UserService.cs file
```

### Applying Progressive Disclosure

**Scenario:** Understanding a large codebase

**❌ All at once:**

```
Read all files in src/ so you understand the architecture
```

**✅ Progressive:**

```
# Level 1: Overview
List all files in src/ organized by directory

# Level 2: Structure
For each controller in src/Controllers/, list the public endpoints

# Level 3: Deep dive
Now read UserController.cs as we'll be working on it

# Level 4: Related files
Based on UserController, which service does it use? Read that service file.
```

### Skills Use Progressive Disclosure Automatically

When you use a skill:

**Metadata loaded:** Skill name and description (always in context)
**Instructions loaded:** When skill activates (~5k words)
**Resources loaded:** As Claude determines they're needed

**You don't need to manage this!** Skills handle progressive disclosure automatically.

---

## When to Reset Context

### Using `/rewind`

Go back to a previous state:

```
/rewind
```

**Use when:**

- You want to try a different approach
- Recent changes caused issues
- Context became cluttered with a failed attempt

**Benefits:**

- Preserves most of context
- Removes recent additions
- Quick recovery from mistakes

### Using `/clear`

Complete context reset:

```
/clear
```

**Use when:**

- Starting a completely new task
- Context is critically full (>80%)
- Switching to different part of codebase
- Session has been very long

**Benefits:**

- Fresh, clean context
- Best performance
- No carryover confusion

**Drawbacks:**

- Loses all conversation history
- Must re-establish context
- File reads are lost

**Mitigation:** Summarize before clearing (see Strategy 3 above)

### Strategic Reset Points

**Good times to reset:**

- Between major features
- After completing a self-contained task
- When switching between projects
- Before starting a deep debugging session
- After a long exploratory phase

**Example workflow:**
```
# Phase 1: Exploration and design
[Work on understanding system, propose solution]
/context  # Check: 65% full

# Summarize and reset
Summarize our design decisions and approach

/clear

# Phase 2: Fresh start with summary
[Paste summary]
Now let's implement the user authentication system we designed
```

---

## Advanced Techniques

### Technique 1: Context Budgeting

Allocate context budget by phase:

```
Total: 200k tokens

Phase 1 - Exploration (target: 30k tokens)
- Codebase overview
- Related files
- Architecture understanding

Phase 2 - Implementation (target: 60k tokens)
- Files being modified
- Test files
- Related dependencies

Phase 3 - Testing (target: 40k tokens)
- Test results
- Error messages
- Debugging information

Reserve: 70k tokens for overhead and buffers
```

### Technique 2: Context Checkpointing

Create restore points:

```
# At a good state
Summarize our current implementation status: what's done, what's next, key files and their purposes

# Save that summary
[Copy Claude's summary to a file: context-checkpoint.md]

# Later, if context gets messy
/clear
[Paste checkpoint summary]
Let's continue from where we left off
```

### Technique 3: Two-Session Workflow

Use separate sessions for different concerns:

**Session 1: Research and exploration**

- Understand codebase
- Explore options
- Design approach
- Create summary

**Session 2: Implementation**

- Start fresh with summary from Session 1
- Focus solely on implementation
- Clean context = better code

### Technique 4: File Content Rotation

For long tasks involving many files:

```
# Start
Read FileA.cs, FileB.cs, FileC.cs

# Work with A and B
[Make changes]

# Rotate: Done with A, need D
We're done with FileA.cs. Read FileD.cs which we'll need next.

# Rotate: Done with B, need E
We're done with FileB.cs. Read FileE.cs for the next step.
```

### Technique 5: Context-Aware Skill Design

When creating skills, optimize for context:

**In SKILL.md:**

- Keep instructions lean (<5k words)
- Move detailed info to references/
- Use progressive disclosure principles
- Let Claude load references/ as needed

**Example:**

```markdown
## Database Schema

For complete schema details, see references/schema.md

Key tables:
- Users (id, email, password_hash)
- Orders (id, user_id, total, status)
- Products (id, name, price)
```

Not:

```markdown
## Database Schema

[Paste entire 50-table schema here]
```

---

## Best Practices Summary

### Do

- ✅ **Monitor regularly** - Check `/context` at transition points
- ✅ **Load progressively** - Start with metadata, drill down as needed
- ✅ **Remove when done** - Clear out files no longer needed
- ✅ **Use grep first** - Search before reading
- ✅ **Summarize and reset** - For long sessions, summarize then `/clear`
- ✅ **Use specialized agents** - Delegate to agents for separate contexts
- ✅ **Think ahead** - Plan what context you'll need

### Don't

- ❌ **Don't front-load** - Avoid "read everything" approaches
- ❌ **Don't ignore warnings** - Act when context reaches 70%
- ❌ **Don't keep everything** - Remove files after use
- ❌ **Don't forget to check** - Monitor context size
- ❌ **Don't fear resets** - `/clear` and `/rewind` are your friends
- ❌ **Don't work blind** - Use `/context` to see what's loaded

---

## Context Management Checklist

**Before starting a session:**

- [ ] Clear understanding of what files you'll need
- [ ] Plan to load progressively, not all at once
- [ ] Know when you'll check context size

**During a session:**

- [ ] Check `/context` every 30-60 minutes
- [ ] Remove files when no longer needed
- [ ] Use grep before reading files
- [ ] Consider specialized agents for separate tasks

**When context reaches 50%:**

- [ ] Evaluate what's in context
- [ ] Remove unnecessary files or messages
- [ ] Consider if you should rewind or reset
- [ ] Be selective about new additions

**When context reaches 70%:**

- [ ] Immediate cleanup required
- [ ] Consider `/rewind` to previous state
- [ ] Or summarize and `/clear` for fresh start
- [ ] Finish current task before adding more

**After completing a feature:**

- [ ] Summarize key decisions and implementation
- [ ] Consider `/clear` for next feature
- [ ] Save any important context to files

---

## Resources

- [Claude Code Fundamentals](claude-code-fundamentals.md) - Understanding context window
- [Effective Prompts](effective-prompts.md) - Providing context efficiently
- [Skill Creation Guide](../guides/skill-creation.md) - Progressive disclosure in skills

---

**Key Takeaway:** Context management is like managing RAM—keep only what you need, remove what you're done with, and reset when things get cluttered. Clean context = reliable Claude Code.
