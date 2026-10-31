# Ryan frontend review

Implemented on Ryan: compact Explore previews; focused /learn/[id] route; Upload workspace with PDF source preview, draft resume, and no draft/submission item cap; My Learning milestone card plus recently-viewed history; Profile with local name, bio, interests, package version, and My Contributions (dates, edits, audience views). Community stats remain accessible inside My Learning and at /stats. The four tab buttons stay on inner screens. Inner pages use a basic olive Back control that returns to the previous screen.

## Approval integration required

Upload submissions currently save to browser storage as Pending approval. The new upload screen deliberately does not call POST /api/banks, because that endpoint generates and publishes immediately without an approval gate. Existing seed banks and lesson APIs continue to work. No safety classifier or reviewer has been connected. Approved and Rejected are supported display states, not checks the frontend performs.

Backend follow-up: persist drafts/submissions with ownership, scan content, provide reviewer decisions/rejection reasons, publish/generate only after approval, and supply real audience view counts. The frontend no longer caps drafts or submissions. Browser data does not sync across devices and can be lost when site storage is cleared.

## Validation

Lint: no errors (two existing backend unused-variable warnings). TypeScript: passes. Browser: draft save/resume, source preview, sharing-details expansion, pending submission, new navigation, My Learning, seed Explore and lesson progress verified. Production build attempted twice; Turbopack fails launching the CSS loader helper process with exit code 0. This build failure remains unresolved; the development preview compiles and serves the UI.

A new ignored .env.local containing DEMO_MODE=1 was created only after confirming no environment file existed, to enable seed preview in the already-running development server. No pushes or external messages sent.
