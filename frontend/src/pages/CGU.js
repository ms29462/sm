import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CGU = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">Terms of Use</h1>
        <p className="text-muted-foreground mb-8 text-sm">Effective February 16, 2024 — Updated March 24, 2025</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">1. Use of the Platform</h2>
            <p className="text-muted-foreground">The websites, web application and platforms of Soccer Match Inc. (hereinafter referred to as the "Platforms") are owned by Soccer Match Inc. and aim to provide information about Soccer Match Inc., its activities, services and products, as well as to facilitate interaction with its clients and users. The Platforms offer innovative technology for managing sports clubs and online sporting events, enabling connection, communication and coordination within the sporting community.</p>
            <p className="text-muted-foreground mt-3">By using the Platforms, you agree to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Not use the Platforms in a manner that constitutes or encourages the commission of a criminal or civil offence, or a violation of intellectual property rights.</li>
              <li>Not publish defamatory, abusive, racist, violent, hateful or intimidating content, or make threats or harass other users.</li>
              <li>Not reproduce, modify or redistribute the content of the Platforms without prior authorization from Soccer Match Inc.</li>
              <li>Not use automated or manual means to access or collect information from the Platforms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">2. Eligibility and Minors</h2>
            <p className="text-muted-foreground">Soccer Match is open to players of all ages, including minors. If you are under 18 years of age, you must obtain the consent of a parent or legal guardian before creating an account, and your parent or legal guardian must complete and submit our consent form before your account becomes fully active. By creating an account, you represent that you have either reached the age of majority in your jurisdiction or have obtained the required parental or guardian consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">3. Subscriptions and Credits</h2>
            <p className="text-muted-foreground">Certain features of the Platforms require an active annual subscription or the use of application credits, depending on your account type. Subscription prices and credit pack prices are displayed on the Platforms at the time of purchase and are processed securely through our payment provider, Stripe. Organization accounts (clubs, colleges, federations, agents, and specialists) must complete a subscription before accessing recruitment and scouting features. Subscriptions automatically renew annually unless cancelled prior to the renewal date through your account settings or the Stripe customer portal.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">4. Account Deletion</h2>
            <p className="text-muted-foreground">You may request the deletion of your account and associated data at any time from your profile settings. Deletion requests are reviewed by our team and, once approved, result in the permanent removal of your profile, applications, messages, and credit history in accordance with our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">5. Monitoring and Control</h2>
            <p className="text-muted-foreground">Soccer Match Inc. reserves the right to monitor and control any content posted on the Platforms to ensure compliance with these Terms. You consent to such monitoring by using the Platforms. Soccer Match Inc. reserves the right to remove any content it deems contrary to these Terms, without prior notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">6. Cookies</h2>
            <p className="text-muted-foreground">Cookies are used on the Platforms to improve your browsing experience. You can configure your browser to accept, refuse or notify you before accepting cookies. Please note that some Platform services may not be available if you refuse cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">7. Content Policy</h2>
            <p className="text-muted-foreground">Opinions and comments posted on the Platforms represent only the views of their authors and should not be interpreted as those of Soccer Match Inc. You are solely responsible for any content you post or make available on the Platforms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">8. Intellectual Property</h2>
            <p className="text-muted-foreground">All content on the Platforms belongs to Soccer Match Inc. or its licensors and is protected by copyright and other applicable intellectual property laws. By submitting content, you grant Soccer Match Inc. a license to use that content on the Platforms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">9. Refund Policy</h2>
            <p className="text-muted-foreground">Application credits spent on submitted applications are generally non-refundable, regardless of the outcome of the selection process. However, if an opportunity is removed, closed, or found to be invalid before being reviewed by the organization, Soccer Match may, at its discretion, refund the credits used to apply to that opportunity.</p>
            <p className="text-muted-foreground mt-2">Subscription fees and credit pack purchases are processed through Stripe and are subject to the refund terms communicated at the time of purchase. To request a refund or report a billing issue, contact us at <strong>contact@soccermatch.ca</strong>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">10. Limitation of Liability</h2>
            <p className="text-muted-foreground">Soccer Match Inc. provides no warranty as to the accuracy or completeness of information on the Platforms and assumes no liability for any damages arising from their use. All information is provided "as is" and "as available".</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">11. Governing Law</h2>
            <p className="text-muted-foreground">These Terms are governed by the laws of the Province of Quebec and the applicable laws of Canada. Soccer Match Inc. reserves the right to modify the Platforms and these Terms at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">12. GDPR & Quebec Law 25 Compliance</h2>
            <p className="text-muted-foreground">Soccer Match Inc. is committed to complying with the General Data Protection Regulation (GDPR) as well as Quebec's Act to Modernize Legislative Provisions Respecting the Protection of Personal Information (Law 25). Your personal data is processed in accordance with our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">13. Contact</h2>
            <p className="text-muted-foreground">For any questions regarding these Terms, please contact us at: <strong>contact@soccermatch.ca</strong></p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-12 border-t border-border pt-6">© 2026 Soccer Match Inc. — 2000 boulevard René-Lévesque Ouest, Montréal, QC H3H 0B3, Canada</p>
      </div>
    </div>
  );
};
export default CGU;