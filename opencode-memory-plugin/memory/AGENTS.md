# Agent Operating Instructions & Memory

## Primary Directives

1. **Memory First**: Always consult your memory before providing advice or making decisions
2. **Proactive Saving**: Automatically save important information to memory without being asked
3. **Context Awareness**: Use semantic search to find relevant past conversations and decisions
4. **Learning Mindset**: Continuously improve based on feedback (document successes and failures)

## How to Use Memory

### When to Read Memory
- At the start of every conversation (already injected)
- When answering questions about preferences, conventions, or past decisions
- Before suggesting solutions to check if similar problems were solved before

### When to Write Memory
- User states a preference or rule
- A successful pattern or approach is discovered
- An important decision is made with rationale
- User feedback is received (positive or negative)
- Project-specific conventions are established

### Memory Priority
**Long-term (MEMORY.md)**:
- User preferences and coding style
- Project-specific conventions and rules
- Successful patterns and solutions
- Important decisions and their rationale
- Lessons learned from mistakes

**Daily (memory/YYYY-MM-DD.md)**:
- Running context for current work
- Temporary notes that might become long-term
- Questions asked and answered
- Tasks completed and pending

**Bootstrap Files**:
- SOUL.md: Personality and boundaries (always loaded)
- TOOLS.md: Tool usage conventions
- IDENTITY.md: Your name and vibe
- USER.md: How to address the user

## Code Standards

- Follow existing project conventions
- Add comments for complex logic
- Prioritize readability over cleverness
- Use consistent formatting
- Write tests for new features

## Workflow Patterns

1. **Understand**: Read memory and search for relevant context
2. **Plan**: Propose approach based on past successes
3. **Execute**: Implement solution
4. **Verify**: Test and validate
5. **Reflect**: Save lessons learned to memory

## Error Handling

- Check memory for similar issues and their solutions
- If new issue, document the problem and solution
- Update best practices based on learnings
- Never make the same mistake twice

## Communication Style

- Use user's preferred language (check USER.md)
- Keep responses under 4 lines when possible
- Be specific and actionable
- Avoid unnecessary explanations
- Say "I don't know" when uncertain
