import { useNavigate } from "react-router-dom";

const ClubPendingLogin = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <img src="/logo.png" alt="Soccer Match" className="h-10 w-auto mb-10" />
      <div className="max-w-md w-full bg-card border border-border/50 rounded-sm p-8 text-center">
        <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⏳</span>
        </div>
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">Application Under Review</h1>
        <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-sm mb-5">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Pending Review</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Your club application is currently being reviewed by the Soccer Match team.
        </p>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          A member of our team will contact you within <strong className="text-white">48 hours</strong> to verify your club and finalize your account activation.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Questions? Contact us at <a href="mailto:contact@soccermatch.ca" className="text-primary hover:underline">contact@soccermatch.ca</a>
        </p>
        <button onClick={() => navigate('/')}
          className="w-full bg-primary text-black font-bold uppercase tracking-wide rounded-sm h-12 hover:bg-primary/90 transition-colors">
          Back to Home
        </button>
      </div>
    </div>
  );
};
export default ClubPendingLogin;