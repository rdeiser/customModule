import { Injectable } from '@angular/core';
import mixpanel from 'mixpanel-browser';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MixpanelService {
  private initialized = false;
  private pageStartTime = Date.now();

  constructor(@Inject(DOCUMENT) private document: Document) {
    // Auto-initialize Mixpanel so it works without GTM
    const token = environment.mixpanelToken;
    if (token) {
      this.init(token);
    }
  }

  init(projectToken: string) {
    if (!this.initialized) {
      mixpanel.init(projectToken, { debug: false, autocapture: false });
      // expose to window for any legacy code that expects window.mixpanel
      (window as any).mixpanel = mixpanel;
      mixpanel.register({
        vid: this.getVid()
      });
      this.initialized = true;
    }
  }

  track(eventName: string, properties: Record<string, any> = {}) {
    const mp = (window as any).mixpanel ?? mixpanel;
    if (!mp?.track) return;

    const enriched = {
      ...properties,
      page: this.document.location.pathname,
      page_url: this.document.location.href,
      referrer: this.document.referrer,
      timestamp: new Date().toISOString(),
      time_on_page_ms: Date.now() - this.pageStartTime,
      vid: this.getVid(),
    };

    mp.track(eventName, enriched);
  }

  private getVid(): string {
    const params = new URLSearchParams(this.document.location.search);
    return params.get('vid') ?? 'UNKNOWN';
  }
}
