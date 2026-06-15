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
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">Mentions Légales</h1>
        <p className="text-muted-foreground mb-8 text-sm">En vigueur au 1er janvier 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Éditeur du Site</h2>
            <p className="text-muted-foreground">Le site accessible à l'adresse <strong>https://soccer-match.org</strong> est la propriété de et est édité par :</p>
            <div className="mt-3 text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Soccer Match Inc.</strong></p>
              <p>2000 boulevard René-Lévesque Ouest</p>
              <p>Montréal, QC H3H 0B3, Canada</p>
              <p>Email : contact@soccermatch.ca</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Directeur de Publication</h2>
            <div className="text-muted-foreground space-y-1">
              <p>Sylla Mohamadou</p>
              <p>Email : contact@soccermatch.ca</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Hébergement</h2>
            <div className="text-muted-foreground space-y-4">
              <div>
                <p><strong className="text-foreground">Frontend (Interface utilisateur)</strong></p>
                <p>Vercel Inc.</p>
                <p>340 Pine Street, Suite 701, San Francisco, CA 94104, USA</p>
                <p>https://vercel.com</p>
              </div>
              <div>
                <p><strong className="text-foreground">Backend (Serveur applicatif)</strong></p>
                <p>Railway Corp.</p>
                <p>340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
                <p>https://railway.app</p>
              </div>
              <div>
                <p><strong className="text-foreground">Base de données</strong></p>
                <p>MongoDB Atlas — MongoDB Inc.</p>
                <p>1633 Broadway, 38th Floor, New York, NY 10019, USA</p>
                <p>https://www.mongodb.com</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Propriété Intellectuelle</h2>
            <p className="text-muted-foreground">L'ensemble du contenu du Site relève de la législation applicable en matière de droit d'auteur, droit des marques et propriété intellectuelle. Les droits de propriété intellectuelle de tous les éléments constitutifs du présent site sont la propriété de Soccer Match Inc. Toute reproduction non autorisée est interdite.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Données Personnelles</h2>
            <p className="text-muted-foreground">Soccer Match Inc. collecte et traite uniquement les données personnelles fournies volontairement par les utilisateurs. Conformément au RGPD (Règlement UE 2016/679) et à la Loi 25 du Québec, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Droit d'accès et de rectification de vos données</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="text-muted-foreground mt-3">Pour exercer ces droits, contactez-nous à : <strong>contact@soccermatch.ca</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase mb-3 text-primary">Loi Applicable</h2>
            <p className="text-muted-foreground">Les présentes mentions légales sont régies par les lois de la province de Québec et les lois fédérales du Canada applicables. Soccer Match Inc. opère à l'international et s'engage à respecter les réglementations locales applicables, notamment le RGPD pour les utilisateurs européens.</p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-12 border-t border-border pt-6">© 2026 Soccer Match Inc. — Tous droits réservés</p>
      </div>
    </div>
  );
};
export default MentionsLegales;