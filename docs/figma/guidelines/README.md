# Figma library guidelines

The five numbered files here are uploaded to the published Figma library. Figma
hands them to its agent in the background whenever someone asks it to design with
the library, so they are the only place that carries the rules the variants cannot:
which component to reach for, which props exist, which tokens are allowed, and the
mistakes to avoid.

They are generated. Do not edit them by hand — change the source and run:

```bash
npm run figma:guidelines
```

| File | Comes from |
| --- | --- |
| `01-rules.md` | written in the generator; the Button pairs are read out of `contracts/button.json` |
| `02-tokens.md` | `src/tokens/semantic.css`, `src/tokens/primitives.css`, `src/tokens/layout.css`, `contracts/layout.json` |
| `03-components.md` | every component contract in `contracts/` |
| `04-patterns.md` | every pattern contract in `contracts/` |
| `05-antipatterns.md` | written in the generator |

## Uploading

Open the library's Figma Design file, then file menu > Library >
**Manage guidelines...** > Upload, and Apply changes. Replacing a file keeps the
same slot; removing one stops the agent using it.

Needs a Professional, Organization or Enterprise plan and edit access to the
library file. Upload is manual while the feature is in beta, so it is step 9 of
[RELEASING.md](../../../RELEASING.md).

## Limits

Figma asks for three to eight files, under 100 KB in total, and caps a library at
200 KB. The generator prints the size of each file and the total, and fails if the
total goes over the cap. Prompts against a library with guidelines use more AI
credits, and repeating the same guidance across files costs more again — which is
why the token lists collapse the category hues into one line and the component
sizes are left to the components.

Guidelines on a Figma Design library are not used when making a Make kit.
