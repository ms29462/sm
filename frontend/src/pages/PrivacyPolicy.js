import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">Privacy Policy / Politique de Confidentialité</h1>
        <p className="text-muted-foreground mb-8 text-sm">Last updated / Dernière mise à jour : May 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">1. Who We Are</h2>
            <p className="text-muted-foreground">Soccer Match Inc. operates soccer-match.org, a platform connecting football players with clubs, universities, federations and agents worldwide. We are registered in Québec, Canada and comply with GDPR (EU), Quebec Law 25, and PIPEDA (Canada).</p>
            <p className="text-muted-foreground mt-2">Contact: <strong>contact@soccermatch.ca</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">2. Minors and Parental Consent</h2>
            <p className="text-muted-foreground">Soccer Match is open to football players of all ages, including players under 18 years old ("minors"). If you are a minor, you must have the consent of a parent or legal guardian before creating an account. During registration, minors are required to confirm that this consent has been obtained, and a parent or legal guardian must complete and sign our consent form. A minor's account remains inactive until our team has received and reviewed the signed consent form.</p>
            <p className="text-muted-foreground mt-2">We limit the public visibility of minors' personal information. A minor's email address, phone number, full date of birth, and minor status are never shared with other users of the platform (clubs, colleges, federations, agents, specialists, or other players) and are accessible only to authorized Soccer Match administrators.</p>
            <p className="text-muted-foreground mt-2">A parent or legal guardian may contact us at any time at <strong>contact@soccermatch.ca</strong> to review their child's information, request corrections, or request deletion of the account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">3. Data We Collect</h2>
            <p className="text-muted-foreground">We collect the following personal data when you register and use our platform:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Full name, email address, and date of birth</li>
              <li>Profile information (position, nationality, age, playing level)</li>
              <li>Profile pictures and highlight videos (uploaded by you)</li>
              <li>Application history and messages exchanged on the platform</li>
              <li>Payment and billing information (processed by Stripe; we do not store full card numbers)</li>
              <li>IP address and browser data (for security purposes)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>To provide and improve our platform services</li>
              <li>To connect players with organizations</li>
              <li>To process subscription and credit purchases</li>
              <li>To send notifications related to your account and applications</li>
              <li>To review reported conduct and messages for safety and trust investigations</li>
              <li>To ensure platform security and prevent fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="text-muted-foreground mt-3">We <strong>never sell</strong> your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">5. Data Retention</h2>
            <p className="text-muted-foreground">We retain your personal data for as long as your account is active. You may request deletion of your account and all associated data at any time from your profile settings, or by contacting us at contact@soccermatch.ca. Deletion requests are reviewed by our team and processed promptly; once approved, your profile, applications, messages, and credit history are permanently removed.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">6. Third-Party Services</h2>
            <p className="text-muted-foreground">We use the following third-party services to operate our platform:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li><strong>MongoDB Atlas</strong> — database hosting (USA)</li>
              <li><strong>Vercel</strong> — frontend hosting (USA)</li>
              <li><strong>Railway</strong> — backend hosting (USA)</li>
              <li><strong>Cloudinary / YouTube / Vimeo</strong> — video hosting (if applicable)</li>
              <li><strong>Stripe</strong> — payment processing for subscriptions and credit purchases</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
            </ul>
            <p className="text-muted-foreground mt-2">All third-party providers are GDPR compliant and process data under appropriate safeguards.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">7. Your Rights (GDPR & Law 25)</h2>
            <p className="text-muted-foreground">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li><strong>Right of access</strong> — request a copy of your data</li>
              <li><strong>Right of rectification</strong> — correct inaccurate data</li>
              <li><strong>Right of erasure</strong> — request deletion of your data</li>
              <li><strong>Right to data portability</strong> — receive your data in a structured format</li>
              <li><strong>Right to object</strong> — object to processing of your data</li>
              <li><strong>Right to withdraw consent</strong> — at any time</li>
            </ul>
            <p className="text-muted-foreground mt-3">To exercise any of these rights, contact us at: <strong>contact@soccermatch.ca</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">8. Cookies</h2>
            <p className="text-muted-foreground">We use essential cookies to maintain your session and preferences. No advertising or tracking cookies are used. You can disable cookies in your browser settings, though some features may not function correctly.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">9. Security</h2>
            <p className="text-muted-foreground">We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and JWT authentication tokens. However, no system is 100% secure and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">10. Contact & Complaints</h2>
            <p className="text-muted-foreground">For any privacy-related questions or complaints, contact us at <strong>contact@soccermatch.ca</strong>. If you are an EU resident and believe we have not addressed your concern, you have the right to lodge a complaint with your local data protection authority.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">We may update this policy from time to time. We will notify you of significant changes by email or by posting a notice on the platform.</p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-12 border-t border-border pt-6">© 2026 Soccer Match Inc. — 2000 boulevard René-Lévesque Ouest, Montréal, QC H3H 0B3, Canada</p>
      </div>
    </div>
  );
};
export default PrivacyPolicy;