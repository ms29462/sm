import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MentionsLegales = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">Legal Notice</h1>
        <p className="text-muted-foreground mb-8 text-sm">In effect as of January 1, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Site Publisher</h2>
            <p className="text-muted-foreground">The site accessible at <strong>https://soccer-match.org</strong> is owned and published by:</p>
            <div className="mt-3 text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Soccer Match Inc.</strong></p>
              <p>2000 boulevard René-Lévesque Ouest</p>
              <p>Montréal, QC H3H 0B3, Canada</p>
              <p>Email: contact@soccermatch.ca</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Publication Director</h2>
            <div className="text-muted-foreground space-y-1">
              <p>Sylla Mohamadou</p>
              <p>Email: contact@soccermatch.ca</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Hosting</h2>
            <div className="text-muted-foreground space-y-4">
              <div>
                <p><strong className="text-foreground">Frontend (User Interface)</strong></p>
                <p>Vercel Inc.</p>
                <p>340 Pine Street, Suite 701, San Francisco, CA 94104, USA</p>
                <p>https://vercel.com</p>
              </div>
              <div>
                <p><strong className="text-foreground">Backend (Application Server)</strong></p>
                <p>Railway Corp.</p>
                <p>340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
                <p>https://railway.app</p>
              </div>
              <div>
                <p><strong className="text-foreground">Database</strong></p>
                <p>MongoDB Atlas — MongoDB Inc.</p>
                <p>1633 Broadway, 38th Floor, New York, NY 10019, USA</p>
                <p>https://www.mongodb.com</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Intellectual Property</h2>
            <p className="text-muted-foreground">All content on the Site is subject to applicable copyright, trademark, and intellectual property law. The intellectual property rights to all elements making up this site belong to Soccer Match Inc. Any unauthorized reproduction is prohibited.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Personal Data</h2>
            <p className="text-muted-foreground">Soccer Match Inc. collects and processes only personal data voluntarily provided by users. In accordance with the GDPR (EU Regulation 2016/679) and Quebec's Law 25, you have the following rights:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Right of access and rectification of your data</li>
              <li>Right to erasure (right to be forgotten)</li>
              <li>Right to restriction of processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
            <p className="text-muted-foreground mt-3">To exercise these rights, contact us at: <strong>contact@soccermatch.ca</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Applicable Law</h2>
            <p className="text-muted-foreground">This Legal Notice is governed by the laws of the province of Quebec and the applicable federal laws of Canada. Soccer Match Inc. operates internationally and is committed to complying with applicable local regulations, including the GDPR for European users.</p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-12 border-t border-border pt-6">© 2026 Soccer Match Inc. — All rights reserved</p>
      </div>
    </div>
  );
};
export default MentionsLegales;