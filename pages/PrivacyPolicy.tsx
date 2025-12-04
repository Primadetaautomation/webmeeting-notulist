import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const purposes = t('privacy.purposes', { returnObjects: true }) as Array<{ purpose: string; basis: string }>;
  const parties = t('privacy.parties', { returnObjects: true }) as Array<{ party: string; purpose: string; location: string }>;
  const accountDataItems = t('privacy.accountDataItems', { returnObjects: true }) as string[];
  const recordingDataItems = t('privacy.recordingDataItems', { returnObjects: true }) as string[];
  const technicalDataItems = t('privacy.technicalDataItems', { returnObjects: true }) as string[];
  const retentionItems = t('privacy.retentionItems', { returnObjects: true }) as string[];
  const rights = t('privacy.rights', { returnObjects: true }) as string[];
  const securityItems = t('privacy.securityItems', { returnObjects: true }) as string[];
  const storageItems = t('privacy.storageItems', { returnObjects: true }) as string[];

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
          <h1>{t('privacy.title')}</h1>
          <p className="text-surface-400 text-sm mb-8">{t('privacy.lastUpdated')}</p>

          <h2>{t('privacy.section1Title')}</h2>
          <p>
            <Trans i18nKey="privacy.section1Content">
              Meeting Notes AI is a service of <strong>Prim Automation</strong>, based in the Netherlands.
              We are responsible for processing your personal data as described in this privacy policy.
            </Trans>
          </p>
          <p>
            <strong>{t('privacy.contact')}</strong><br />
            E-mail: <a href="mailto:rick@primautomation.com">rick@primautomation.com</a>
          </p>

          <h2>{t('privacy.section2Title')}</h2>
          <p>{t('privacy.section2Intro')}</p>

          <h3>{t('privacy.accountData')}</h3>
          <ul>
            {accountDataItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>{t('privacy.recordingData')}</h3>
          <ul>
            {recordingDataItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>{t('privacy.technicalData')}</h3>
          <ul>
            {technicalDataItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h2>{t('privacy.section3Title')}</h2>
          <table className="w-full text-sm border-collapse my-4">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left py-2 text-surface-300">{t('privacy.purposeHeader')}</th>
                <th className="text-left py-2 text-surface-300">{t('privacy.legalBasisHeader')}</th>
              </tr>
            </thead>
            <tbody className="text-surface-400">
              {purposes.map((item, index) => (
                <tr key={index} className="border-b border-surface-800">
                  <td className="py-2">{item.purpose}</td>
                  <td className="py-2">{item.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>{t('privacy.section4Title')}</h2>
          <p>{t('privacy.section4Intro')}</p>

          <table className="w-full text-sm border-collapse my-4">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left py-2 text-surface-300">{t('privacy.partyHeader')}</th>
                <th className="text-left py-2 text-surface-300">{t('privacy.purposeDataHeader')}</th>
                <th className="text-left py-2 text-surface-300">{t('privacy.locationHeader')}</th>
              </tr>
            </thead>
            <tbody className="text-surface-400">
              {parties.map((item, index) => (
                <tr key={index} className="border-b border-surface-800">
                  <td className="py-2">{item.party}</td>
                  <td className="py-2">{item.purpose}</td>
                  <td className="py-2">{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            <Trans i18nKey="privacy.sccsNote">
              <strong>SCCs</strong> = Standard Contractual Clauses, approved by the European Commission
              for international data transfers.
            </Trans>
          </p>

          <h2>{t('privacy.section5Title')}</h2>
          <ul>
            {retentionItems.map((item, index) => (
              <li key={index}>
                <Trans>{item}</Trans>
              </li>
            ))}
          </ul>
          <p>{t('privacy.retentionNote')}</p>

          <h2>{t('privacy.section6Title')}</h2>
          <p>{t('privacy.section6Intro')}</p>
          <ul>
            {rights.map((item, index) => (
              <li key={index}>
                <Trans>{item}</Trans>
              </li>
            ))}
          </ul>
          <p>
            {t('privacy.rightsContact')}{' '}
            <a href="mailto:rick@primautomation.com">rick@primautomation.com</a>.
          </p>

          <h2>{t('privacy.section7Title')}</h2>
          <p>{t('privacy.section7Intro')}</p>
          <ul>
            {securityItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h2>{t('privacy.section8Title')}</h2>
          <p>
            <Trans i18nKey="privacy.section8Intro">
              We do <strong>not use tracking cookies</strong>. We do use local storage
              in your browser for:
            </Trans>
          </p>
          <ul>
            {storageItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p>{t('privacy.storageNote')}</p>

          <h2>{t('privacy.section9Title')}</h2>
          <p className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <Trans i18nKey="privacy.section9Content">
              <strong>Note:</strong> When you record meetings, you are responsible for
              informing other participants. In the Netherlands, recording conversations you
              participate in is allowed, but it's good practice to inform participants.
              Our app offers an optional audio notification for this.
            </Trans>
          </p>

          <h2>{t('privacy.section10Title')}</h2>
          <p>{t('privacy.section10Content')}</p>

          <h2>{t('privacy.section11Title')}</h2>
          <p>{t('privacy.section11Content')}</p>
          <p>
            <a href={i18n.language === 'nl' ? 'https://autoriteitpersoonsgegevens.nl' : 'https://edpb.europa.eu/about-edpb/about-edpb/members_en'} target="_blank" rel="noopener noreferrer">
              {i18n.language === 'nl' ? 'autoriteitpersoonsgegevens.nl' : 'Data Protection Authorities'}
            </a>
          </p>

          <div className="mt-12 p-4 bg-surface-800 rounded-lg text-center">
            <p className="text-surface-400 text-sm">
              {t('privacy.questions')}{' '}
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

export default PrivacyPolicy;
