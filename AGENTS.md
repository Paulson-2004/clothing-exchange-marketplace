# Rules for AI Coding Agents

When contributing to ReWear, AI coding agents must follow these safe development practices:

- **Inspect Before Modifying**: Always read the relevant existing files and documentation before making changes.
- **Preserve Existing Architecture**: Maintain the current architecture and functionality. Do not redesign components unnecessarily.
- **Do Not Invent**: Never invent APIs, database fields, environment variables, or features that don't exist.
- **Make Focused Changes**: Keep modifications targeted and avoid broad regex replacements across files.
- **Preserve Security**: Do not compromise existing authentication (`HttpOnly` cookies, JWT) or authorization flows. Never expose secrets.
- **Test and Build**: Run existing integration tests and `npm run build` after making changes to verify compilation.
- **Review Changes**: Always review `git diff` to ensure no unintended modifications were introduced.
- **Real Browser QA**: Perform actual visual testing for UI changes.
- **Use Microsoft Edge**: Use Microsoft Edge for the established browser QA workflow via MCP. Do not assume UI changes are safe without rendering them.
- **Update Documentation**: When significant architectural, API, or database changes are made, update the `/docs` accordingly.
