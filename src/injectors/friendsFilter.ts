/**
 * Builds a self-contained JS string to inject into social network webviews.
 *
 * Strategy: semantic selectors (ARIA roles, data-testid, custom elements)
 * instead of obfuscated class names — more resilient to UI redesigns.
 *
 * Each injected script:
 *  - Runs immediately + retries every 500ms (handles slow SPA loads)
 *  - Uses MutationObserver for infinite scroll
 *  - Intercepts history.pushState for in-app navigation (Twitter, Reddit, etc.)
 *  - Is idempotent: re-injecting disconnects the previous observer
 */
export function buildFriendsFilterScript(
  networkId: string,
  friends: string[],
  enabled: boolean,
): string {
  return `(function () {
  var SF_FRIENDS = ${JSON.stringify(friends)};
  var SF_ENABLED = ${JSON.stringify(enabled)};
  var SF_NETWORK = ${JSON.stringify(networkId)};

  // ── Platform configs (semantic selectors) ────────────────────────────────
  var CONFIGS = {
    twitter: {
      postSelector: 'article[data-testid="tweet"]',
      getAuthor: function (post) {
        var el = post.querySelector('[data-testid="User-Name"]');
        if (!el) return '';
        return Array.from(el.querySelectorAll('span'))
          .map(function (s) { return s.textContent ? s.textContent.trim() : ''; })
          .filter(Boolean).join(' ');
      }
    },
    facebook: {
      // role="article" is stable even when class names are hashed
      postSelector: 'div[role="article"]',
      getAuthor: function (post) {
        // First semantic heading link is typically the author
        var el = post.querySelector('strong a, h2 a, h3 a, h4 a');
        if (el) return (el.textContent || '').trim();
        // Fallback: first short-text role="link" element near the top
        var links = Array.from(post.querySelectorAll('a[role="link"]'));
        for (var i = 0; i < Math.min(links.length, 6); i++) {
          var text = (links[i].textContent || '').trim();
          if (text.length > 1 && text.length < 60 && !text.includes('http')) return text;
        }
        return '';
      }
    },
    instagram: {
      postSelector: 'article',
      getAuthor: function (post) {
        var link = post.querySelector('header a');
        if (!link) return '';
        var href = link.getAttribute('href') || '';
        var m = href.match(/\\/@?([\\w.]+)/);
        return m ? m[1] : (link.textContent || '').trim();
      }
    },
    linkedin: {
      postSelector: '.feed-shared-update-v2, li[data-urn]',
      getAuthor: function (post) {
        var el = post.querySelector(
          '.feed-shared-actor__name, .update-components-actor__name, ' +
          '.update-components-actor__meta-link span[aria-hidden="true"]'
        );
        return el ? (el.textContent || '').trim() : '';
      }
    },
    reddit: {
      // shreddit-post is the web component used by new Reddit
      postSelector: 'shreddit-post, .thing[data-author]',
      getAuthor: function (post) {
        if (post.hasAttribute('author')) return post.getAttribute('author') || '';
        return post.getAttribute('data-author') || '';
      }
    },
    tiktok: {
      postSelector: '[data-e2e="recommend-list-item-container"]',
      getAuthor: function (post) {
        var el = post.querySelector('[data-e2e*="author-uniqueid"], a[href*="/@"]');
        if (!el) return '';
        if (el.tagName === 'A') {
          var href = el.getAttribute('href') || '';
          var m = href.match(/\\/@([\\w.]+)/);
          if (m) return m[1];
        }
        return (el.textContent || '').trim();
      }
    },
    threads: {
      postSelector: 'article, div[role="article"]',
      getAuthor: function (post) {
        var link = post.querySelector('a[href*="/@"], a[href*="threads.net/@"]');
        if (!link) return '';
        var href = link.getAttribute('href') || '';
        var m = href.match(/\\/@?([\\w.]+)/);
        return m ? m[1] : (link.textContent || '').trim();
      }
    },
    discord: {
      postSelector: 'li[id^="chat-messages-"]',
      getAuthor: function (post) {
        var el = post.querySelector('[id^="message-username-"], [class*="username_"]');
        return el ? (el.textContent || '').trim() : '';
      }
    }
  };

  // ── Matching logic (case-insensitive, partial match both ways) ────────────
  function matchesFriend(author) {
    if (!author || !SF_FRIENDS.length) return false;
    var a = author.toLowerCase();
    return SF_FRIENDS.some(function (f) {
      var fl = f.toLowerCase();
      return a === fl || a.includes(fl) || fl.includes(a);
    });
  }

  function applyToPost(post, cfg) {
    if (!SF_ENABLED || !SF_FRIENDS.length) {
      post.style.display = '';
      delete post.dataset.sfHidden;
      return;
    }
    var author = cfg.getAuthor(post);
    if (matchesFriend(author)) {
      post.style.display = '';
      delete post.dataset.sfHidden;
    } else {
      post.style.display = 'none';
      post.dataset.sfHidden = '1';
    }
  }

  function runFilter(cfg) {
    document.querySelectorAll(cfg.postSelector).forEach(function (p) {
      applyToPost(p, cfg);
    });
  }

  // ── Disconnect any previous observer ────────────────────────────────────
  if (window.__sfFilterObserver__) {
    window.__sfFilterObserver__.disconnect();
    window.__sfFilterObserver__ = null;
  }

  var cfg = CONFIGS[SF_NETWORK];
  if (!cfg) return;

  // Run immediately, then retry every 500ms until posts appear (SPA lazy load)
  var attempts = 0;
  function tryRun() {
    runFilter(cfg);
    if (++attempts < 24) setTimeout(tryRun, 500);
  }
  tryRun();

  // MutationObserver for infinite scroll and dynamic content
  if (SF_ENABLED && SF_FRIENDS.length > 0) {
    var obs = new MutationObserver(function () { runFilter(cfg); });
    obs.observe(document.body, { childList: true, subtree: true });
    window.__sfFilterObserver__ = obs;
  }

  // Intercept SPA navigation (Twitter, Reddit use pushState heavily)
  try {
    if (!window.__sfPushStatePatched__) {
      var origPush = history.pushState.bind(history);
      history.pushState = function () {
        origPush.apply(history, arguments);
        setTimeout(function () { runFilter(cfg); }, 800);
      };
      window.__sfPushStatePatched__ = true;
    }
  } catch (_) {}
})();`
}
