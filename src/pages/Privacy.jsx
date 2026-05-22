import { Link } from 'react-router-dom';

export const Privacy = () => {
  return (
    <div className="px-4 sm:px-6 md:px-12 py-12 md:py-16 max-w-6xl mx-auto text-zinc-100">
      <div className="space-y-6">
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/80 p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Privacy</p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-black uppercase tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            This privacy policy explains how Originals Printing Co. collects, uses, and protects your personal information when you use our website and services.
          </p>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">1. Information We Collect</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              We collect information that you provide when creating an account, placing an order, or contacting support. This may include your name, email address, shipping address, phone number, and payment details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">2. How We Use Your Information</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              We use your information to process orders, manage accounts, communicate updates, and fulfill customer service requests. We may also use your information to improve our products and services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">3. Data Sharing</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              We do not sell your personal data. We may share information with trusted service providers who help us operate the site and fulfill orders, such as payment processors and shipping partners.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">4. Security</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              We take reasonable steps to protect your personal information. However, no system is completely secure, and we cannot guarantee the absolute safety of your data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">5. Cookies and Tracking</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              Our website may use cookies or similar technologies to improve your experience and analyze site usage. You can manage cookie preferences through your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">6. Your Rights</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              You may request access to, correction of, or deletion of your personal information. To do so, contact our support team using the contact information provided on the site.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">7. Changes to this Policy</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              We may update this privacy policy from time to time. Continued use of our services after changes are posted constitutes acceptance of the updated policy.
            </p>
          </div>
        </section>

        <div className="mt-10">
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.3em] text-emerald-200 hover:bg-emerald-500/10 transition-colors">
            Return to signup
          </Link>
        </div>
      </div>
    </div>
  );
};
