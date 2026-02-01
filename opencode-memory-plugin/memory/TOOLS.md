# Tool Usage Conventions & Notes

## Memory Tools

### memory_write
- **Use when**: Saving preferences, successful patterns, decisions, lessons learned
- **Always save**: User preferences, project conventions, working patterns
- **Types**:
  - `long-term`: Persistent memories (MEMORY.md)
  - `daily`: Running context (memory/YYYY-MM-DD.md)
  - `preference`: User preferences (PREFERENCES.md - use `preference` type)
- **Best practice**: Save immediately after important information is shared

### memory_read
- **Use when**: Retrieving saved information, checking past decisions
- **Types**: long-term, daily, preference, personality, context
- **Best practice**: Read before making decisions to maintain consistency

### memory_search
- **Use when**: Finding relevant past information with different wording
- **Scope**: all (searches everything), long-term, daily, preference
- **Best practice**: Use semantic search to find patterns you forgot existed

### vector_memory_search
- **Use when**: Semantic search across memory when exact words don't match
- **Returns**: Ranked results with similarity scores
- **Best practice**: First choice for finding relevant context

## File Tools

### read
- **Always use absolute paths**
- **Use offset/limit** for large files
- **Read multiple files in parallel** when possible

### write
- **Always read file first** before writing
- **Use descriptive commit messages** if applicable
- **Never overwrite without confirmation** for important files

### edit
- **Preserve exact indentation** after line numbers
- **Use larger context** for unique matches
- **Consider file structure** before editing

## Bash Tools

### Safe Commands
- `git status`, `git log` - Always allowed
- `ls`, `grep`, `find` - Safe exploration
- `git diff` - Always review before changes

### Ask Before
- `git push`, `git rebase` - Destructive operations
- `npm install`, `cargo build` - Dependency changes
- `rm`, `mv` with wildcards - Destructive file operations

### Background Processes
- Use `&` for long-running services
- Check with `ps` after starting
- Kill properly with `pkill` or `kill <pid>`

## Patterns

### Code Review
1. Read the file
2. Check memory for similar issues
3. Search for relevant past solutions
4. Provide specific feedback
5. Save any new patterns to memory

### Feature Implementation
1. Search memory for similar features
2. Check project conventions in memory
3. Implement following established patterns
4. Test thoroughly
5. Save successful approach to memory

### Debugging
1. Search memory for similar issues
2. Check if issue was solved before
3. If new, document the problem
4. Implement and test solution
5. Save the solution to memory

## Conventions

- **Code style**: Check memory first, follow existing patterns
- **Commit messages**: Follow project conventions
- **Documentation**: Always document complex logic
- **Testing**: Test critical paths, document edge cases
