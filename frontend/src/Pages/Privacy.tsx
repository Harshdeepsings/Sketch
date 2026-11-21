import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../Components/Navbar";
import { SketchParticles } from "../Components/UI/SketchParticles";

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col relative transition-colors selection:bg-(--accent-primary) selection:text-white">
      <SketchParticles />
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 md:py-16 relative z-10">
        <div className="mb-8 border-b-2 border-dashed border-(--border-strong) pb-6 relative">
          <div className="drafting-tape-tl" />
          <h1 className="text-4xl font-bold font-pencil tracking-tight text-(--text-primary) mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs text-(--text-muted) font-mono">
            <strong>Last Updated:</strong> November 15, 2026
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-(--text-secondary)">
          <p>
            Welcome to Sketch ("Sketch," "we," "our," or "us"). We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect information when you use our website, drawing tools, and collaboration features (collectively, the "Service").
          </p>

          <p>
            By using Sketch, you acknowledge that you have read this Privacy Policy.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">1. Information We Collect</h2>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-(--text-primary)">1.1 Account Information</h3>
              <p>When you create an account, we may collect information such as:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your name or display name.</li>
                <li>Your email address.</li>
                <li>Authentication information, including securely stored password hashes.</li>
                <li>Account preferences and settings.</li>
              </ul>
              <p>We do not need to store your plain-text password.</p>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold text-(--text-primary)">1.2 Drawing and Workspace Data</h3>
              <p>When you create or edit drawings, we may store:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Drawing objects, including shapes, lines, text, colors, and coordinates.</li>
                <li>Canvas settings, layers, and other supported drawing properties.</li>
                <li>Workspace names, ownership details, and timestamps.</li>
                <li>Version history or undo-related data, if supported by the Service.</li>
              </ul>
              <p>
                Drawings are stored as structured drawing data so they can be reopened and edited rather than being stored solely as screenshots.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold text-(--text-primary)">1.3 Collaboration Information</h3>
              <p>When you use collaboration features, we may process:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Workspace membership and invitation information.</li>
                <li>Access permissions, such as viewer or editor roles.</li>
                <li>Changes made to shared drawings.</li>
                <li>Information needed to synchronize collaborative editing.</li>
              </ul>
              <p>
                People with access to a shared workspace may be able to view or modify its contents according to their assigned permissions.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-semibold text-(--text-primary)">1.4 Technical Information</h3>
              <p>When you access Sketch, our infrastructure or service providers may process technical information such as:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>IP address and basic browser or device information.</li>
                <li>Connection logs, timestamps, and error reports.</li>
                <li>Security events and information needed to diagnose technical problems.</li>
              </ul>
              <p>The exact information collected depends on our hosting, monitoring, and security configuration.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage user accounts.</li>
              <li>Save, display, and restore drawings.</li>
              <li>Provide real-time collaboration and workspace sharing.</li>
              <li>Authenticate users and enforce access permissions.</li>
              <li>Generate drawing exports, including PNG, SVG, and PDF where supported.</li>
              <li>Maintain, troubleshoot, and improve the Service.</li>
              <li>Detect abuse, protect accounts, and maintain system security.</li>
              <li>Respond to support requests and comply with applicable legal obligations.</li>
            </ul>
            <p>
              We do not claim to use your drawings for advertising or AI training unless we explicitly disclose that practice and have an appropriate legal basis.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">3. How We Store and Protect Your Information</h2>
            <p>
              Sketch may use a database and third-party infrastructure providers to store account information, workspace data, and drawing content.
            </p>
            <p>
              We use reasonable technical and organizational safeguards appropriate to the Service. These may include password hashing, authenticated sessions or tokens, access controls, secure connections, and server-side permission checks.
            </p>
            <p>
              No online service can guarantee absolute security. You are responsible for keeping your account credentials confidential and notifying us if you suspect unauthorized access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">4. Drawing Privacy and Sharing</h2>
            <p>
              Your drawings may be private to your account or shared with other users through collaboration features.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Private workspaces:</strong> Access should be limited to authorized users according to the Service's access controls.</li>
              <li><strong>Shared workspaces:</strong> Invited users may access content according to their assigned roles.</li>
              <li><strong>Viewer access:</strong> Allows viewing without editing, where supported.</li>
              <li><strong>Editor access:</strong> Allows editing and other permitted changes.</li>
              <li><strong>Invitation management:</strong> Workspace owners may be able to revoke invitations or remove members, depending on the available features.</li>
            </ul>
            <p>
              Do not assume that a drawing is private if you have shared it with others. Recipients may be able to copy, export, or otherwise retain content they can access.
            </p>
            <p>
              Sketch should not be considered a secure end-to-end encrypted storage service unless that capability is explicitly implemented and documented.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">5. Cookies and Authentication</h2>
            <p>
              Sketch and its infrastructure providers may use cookies, local storage, or similar technologies to maintain authentication, remember preferences, and protect the Service.
            </p>
            <p>
              The technologies used depend on the application's implementation. You can manage cookies through your browser, but disabling certain technologies may affect login or other features.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">6. Third-Party Services</h2>
            <p>
              Sketch may rely on third-party services for hosting, database storage, authentication-related infrastructure, error monitoring, or other operational functions.
            </p>
            <p>
              These providers may process information on our behalf to deliver their services. Their handling of information is also subject to their applicable policies and contractual obligations.
            </p>
            <p>
              We will identify relevant providers here when applicable: [List actual service providers and relevant privacy links].
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">7. Data Retention and Deletion</h2>
            <p>
              We retain information for as long as reasonably necessary to provide the Service, maintain account security, resolve disputes, and meet applicable legal obligations.
            </p>
            <p>
              You may request account or data deletion by contacting us at [Privacy Contact Email]. We will explain any applicable verification steps, retention requirements, and limitations.
            </p>
            <p>
              Deleting an account may affect access to drawings and workspaces associated with it. Shared drawings, backups, or records retained for legal or security reasons may not be deleted immediately, where retention is permitted or required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">8. Your Privacy Rights</h2>
            <p>Depending on your location and applicable law, you may have rights to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request access to personal information we hold about you.</li>
              <li>Correct inaccurate information.</li>
              <li>Request deletion of personal information.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Request a copy of eligible information.</li>
              <li>Withdraw consent where processing relies on consent.</li>
              <li>Lodge a complaint with a relevant data protection authority.</li>
            </ul>
            <p>To exercise applicable rights, contact [Privacy Contact Email].</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">9. Children's Privacy</h2>
            <p>
              Sketch is not intended for children who are prohibited from using the Service under applicable law. We do not knowingly collect personal information from children where doing so would be unlawful. If you believe a child has provided personal information inappropriately, contact us so we can review the matter.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">10. International Data Processing</h2>
            <p>
              Depending on the location of our infrastructure and service providers, your information may be processed or stored in countries other than your own. Where required, appropriate safeguards will be used for international transfers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy as the Service evolves or legal requirements change. We will update the "Last Updated" date when changes are made. Where required by law, we will provide additional notice or obtain consent.
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
export default Privacy;
