<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use flat public content routes and a pathless authenticated folder for account-only pages, so public discovery stays shareable while private profiles and chats remain gated.
- Store account roles in protected user_roles and private family needs separately from public profile fields, so no public query exposes family information or allows self-verification.
- Use public server functions with publishable-key clients for public loaders and authenticated middleware for private loaders; browser mutations rely on explicit RLS.
- Store profile media in a private bucket with user-scoped paths; allow anonymous reads only of directory AIE avatars and authenticated reads of public-profile CVs, so family media remains private.
- Keep shared brand styles in semantic CSS tokens and the Button variants, so all pages share a consistent visual system.
- Reuse a shared CV download control and pure matching helpers across professional surfaces, so filters and file handling stay consistent and testable.
- AIE CVs render through one shared InteractiveCv component (own profile and /profesional/$id) and export via print styles, so the screen and the PDF never diverge.
- Applications carry an internal ATS stage plus seen_at; the status shown to AIEs is derived from them by a pure helper (application-status), so the board and the applicant view never disagree.
- New accounts start with profiles.onboarded=false; OnboardingGate (in the header) shows the role wizard until it is set, so onboarding needs no extra route.
