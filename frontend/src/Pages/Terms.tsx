import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../Components/Navbar";
import { SketchParticles } from "../Components/UI/SketchParticles";

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col relative transition-colors selection:bg-(--accent-primary) selection:text-white">
      <SketchParticles />
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 md:py-16 relative z-10">
        <div className="mb-8 border-b-2 border-dashed border-(--border-strong) pb-6 relative">
          <div className="drafting-tape-tl" />
          <h1 className="text-4xl font-bold font-pencil tracking-tight text-(--text-primary) mb-2">
            Terms of Service
          </h1>
          <p className="text-xs text-(--text-muted) font-mono">
            <strong>Last Updated:</strong> November 15, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-(--text-secondary)">
          <p>
            Welcome to Sketch ("Sketch," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the Sketch website, drawing tools, workspaces, and collaboration features (collectively, the "Service").
          </p>

          <p>
            By accessing or using Sketch, you agree to these Terms. If you do not agree, do not use the Service.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">1. Eligibility and Accounts</h2>
            <p>
              You must be legally permitted to use the Service under applicable law. If you are under the age at which you can independently agree to these Terms, you may use the Service only with any legally required permission or supervision.
            </p>
            <p>You agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate information when creating an account.</li>
              <li>Keep your login credentials secure.</li>
              <li>Notify us of suspected unauthorized account access.</li>
              <li>Accept responsibility for activity conducted through your account, subject to applicable law.</li>
            </ul>
            <p>
              We may restrict or suspend accounts where reasonably necessary to protect users, the Service, or comply with legal obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">2. Using Sketch</h2>
            <p>
              Sketch provides tools for creating, editing, saving, exporting, and collaborating on digital drawings and diagrams.
            </p>
            <p>
              Subject to these Terms, you may use the Service for lawful personal, educational, and professional purposes.
            </p>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use Sketch for unlawful, fraudulent, or harmful activities.</li>
              <li>Attempt to access accounts, workspaces, or data without authorization.</li>
              <li>Bypass access controls or interfere with permission checks.</li>
              <li>Disrupt, overload, reverse engineer, or exploit the Service in ways prohibited by applicable law.</li>
              <li>Upload, transmit, or distribute malicious code through supported features.</li>
              <li>Abuse invitations, collaboration tools, or other users.</li>
              <li>Use the Service in a way that infringes another person's rights.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">3. Your Content and Ownership</h2>
            <p>
              You retain ownership of the drawings, text, diagrams, and other content you create using Sketch, to the extent you own the rights to that content.
            </p>
            <p>
              You are responsible for ensuring that you have the rights and permissions needed to create, share, export, and distribute your content.
            </p>
            <p>
              By using Sketch, you grant us a limited, non-exclusive permission to host, store, process, reproduce, and transmit your content as reasonably necessary to operate, secure, and provide the Service and its features. This permission is not a transfer of ownership and ends when the relevant processing or retention is no longer necessary, subject to applicable legal and technical requirements.
            </p>
            <p>
              You must not use Sketch to infringe copyrights, trademarks, privacy rights, or other legal rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">4. Sharing and Collaboration</h2>
            <p>
              Sketch may allow you to invite other users to view or edit your workspaces.
            </p>
            <p>If you own or manage a workspace, you are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Inviting only people you intend to grant access to.</li>
              <li>Assigning appropriate permissions.</li>
              <li>Reviewing workspace membership and access settings.</li>
              <li>Revoking access when it is no longer needed.</li>
            </ul>
            <p>
              Viewers may access workspace content without editing it, while editors may make changes within their permitted capabilities.
            </p>
            <p>
              Removing a collaborator or revoking an invitation may not undo changes already made or remove copies previously exported by that collaborator.
            </p>
            <p>
              You must not use sharing features to expose information without authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">5. Acceptable Content</h2>
            <p>
              You may not use Sketch to create, store, or distribute content that violates applicable law or infringes the rights of others.
            </p>
            <p>
              We may investigate credible reports of abuse and take appropriate action, including restricting access to content or accounts where legally permitted or required.
            </p>
            <p>
              We do not promise to monitor every drawing or review all user content.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">6. Exports and Downloads</h2>
            <p>
              Sketch may provide export options such as PNG, SVG, and PDF.
            </p>
            <p>
              Exported files may differ from the on-screen canvas due to format limitations, unsupported features, fonts, rendering differences, or other technical factors.
            </p>
            <p>
              You are responsible for reviewing exported files before using or distributing them. Exporting content does not transfer ownership of that content or grant rights to third-party material included in it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">7. Availability and Changes</h2>
            <p>
              We aim to keep Sketch reliable and accessible but do not guarantee uninterrupted or error-free operation.
            </p>
            <p>
              Features may change, be temporarily unavailable, or be discontinued as the Service develops. We may perform maintenance, fix defects, or introduce updates without advance notice where permitted by law.
            </p>
            <p>
              You should keep independent copies of important work. Do not rely on Sketch as the sole storage location for critical files unless a separate written agreement explicitly provides otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">8. Third-Party Services</h2>
            <p>
              Sketch may integrate with or rely on third-party infrastructure and services. We are not responsible for independent third-party products or websites beyond the responsibilities imposed on us by applicable law.
            </p>
            <p>
              Your use of a third-party service may be governed by that provider's own terms and policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">9. Suspension and Termination</h2>
            <p>
              You may stop using Sketch at any time.
            </p>
            <p>
              We may suspend or terminate access when reasonably necessary for security, legal compliance, serious violations of these Terms, or protection of the Service and its users.
            </p>
            <p>
              Where appropriate and legally permitted, we will provide notice and an opportunity to resolve the issue.
            </p>
            <p>
              After termination, your ability to access your account, drawings, and workspaces may end. Any content retention or deletion will be handled in accordance with our Privacy Policy and applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">10. Disclaimer of Warranties</h2>
            <p>
              To the extent permitted by law, Sketch is provided on an "as available" and "as is" basis. We do not guarantee that the Service will always be uninterrupted, secure, error-free, or suitable for every particular purpose.
            </p>
            <p>
              Nothing in these Terms excludes warranties or consumer rights that cannot lawfully be excluded.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Sketch and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or business opportunities arising from your use of the Service.
            </p>
            <p>
              Nothing in these Terms limits liability where such limitation is prohibited by law, including liability that cannot legally be excluded or restricted.
            </p>
            <p>
              Where liability may lawfully be limited, the applicable limit will be determined in accordance with the law governing these Terms and the circumstances of the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">12. Indemnification</h2>
            <p>
              To the extent permitted by applicable law, you agree to be responsible for claims, losses, or expenses arising from your unlawful use of the Service, your infringement of another person's rights, or your material violation of these Terms.
            </p>
            <p>
              This section does not apply to the extent a claim results from conduct for which you cannot legally be held responsible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">13. Privacy</h2>
            <p>
              Your use of Sketch is also subject to our Privacy Policy, which explains how we handle personal information.
            </p>
            <p>
              <strong>Privacy Policy:</strong> <Link to="/privacy" className="text-(--accent-primary) hover:underline">/privacy</Link>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">14. Changes to These Terms</h2>
            <p>
              We may update these Terms to reflect changes to the Service, business practices, or applicable law.
            </p>
            <p>
              We will update the "Last Updated" date when changes are made and provide additional notice where legally required. Continued use after updated Terms take effect constitutes acceptance only to the extent recognized under applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">15. Governing Law and Disputes</h2>
            <p>
              These Terms are governed by the laws of [Applicable Jurisdiction], without overriding any mandatory rights or protections that apply to you under local law.
            </p>
            <p>
              Disputes will be handled by the courts or other dispute-resolution bodies with jurisdiction under applicable law.
            </p>
            <p className="text-xs text-(--text-muted) italic">
              <strong>Important:</strong> Complete this section with the jurisdiction and dispute-resolution terms appropriate to the operator and users of Sketch.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-(--border-subtle) flex items-center justify-between text-xs text-(--text-muted) font-mono">
          <span>Sketch • Collaborative Canvas</span>
          <Link to="/" className="text-(--accent-primary) hover:underline">
            Return to Home
          </Link>
        </div>
      </main>
    </div>
  );
};
export default Terms;
