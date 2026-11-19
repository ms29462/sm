import { useTranslation } from 'react-i18next';

const LanguageToggle = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const isFr = i18n.language?.startsWith('fr');
  const toggle = () => i18n.changeLanguage(isFr ? 'en' : 'fr');

  return (
    <button
      onClick={toggle}
      className={`text-xs font-bold border border-white/20 px-2.5 py-1 rounded-sm hover:border-primary hover:text-primary transition-colors ${className}`}
    >
      {isFr ? 'EN' : 'FR'}
    </button>
  );
};

export default LanguageToggle;
