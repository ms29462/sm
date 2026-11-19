import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const ClubPendingLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <img src="/logo.png" alt="Soccer Match" className="h-10 w-auto mb-10" />
      <div className="max-w-md w-full bg-card border border-border/50 rounded-sm p-8 text-center">
        <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⏳</span>
        </div>
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">{t('club_pending_login.title')}</h1>
        <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-sm mb-5">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide">{t('club_pending_login.badge')}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {t('club_pending_login.body1')}
        </p>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {t('club_pending_login.body2', { hours: '48' })}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {t('club_pending_login.questions')} <a href="mailto:contact@soccermatch.ca" className="text-primary hover:underline">contact@soccermatch.ca</a>
        </p>
        <button onClick={() => navigate('/')}
          className="w-full bg-primary text-black font-bold uppercase tracking-wide rounded-sm h-12 hover:bg-primary/90 transition-colors">
          {t('club_pending_login.back_home')}
        </button>
      </div>
    </div>
  );
};
export default ClubPendingLogin;
