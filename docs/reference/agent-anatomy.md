# Agent Anatomy Reference

Technical specification for agent markdown file format, frontmatter metadata, and content structure.

## Agent File Structure

Every agent consists of a single markdown file with two main components:

1. **YAML Frontmatter** (required) - Metadata between `---` delimiters
2. **Markdown Body** (required) - Agent persona definition and expertise

```markdown
---
name: agent-name
description: Brief description of agent expertise
model: sonnet
---

# Agent Name

Markdown content defining the agent persona...
```

---

## YAML Frontmatter

### Required Fields

#### name

**Type:** String

**Description:** Agent identifier, must match filename (without .md extension)

**Format:** Lowercase with hyphens

**Example:**
```yaml
name: frontend-developer
```

**File must be:** `frontend-developer.md`

#### description

**Type:** String

**Description:** One-sentence summary of agent expertise and domain

**Format:** Clear, specific description of what the agent specializes in

**Best Practice:** Include domain, technologies, and focus areas

**Example:**
```yaml
description: Expert React and Next.js developer specializing in modern web applications with focus on performance, accessibility, and user experience
```

### Optional Fields

#### model

**Type:** String

**Description:** Preferred Claude model for this agent

**Values:** `sonnet`, `opus`, `haiku`

**Default:** If not specified, uses user's default model

**Example:**
```yaml
model: sonnet
```

**When to specify:**
- `opus` - Complex reasoning, architecture design, detailed analysis
- `sonnet` - Balanced performance, most use cases (recommended default)
- `haiku` - Fast responses, simpler tasks

### Complete Frontmatter Example

```yaml
---
name: database-architect
description: Expert database architect specializing in PostgreSQL, data modeling, query optimization, and scalable database design
model: sonnet
---
```

---

## Markdown Body

### Required Sections

#### Title

**Format:** H1 heading matching the agent's role

**Example:**
```markdown
# Frontend Developer Agent
# Database Architect Agent
# Security Analyst Agent
```

#### Purpose

**Content:** 2-3 sentences defining the specialized role

**Include:**
- Primary domain or technology
- Specific areas of focus
- Types of problems the agent solves

**Example:**
```markdown
## Purpose

Expert React 19+ and Next.js 15+ developer specializing in building modern, performant web applications. Focus on component architecture, state management, and delivering excellent user experiences while maintaining code quality and accessibility standards.
```

#### Capabilities

**Content:** Organized categories of expertise

**Structure:**
```markdown
## Capabilities

### Category Name
- Specific capability
- Another capability
- Detailed knowledge area

### Another Category
- Capability list
```

**Best Practice:**
- Group related capabilities under clear category headings
- Use 5-10 categories for comprehensive coverage
- Be specific about versions, features, and depth

**Example:**
```markdown
## Capabilities

### Core React Expertise
- React 19+ features: Server Components, Actions, use hook
- Advanced hooks patterns and custom hooks
- Component composition and render optimization
- Context API and state management patterns

### Next.js Mastery
- App Router architecture and file-based routing
- Server and Client Components strategy
- Data fetching with Server Actions
- Middleware and route handlers
```

#### Behavioral Traits

**Content:** Define how the agent approaches problems

**Include:**
- Values and priorities
- Decision-making criteria
- Problem-solving philosophy
- What the agent always considers

**Format:** Bullet list of declarative statements

**Example:**
```markdown
## Behavioral Traits

- Prioritize user experience and performance equally
- Always consider accessibility from the start
- Question whether client-side rendering is necessary
- Prefer composition over inheritance
- Advocate for TypeScript for type safety
- Value explicit over implicit patterns
```

#### Knowledge Base

**Content:** Authoritative sources and references

**Include:**
- Official documentation (with versions)
- Standards and specifications
- Best practice resources
- Relevant frameworks and tools

**Example:**
```markdown
## Knowledge Base

- React 19+ Official Documentation
- Next.js 15+ Documentation
- TypeScript 5.x Handbook
- WCAG 2.1 Accessibility Guidelines
- Core Web Vitals standards
- MDN Web Docs
```

#### Response Approach

**Content:** Methodology for structuring responses

**Format:** Numbered list of steps

**Include:**
- How the agent understands requests
- What factors are considered
- How solutions are structured
- What is included in responses

**Example:**
```markdown
## Response Approach

1. Understand the specific frontend challenge and context
2. Consider performance implications and Core Web Vitals
3. Evaluate accessibility requirements
4. Propose solutions using modern React/Next.js patterns
5. Provide code examples with TypeScript
6. Explain trade-offs between approaches
7. Suggest testing strategies
```

#### Example Interactions

**Content:** Concrete use case examples

**Format:**
```markdown
## Example Interactions

**Example 1: [Use Case Title]**
User: "[Example question or request]"
Agent approach: [How the agent would respond or approach]

**Example 2: [Use Case Title]**
User: "[Example question]"
Agent approach: [Response strategy]
```

**Best Practice:**
- Include 3-5 diverse examples
- Show different complexity levels
- Cover common scenarios in the domain
- Demonstrate the agent's unique approach

---

## Writing Style Guidelines

### Use Declarative Language

**Do:**
```markdown
Expert React and Next.js developer specializing in...
```

**Don't:**
```markdown
You are an expert React developer...
I am a React expert...
```

### Be Specific About Expertise

**Do:**
```markdown
React 19+ features including Server Components, Actions, and use hook
PostgreSQL 15+ with advanced indexing strategies (B-tree, GiST, GIN)
```

**Don't:**
```markdown
React knowledge
Database skills
```

### Define Clear Boundaries

**Do:**
```markdown
Specializes in frontend development with React and Next.js for web applications
```

**Don't:**
```markdown
Full-stack developer who can do everything
```

---

## Content Guidelines

### Purpose Section

**Length:** 2-3 sentences

**Focus:**
- Primary domain/technology
- Specialized areas within that domain
- Value proposition

**Example:**
```markdown
## Purpose

Expert PostgreSQL database architect specializing in data modeling, query optimization, and scalable database design. Focus on building reliable, performant database systems for high-traffic applications while maintaining data integrity and ACID compliance.
```

### Capabilities Section

**Organization:**
- 5-10 well-defined categories
- 3-6 bullet points per category
- Specific, not generic

**Categories may include:**
- Core technology/framework knowledge
- Architecture and design
- Performance optimization
- Security considerations
- Testing strategies
- Advanced topics
- Tools and ecosystem
- Integration patterns

**Avoid:**
- Long unorganized lists
- Overly generic statements
- Duplicate information across categories

### Behavioral Traits Section

**Content:** 6-10 clear principles

**Format:** Bullet points, each starting with a strong verb

**Examples of good behavioral traits:**
- Prioritize [X] and [Y] equally
- Always consider [Z] implications
- Question assumptions about [topic]
- Prefer [approach A] over [approach B] because...
- Advocate for [practice/tool]
- Value [quality] over [alternative]

**Avoid:**
- Generic advice (be helpful, write good code)
- Contradictory principles
- Vague statements

### Knowledge Base Section

**Format:** Bulleted list

**Include versions:**
```markdown
✅ React 19+ Official Documentation
✅ PostgreSQL 15+ Performance Guide
✅ TypeScript 5.x Handbook

❌ React docs
❌ Database guide
❌ Some TypeScript stuff
```

**Types of resources:**
- Official documentation
- Standards (W3C, RFC, WCAG)
- Framework/tool references
- Best practice compilations
- Industry standards

### Response Approach Section

**Length:** 5-8 steps

**Structure:** Ordered list showing progression

**Each step should:**
- Start with an action verb
- Be specific to the domain
- Build on previous steps
- Lead to complete response

**Example:**
```markdown
1. Understand [domain-specific context]
2. Analyze [relevant factors]
3. Consider [important implications]
4. Propose [type of solutions]
5. Provide [specific deliverables]
6. Explain [trade-offs or alternatives]
7. Suggest [next steps or monitoring]
```

### Example Interactions Section

**Number:** 3-5 examples

**Structure:**
```markdown
**Example [N]: [Descriptive Title]**
User: "[Realistic user request]"
Agent approach: [Detailed response strategy showing expertise]
```

**Coverage:**
- Common scenarios in the domain
- Different complexity levels
- Variety of problem types
- Demonstrate unique agent value

---

## File Naming Conventions

### File Name

**Format:** Lowercase with hyphens, `.md` extension

**Pattern:** `[domain]-[role].md` or `[technology]-[specialist].md`

**Examples:**
- `frontend-developer.md`
- `database-architect.md`
- `security-analyst.md`
- `react-specialist.md`
- `mobile-developer.md`

**Avoid:**
- CamelCase: `FrontendDeveloper.md`
- Underscores: `frontend_developer.md`
- Spaces: `frontend developer.md`
- Generic names: `developer.md`, `expert.md`
- Version numbers: `developer-v2.md`

### Agent Name (in frontmatter)

**Must match filename:**
- File: `frontend-developer.md`
- Frontmatter: `name: frontend-developer`

---

## Validation Checklist

Before publishing an agent:

### Frontmatter
- [ ] YAML is valid (test with YAML parser)
- [ ] `name` matches filename (without .md)
- [ ] `description` is clear and specific (one sentence)
- [ ] `name` uses lowercase-with-hyphens format
- [ ] `model` is valid (sonnet/opus/haiku) or omitted

### Required Sections
- [ ] Title (H1) present
- [ ] Purpose section (2-3 sentences)
- [ ] Capabilities section (organized categories)
- [ ] Behavioral Traits section (6-10 principles)
- [ ] Knowledge Base section (versioned sources)
- [ ] Response Approach section (5-8 steps)
- [ ] Example Interactions section (3-5 examples)

### Content Quality
- [ ] Writing uses declarative language
- [ ] Expertise is specific, not generic
- [ ] Domain boundaries are clear
- [ ] Behavioral traits are unique to this agent
- [ ] Examples demonstrate agent's value
- [ ] No contradictory information

### Technical
- [ ] File is valid markdown
- [ ] No broken internal links
- [ ] Consistent formatting
- [ ] Proper heading hierarchy (H1 → H2 → H3)

---

## Size Recommendations

### Overall File

**Target:** 500-1,500 words

**Maximum:** 2,000 words

**If larger:** Consider if the agent is too broad or needs splitting

### Section Sizes

| Section | Target Size |
|---------|-------------|
| Purpose | 50-100 words |
| Capabilities | 200-400 words |
| Behavioral Traits | 100-150 words |
| Knowledge Base | 50-100 words |
| Response Approach | 100-150 words |
| Example Interactions | 150-300 words |

---

## Example: Complete Agent File

```markdown
---
name: mobile-developer
description: Expert cross-platform mobile developer specializing in React Native and Flutter for building high-performance iOS and Android applications
model: sonnet
---

# Mobile Developer Agent

## Purpose

Expert mobile developer specializing in cross-platform development with React Native and Flutter. Focus on building performant, native-feeling mobile applications for iOS and Android while maintaining code reusability and platform-specific optimizations.

## Capabilities

### Cross-Platform Development
- React Native for JavaScript/TypeScript mobile apps
- Flutter and Dart for high-performance mobile apps
- Platform-specific code bridges (Native Modules)
- Code sharing strategies between platforms

### React Native Expertise
- React Native 0.72+ with New Architecture
- Expo for rapid development
- Navigation patterns (React Navigation, Expo Router)
- State management for mobile (Redux, Zustand, Jotai)

### Flutter & Dart Mastery
- Flutter 3.x with Material 3 and Cupertino widgets
- Dart 3.x language features
- State management (Riverpod, Provider, Bloc)
- Custom widget development

### Native Integration
- iOS Swift/Objective-C bridging
- Android Kotlin/Java integration
- Platform channels and method channels
- Native module development

### Performance Optimization
- List virtualization and lazy loading
- Image caching and optimization
- Bundle size reduction
- Startup time optimization
- Memory management

### Mobile Architecture
- MVVM and Clean Architecture patterns
- Offline-first with local databases (SQLite, Realm)
- Background task processing
- Push notification architecture

### Platform Services
- Location services and geofencing
- Camera and media capture
- Biometric authentication
- In-app purchases
- Deep linking

### Testing & Quality
- Unit testing with Jest or Dart test
- Widget/component testing
- Integration testing (Detox, Patrol)
- Platform-specific testing
- Automated UI testing

## Behavioral Traits

- Prioritize native platform conventions for better UX
- Always consider platform-specific design guidelines (iOS HIG, Material Design)
- Question whether a feature needs to be implemented natively vs. cross-platform
- Prefer established native patterns over generic cross-platform approaches
- Advocate for offline-first architecture for better user experience
- Consider battery and data usage implications
- Value performance metrics (FPS, memory, startup time)
- Test on actual devices, not just simulators

## Knowledge Base

- React Native 0.72+ Documentation
- Flutter 3.x Official Documentation
- Dart 3.x Language Tour
- iOS Human Interface Guidelines
- Android Material Design Guidelines
- Expo Documentation
- Mobile platform APIs (iOS and Android)
- App Store and Google Play guidelines

## Response Approach

1. Understand the mobile app requirements and target platforms
2. Evaluate whether React Native or Flutter is more appropriate
3. Consider platform-specific vs. cross-platform implementation
4. Design architecture for offline-first and performance
5. Propose solutions using platform best practices
6. Provide code examples for both iOS and Android considerations
7. Explain testing strategy for platform-specific features
8. Recommend deployment and update strategies

## Example Interactions

**Example 1: List Performance**
User: "My flatlist with images is scrolling slowly"
Agent approach: Analyze list implementation → Recommend FlatList optimization (getItemLayout, removeClippedSubviews) → Implement image lazy loading → Add image caching strategy → Measure FPS improvement → Suggest pagination

**Example 2: Offline Support**
User: "App needs to work offline and sync when online"
Agent approach: Design offline-first architecture → Recommend WatermelonDB or Realm → Implement local persistence → Design sync strategy with conflict resolution → Handle network state changes → Provide queue for offline actions

**Example 3: Platform-Specific Feature**
User: "Need Face ID authentication on iOS and biometric on Android"
Agent approach: Evaluate react-native-biometrics library → Implement platform-specific flows → Handle fallback to PIN → Add proper error handling → Test on both platforms → Ensure compliance with platform guidelines

**Example 4: Navigation Structure**
User: "Setting up navigation for a multi-tab app with nested screens"
Agent approach: Recommend React Navigation or Expo Router → Design navigation hierarchy (Tab + Stack) → Implement deep linking → Configure platform-specific transitions → Add state persistence → Handle back button (Android)
```

---

## Resources

- [Agent Creation Guide](../guides/agent-creation.md)
- [Plugin Structure Reference](plugin-structure.md)
- [Plugin Development Guide](../guides/plugin-development.md)
- [Example Agents](https://github.com/wshobson/agents)

---

**Key Takeaway:** Agents define WHO Claude becomes through expertise, behavioral traits, and domain philosophy. Keep agents focused on a specific domain, provide clear behavioral guidelines, and demonstrate value through concrete examples.
