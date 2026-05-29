import { useNavigate } from 'react-router-dom';

export const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 sm:px-6 md:px-12 py-12 md:py-16 max-w-6xl mx-auto text-zinc-100">
      <div className="space-y-6">
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/80 p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Legal</p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-black uppercase tracking-tight">Terms &amp; Conditions</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            These terms govern your use of Originals Printing Co. services, website, and any related features. By accessing this platform, you agree to comply with these terms and all applicable laws.
          </p>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">1. Use of the Service</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              Originals Printing Co. provides an online store for printing and fulfillment services. You may use the service for lawful purposes only. You agree not to post or transmit any content that is unlawful, defamatory, obscene, or infringes third-party rights.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">2. Ordering and Payment</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              All orders are subject to availability and acceptance. Prices are displayed in Philippine Peso (₱) and may include applicable taxes where indicated. Payment is required at checkout to confirm an order.
            </p>
            <p className="mt-2 text-zinc-400 leading-7">
              We reserve the right to refuse or cancel any order for any reason, including inaccurate order information or suspected fraudulent activity.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">3. Shipping and Delivery</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              Shipping estimates are provided for convenience only and are not guaranteed. Delivery times may vary based on location, shipping method, and product availability.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">4. Returns and Cancellations</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              Cancellation policies and returns are handled according to the policies stated on the website. Once an order enters production, cancellations may not be possible.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">5. Intellectual Property</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              All content available through Originals Printing Co. is the property of the company or its licensors. You may not reproduce, distribute, or create derivative works without permission.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">6. Limitation of Liability</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              To the fullest extent permitted by law, Originals Printing Co. will not be liable for indirect, incidental, or consequential damages arising from your use of the website or services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-zinc-100">7. Updates</h2>
            <p className="mt-2 text-zinc-400 leading-7">
              We may update these terms from time to time. Continued use of the service after changes are published constitutes acceptance of the updated terms.
            </p>
          </div>
        </section>

        <div className="mt-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.3em] text-emerald-200 hover:bg-emerald-500/10 transition-colors"
          >
            Return
          </button>
        </div>
      </div>
    </div>
  );
};
