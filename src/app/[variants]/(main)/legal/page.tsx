'use client';

import { Segmented, Typography } from '@lobehub/ui';
import { Divider } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

const TermsContent = () => {
    const { t } = useTranslation('legal');

    return (
        <Typography>
            <h1>{t('terms.title')}</h1>
            <p>{t('terms.lastUpdated')}</p>

            <p>{t('terms.intro.text')}</p>
            <p>
                <strong>{t('terms.intro.acceptance')}</strong>
            </p>

            <Divider />

            {/* Section 1: Registration */}
            <h2>{t('terms.sections.registration.title')}</h2>
            <ul>
                <li>{t('terms.sections.registration.age')}</li>
                <li>{t('terms.sections.registration.account')}</li>
                <li>{t('terms.sections.registration.prohibited')}</li>
            </ul>

            {/* Section 2: Usage */}
            <h2>{t('terms.sections.usage.title')}</h2>
            <p>{t('terms.sections.usage.allowed')}</p>
            <p>{t('terms.sections.usage.prohibited_title')}</p>
            <ul>
                <li>{t('terms.sections.usage.prohibited_1')}</li>
                <li>{t('terms.sections.usage.prohibited_2')}</li>
                <li>{t('terms.sections.usage.prohibited_3')}</li>
                <li>{t('terms.sections.usage.prohibited_4')}</li>
                <li>{t('terms.sections.usage.prohibited_5')}</li>
            </ul>

            {/* Section 3: Content */}
            <h2>{t('terms.sections.content.title')}</h2>
            <ul>
                <li>{t('terms.sections.content.ownership')}</li>
                <li>{t('terms.sections.content.responsibility')}</li>
                <li>{t('terms.sections.content.similarity')}</li>
            </ul>

            {/* Section 4: AI Disclaimer */}
            <h2>{t('terms.sections.aiDisclaimer.title')}</h2>
            <p>
                <strong>{t('terms.sections.aiDisclaimer.intro')}</strong>
            </p>
            <ul>
                <li>
                    <strong>{t('terms.sections.aiDisclaimer.point_1')}</strong>
                </li>
                <li>
                    <strong>{t('terms.sections.aiDisclaimer.point_2')}</strong>
                </li>
                <li>
                    <strong>{t('terms.sections.aiDisclaimer.point_3')}</strong>
                </li>
                <li>
                    <strong>{t('terms.sections.aiDisclaimer.point_4')}</strong>
                </li>
            </ul>

            {/* Section 5: IP */}
            <h2>{t('terms.sections.ip.title')}</h2>
            <p>{t('terms.sections.ip.text')}</p>

            {/* Section 6: Fees */}
            <h2>{t('terms.sections.fees.title')}</h2>
            <p>{t('terms.sections.fees.text')}</p>

            {/* Section 7: Termination */}
            <h2>{t('terms.sections.termination.title')}</h2>
            <p>{t('terms.sections.termination.text')}</p>

            {/* Section 8: Warranty */}
            <h2>{t('terms.sections.warranty.title')}</h2>
            <p>{t('terms.sections.warranty.text')}</p>

            {/* Section 9: Liability */}
            <h2>{t('terms.sections.liability.title')}</h2>
            <p>{t('terms.sections.liability.intro')}</p>
            <ul>
                <li>{t('terms.sections.liability.scenario_1')}</li>
                <li>{t('terms.sections.liability.scenario_2')}</li>
                <li>{t('terms.sections.liability.scenario_3')}</li>
                <li>{t('terms.sections.liability.scenario_4')}</li>
            </ul>
            <p>{t('terms.sections.liability.cap')}</p>

            {/* Section 10: Changes */}
            <h2>{t('terms.sections.changes.title')}</h2>
            <p>{t('terms.sections.changes.text')}</p>

            {/* Section 11: Contact */}
            <h2>{t('terms.sections.contact.title')}</h2>
            <p>
                {t('terms.sections.contact.text')}{' '}
                <a href={`mailto:${t('terms.sections.contact.email')}`}>
                    {t('terms.sections.contact.email')}
                </a>
                .
            </p>
        </Typography>
    );
};

const PrivacyContent = () => {
    const { t } = useTranslation('legal');

    return (
        <Typography>
            <h1>{t('privacy.title')}</h1>
            <p>{t('privacy.lastUpdated')}</p>

            <p>{t('privacy.intro')}</p>

            <Divider />

            {/* Section 1: Collection */}
            <h2>{t('privacy.sections.collection.title')}</h2>
            <p>{t('privacy.sections.collection.intro')}</p>

            <h3>{t('privacy.sections.collection.account_title')}</h3>
            <p>{t('privacy.sections.collection.account')}</p>

            <h3>{t('privacy.sections.collection.content_title')}</h3>
            <p>{t('privacy.sections.collection.content')}</p>

            <h3>{t('privacy.sections.collection.technical_title')}</h3>
            <p>{t('privacy.sections.collection.technical')}</p>

            {/* Section 2: Usage */}
            <h2>{t('privacy.sections.usage.title')}</h2>
            <ul>
                <li>{t('privacy.sections.usage.purpose_1')}</li>
                <li>{t('privacy.sections.usage.purpose_2')}</li>
                <li>{t('privacy.sections.usage.purpose_3')}</li>
                <li>{t('privacy.sections.usage.purpose_4')}</li>
                <li>{t('privacy.sections.usage.purpose_5')}</li>
            </ul>

            {/* Section 3: Sharing */}
            <h2>{t('privacy.sections.sharing.title')}</h2>
            <p>{t('privacy.sections.sharing.intro')}</p>
            <ul>
                <li>{t('privacy.sections.sharing.case_1')}</li>
                <li>{t('privacy.sections.sharing.case_2')}</li>
                <li>{t('privacy.sections.sharing.case_3')}</li>
            </ul>

            {/* Section 4: Rights */}
            <h2>{t('privacy.sections.rights.title')}</h2>
            <p>{t('privacy.sections.rights.intro')}</p>
            <ul>
                <li>{t('privacy.sections.rights.right_1')}</li>
                <li>{t('privacy.sections.rights.right_2')}</li>
                <li>{t('privacy.sections.rights.right_3')}</li>
                <li>{t('privacy.sections.rights.right_4')}</li>
                <li>{t('privacy.sections.rights.right_5')}</li>
            </ul>
            <p>{t('privacy.sections.rights.contact')}</p>

            {/* Section 5: Retention */}
            <h2>{t('privacy.sections.retention.title')}</h2>
            <p>{t('privacy.sections.retention.text')}</p>

            {/* Section 6: Security */}
            <h2>{t('privacy.sections.security.title')}</h2>
            <p>{t('privacy.sections.security.text')}</p>

            {/* Section 7: Children */}
            <h2>{t('privacy.sections.children.title')}</h2>
            <p>{t('privacy.sections.children.text')}</p>

            {/* Section 8: International */}
            <h2>{t('privacy.sections.international.title')}</h2>
            <p>{t('privacy.sections.international.text')}</p>

            {/* Section 9: Changes */}
            <h2>{t('privacy.sections.changes.title')}</h2>
            <p>{t('privacy.sections.changes.text')}</p>

            {/* Section 10: Contact */}
            <h2>{t('privacy.sections.contact.title')}</h2>
            <p>
                {t('privacy.sections.contact.text')}{' '}
                <a href={`mailto:${t('privacy.sections.contact.email')}`}>
                    {t('privacy.sections.contact.email')}
                </a>
            </p>

            <Divider />

            {/* Regional Sections */}
            <h2>{t('privacy.regions.gdpr.title')}</h2>
            <h3>{t('privacy.regions.gdpr.legal_basis_title')}</h3>
            <p>{t('privacy.regions.gdpr.legal_basis_text')}</p>
            <h3>{t('privacy.regions.gdpr.dpo_title')}</h3>
            <p>{t('privacy.regions.gdpr.dpo_text')}</p>
            <h3>{t('privacy.regions.gdpr.rights_title')}</h3>
            <p>{t('privacy.regions.gdpr.rights_text')}</p>

            <Divider />

            <h2>{t('privacy.regions.ccpa.title')}</h2>
            <h3>{t('privacy.regions.ccpa.rights_title')}</h3>
            <ul>
                <li>{t('privacy.regions.ccpa.right_1')}</li>
                <li>{t('privacy.regions.ccpa.right_2')}</li>
                <li>{t('privacy.regions.ccpa.right_3')}</li>
                <li>{t('privacy.regions.ccpa.right_4')}</li>
            </ul>
            <p>{t('privacy.regions.ccpa.contact')}</p>

            <Divider />

            <h2>{t('privacy.regions.vietnam.title')}</h2>
            <h3>{t('privacy.regions.vietnam.decree_title')}</h3>
            <p>{t('privacy.regions.vietnam.decree_text')}</p>
            <h3>{t('privacy.regions.vietnam.authority_title')}</h3>
            <p>{t('privacy.regions.vietnam.authority_text')}</p>
        </Typography>
    );
};

const CookiesContent = () => {
    const { t } = useTranslation('legal');

    return (
        <Typography>
            <h1>{t('cookies.title')}</h1>
            <p>{t('cookies.lastUpdated')}</p>

            <p>{t('cookies.intro')}</p>

            <Divider />

            {/* Section 1: What */}
            <h2>{t('cookies.sections.what.title')}</h2>
            <p>{t('cookies.sections.what.text')}</p>

            {/* Section 2: Types */}
            <h2>{t('cookies.sections.types.title')}</h2>
            <h3>{t('cookies.sections.types.essential_title')}</h3>
            <p>{t('cookies.sections.types.essential_text')}</p>

            <h3>{t('cookies.sections.types.analytics_title')}</h3>
            <p>{t('cookies.sections.types.analytics_text')}</p>

            <h3>{t('cookies.sections.types.preferences_title')}</h3>
            <p>{t('cookies.sections.types.preferences_text')}</p>

            {/* Section 3: Third Party */}
            <h2>{t('cookies.sections.thirdParty.title')}</h2>
            <p>{t('cookies.sections.thirdParty.text')}</p>

            {/* Section 4: Manage */}
            <h2>{t('cookies.sections.manage.title')}</h2>
            <p>{t('cookies.sections.manage.text')}</p>
            <p>{t('cookies.sections.manage.links')}</p>

            {/* Section 5: Consent */}
            <h2>{t('cookies.sections.consent.title')}</h2>
            <p>{t('cookies.sections.consent.text')}</p>

            {/* Section 6: Contact */}
            <h2>{t('cookies.sections.contact.title')}</h2>
            <p>{t('cookies.sections.contact.text')}</p>
        </Typography>
    );
};

const LegalPage = () => {
    const { t } = useTranslation('legal');
    const [activeTab, setActiveTab] = useState('terms');

    const tabs = [
        { label: t('tabs.terms'), value: 'terms' },
        { label: t('tabs.privacy'), value: 'privacy' },
        { label: t('tabs.cookies'), value: 'cookies' },
    ];

    return (
        <Flexbox
            align="center"
            paddingBlock={24}
            style={{ height: '100%', overflowX: 'hidden', overflowY: 'auto' }}
            width={'100%'}
        >
            <Flexbox paddingInline={16} style={{ maxWidth: 960 }} width={'100%'}>
                <Typography style={{ marginBottom: 24 }}>
                    <h1>{t('pageTitle')}</h1>
                </Typography>

                <Segmented
                    onChange={(value) => setActiveTab(value as string)}
                    options={tabs}
                    style={{ marginBottom: 24 }}
                    value={activeTab}
                />

                {activeTab === 'terms' && <TermsContent />}
                {activeTab === 'privacy' && <PrivacyContent />}
                {activeTab === 'cookies' && <CookiesContent />}
            </Flexbox>
        </Flexbox>
    );
};

export default LegalPage;
