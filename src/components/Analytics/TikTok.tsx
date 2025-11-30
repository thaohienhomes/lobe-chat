'use client';

import Script from 'next/script';
import { memo, useEffect } from 'react';

import { hashUserPII } from '@/utils/crypto-hash';
import { identifyTikTokUser } from '@/utils/tiktok-events';

interface TikTokPixelProps {
  pixelId?: string;
  userEmail?: string;
  userId?: string;
  userPhone?: string;
}

const TikTokPixel = memo<TikTokPixelProps>(
  ({ pixelId, userEmail, userId, userPhone }) => {
    // Handle user identification when pixel loads and user data is available
    useEffect(() => {
      if (!pixelId || typeof window === 'undefined') return;

      const identifyUser = async () => {
        // Wait for TikTok Pixel to load
        const checkTtq = async () => {
          if (window.ttq) {
            // Hash user PII data and identify user
            if (userEmail || userId || userPhone) {
              try {
                const hashedUserData = await hashUserPII({
                  email: userEmail,
                  phone: userPhone,
                  userId: userId,
                });

                if (Object.keys(hashedUserData).length > 0) {
                  identifyTikTokUser(hashedUserData);
                }
              } catch (error) {
                console.error('Failed to identify TikTok user:', error);
              }
            }
          } else {
            // Retry after a short delay
            setTimeout(() => checkTtq(), 100);
          }
        };

        // Start checking for ttq availability
        setTimeout(() => checkTtq(), 500);
      };

      identifyUser();
    }, [pixelId, userEmail, userId, userPhone]);

    return pixelId ? (
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;
              var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
              ttq.setAndDefer=function(t,e){
                t[e]=function(){
                  t.push([e].concat(Array.prototype.slice.call(arguments,0)))
                }
              };
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){
                for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);
                return e
              };
              ttq.load=function(e,n){
                var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
                ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
                n=document.createElement("script");
                n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;
                e=document.getElementsByTagName("script")[0];
                e.parentNode.insertBefore(n,e)
              };
              ttq.load('${pixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `,
        }}
        id="tiktok-pixel"
        strategy="afterInteractive"
      />
    ) : null;
  },
);

TikTokPixel.displayName = 'TikTokPixel';

export default TikTokPixel;
