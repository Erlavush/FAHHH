# MCP Setup

This repo benefits most from a layered MCP stack instead of one all-purpose server. The goal is to give AI tools four kinds of intelligence:

- version-aware library docs
- upstream repo docs and code search
- live browser/runtime inspection
- optional scene-graph-specific Three.js inspection

## Recommended Stack

### 1. Context7

Use Context7 as the default docs source for library/API questions. It is the best fit for pulling current, version-aware docs and examples into AI context.

Resolve these libraries first for this repo:

- `three` (`^0.173.0`)
- `@react-three/fiber` (`^8.17.14`)
- `@react-three/drei` (`^9.122.0`)
- `@react-three/postprocessing` (`^2.19.1`)
- `postprocessing` (`^6.38.3`)
- `react` (`^18.3.1`)
- `vite` (`^6.0.1`)
- `leva` (`^0.10.1`)
- `firebase` (`^11.0.2`)

Best use cases:

- current API lookups
- version-specific examples
- migration and configuration questions
- verifying whether an API or prop actually exists

### 2. GitMCP

Use GitMCP for upstream docs, manual pages, example code, and repo-level search against the projects this game depends on.

Recommended remote servers:

- `https://gitmcp.io/mrdoob/three.js`
- `https://gitmcp.io/pmndrs/react-three-fiber`
- `https://gitmcp.io/pmndrs/drei`
- `https://gitmcp.io/docs` as a generic fallback for public GitHub repos

Best use cases:

- three.js manual/reference questions
- finding example implementations upstream
- checking how pmndrs packages structure real examples
- exposing this repo's own docs once it is public on GitHub

### 3. Chrome DevTools MCP

Use Chrome DevTools MCP for runtime truth. This is the baseline browser-debugging MCP for this project.

Best use cases:

- screenshots and visual verification
- console/runtime errors
- DOM overlays and UI state
- network/assets loading
- performance traces
- confirming whether a rendering bug is real versus a code-reading assumption

### 4. threejs-devtools-mcp

Treat `threejs-devtools-mcp` as optional and experimental. It is promising for scene-specific debugging, but it should complement the stack above, not replace it.

Best use cases:

- scene graph inspection
- transform and visibility debugging
- material/shader inspection
- camera/frustum debugging when browser tools are not enough

Recommended stance:

- install only after the baseline stack is working
- use it for deep scene issues, not generic docs lookup
- keep Chrome DevTools MCP as the primary runtime debugger

## Suggested MCP Config

Adapt this to your MCP client's config format:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    },
    "gitmcp-three": {
      "url": "https://gitmcp.io/mrdoob/three.js"
    },
    "gitmcp-r3f": {
      "url": "https://gitmcp.io/pmndrs/react-three-fiber"
    },
    "gitmcp-drei": {
      "url": "https://gitmcp.io/pmndrs/drei"
    }
  }
}
```

Add `threejs-devtools-mcp` separately after validating its current README and install flow.

## Recommended Agent Behavior

For this repo, the highest-signal default behavior is:

- use local repo docs first for project-specific questions
- use Context7 for library/API questions
- use GitMCP for upstream examples and reference pages
- use Chrome DevTools MCP first for runtime or rendering bugs
- use Three.js scene-devtools only when the issue is clearly scene-graph-specific

## Repo-Local AI Context To Keep

Even with MCPs, the most important project-specific context should stay in this repo:

- [llms.txt](/Z:/FAHHHH/llms.txt)
- [AI_HANDOFF.md](/Z:/FAHHHH/docs/AI_HANDOFF.md)
- [CODEBASE_MAP.md](/Z:/FAHHHH/docs/CODEBASE_MAP.md)
- [CURRENT_SYSTEMS.md](/Z:/FAHHHH/docs/CURRENT_SYSTEMS.md)

This keeps AI tools grounded in the actual game architecture before they reach for upstream docs.

## Practical Rollout Order

1. Install `Context7`.
2. Install `Chrome DevTools MCP`.
3. Add the three GitMCP remotes for `three.js`, `react-three-fiber`, and `drei`.
4. Use this stack for a week.
5. Add `threejs-devtools-mcp` only if scene-specific debugging still feels bottlenecked.

## Upstream References

- [Context7 docs](https://context7.com/docs/overview)
- [Context7 GitHub](https://github.com/upstash/context7)
- [GitMCP](https://gitmcp.io/)
- [GitMCP GitHub](https://github.com/idosal/git-mcp)
- [Chrome DevTools MCP GitHub](https://github.com/mcp/chromedevtools/chrome-devtools-mcp)
- [threejs-devtools-mcp repository](https://github.com/DmitriyGolub/threejs-devtools-mcp)