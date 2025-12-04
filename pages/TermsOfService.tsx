import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const section2Items = t('terms.section2Items', { returnObjects: true }) as string[];
  const section4Items = t('terms.section4Items', { returnObjects: true }) as string[];
  const section5Items = t('terms.section5Items', { returnObjects: true }) as string[];
  const section7Items = t('terms.section7Items', { returnObjects: true }) as string[];
  const section8Items = t('terms.section8Items', { returnObjects: true }) as string[];
  const section9Items = t('terms.section9Items', { returnObjects: true }) as string[];
  const section10Items = t('terms.section10Items', { returnObjects: true }) as string[];
  const section14Items = t('terms.section14Items', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-surface-900 text-surface-100">
      {/* Header */}
      <header className="glass border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t('nav.back')}
          </button>
          <LanguageSelector variant="buttons" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose-custom">
          <h1>{t('terms.title')}</h1>
          <p className="text-surface-400 text-sm mb-8">{t('terms.lastUpdated')}</p>

          <h2>{t('terms.section1Title')}</h2>
          <p>{t('terms.section1Content')}</p>

          <h2>{t('terms.section2Title')}</h2>
          <p>{t('terms.section2Intro')}</p>
          <ul>
            {section2Items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h2>{t('terms.section3Title')}</h2>
          <h3>{t('terms.section3_1Title')}</h3>
          <p>{t('terms.section3_1Content')}</p>

          <h3>{t('terms.section3_2Title')}</h3>
          <p>{t('terms.section3_2Content')}</p>

          <h2>{t('terms.section4Title')}</h2>
          <p>
            <Trans i18nKey="terms.section4Intro">
              You agree that you will <strong>not</strong> use the Service for:
            </Trans>
          </p>
          <ul>
            {section4Items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h2>{t('terms.section5Title')}</h2>
          <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg my-4">
            <p className="mb-2">
              <Trans i18nKey="terms.section5Important">
                <strong>Important:</strong> You are responsible for complying with laws and
                regulations when recording conversations.
              </Trans>
            </p>
            <ul className="text-sm">
              {section5Items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <h2>{t('terms.section6Title')}</h2>
          <h3>{t('terms.section6_1Title')}</h3>
          <p>{t('terms.section6_1Content')}</p>

          <h3>{t('terms.section6_2Title')}</h3>
          <p>{t('terms.section6_2Content')}</p>

          <h2>{t('terms.section7Title')}</h2>
          <p>{t('terms.section7Intro')}</p>
          <ul>
            {section7Items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h2>{t('terms.section8Title')}</h2>
          <p>{t('terms.section8Intro')}</p>
          <ul>
            {section8Items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h2>{t('terms.section9Title')}</h2>
          <p>{t('terms.section9Intro')}</p>
          <ul>
            {section9Items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p>{t('terms.section9Note')}</p>

          <h2>{t('terms.section10Title')}</h2>
          <p>{t('terms.section10Intro')}</p>
          <ul>
            {section10Items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h2>{t('terms.section11Title')}</h2>
          <p>{t('terms.section11Content')}</p>

          <h2>{t('terms.section12Title')}</h2>
          <p>{t('terms.section12Content')}</p>

          <h2>{t('terms.section13Title')}</h2>
          <p>{t('terms.section13Intro')}</p>
          <p>
            <strong>Prim Automation</strong><br />
            E-mail: <a href="mailto:rick@primautomation.com">rick@primautomation.com</a>
          </p>

          <h2>{t('terms.section14Title')}</h2>
          <ul>
            {section14Items.map((item, index) => (
              <li key={index}>
                <Trans>{item}</Trans>
              </li>
            ))}
          </ul>

          <div className="mt-12 p-4 bg-surface-800 rounded-lg text-center">
            <p className="text-surface-400 text-sm">
              {t('terms.questions')}{' '}
              <a href="mailto:rick@primautomation.com" className="text-primary-400">
                {t('privacy.contact').replace(':', '')}
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
