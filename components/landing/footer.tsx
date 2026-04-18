import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-axis-bg border-t border-axis-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <line x1="4" y1="20" x2="36" y2="20" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="20" y1="4" x2="20" y2="36" stroke="#0B0B0F" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="20" cy="20" r="3.5" fill="#0B0B0F"/>
              </svg>
              <span className="text-base font-bold tracking-tight">AXIS</span>
            </div>
            <p className="text-sm text-axis-text3 leading-relaxed max-w-[240px]">
              One system for everything you do. Missions, revenue, habits, goals.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">Pricing</a></li>
              <li><Link href="/login" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">Log in</Link></li>
              <li><Link href="/signup" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">Sign up</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/support" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">Support</Link></li>
              <li><a href="mailto:support@useaxis.com" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">Contact</a></li>
              <li><a href="#faq" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-axis-text3 hover:text-axis-text1 transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-axis-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-axis-text3">© 2026 AXIS. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="https://twitter.com/useaxis" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-axis-text3 hover:text-axis-text1 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://github.com/useaxis" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-axis-text3 hover:text-axis-text1 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
