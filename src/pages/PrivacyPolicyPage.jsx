export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-svh bg-stone-800 px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-100 tracking-tight">Privacy Policy</h1>
          <p className="text-stone-500 text-sm mt-2">Last updated: May 2025</p>
        </div>

        <p className="text-stone-400 text-sm leading-relaxed">
          Root ("we", "our", or "us") operates the Root mobile application and website. This policy explains what information we collect, how we use it, and your rights regarding your data.
        </p>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Information We Collect</h2>
          <div className="space-y-2 text-sm text-stone-400 leading-relaxed">
            <p><span className="text-stone-300 font-medium">Account information:</span> Your email address and password when you create an account.</p>
            <p><span className="text-stone-300 font-medium">Profile information:</span> Your name, hair history, preferences, allergies, and photos you choose to upload.</p>
            <p><span className="text-stone-300 font-medium">Booking information:</span> Appointment dates, times, service requests, and notes you provide when booking.</p>
            <p><span className="text-stone-300 font-medium">Location information:</span> Your approximate location when you use the "near me" search feature. We do not store your location.</p>
            <p><span className="text-stone-300 font-medium">Device information:</span> Push notification tokens to send you booking updates.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">How We Use Your Information</h2>
          <ul className="space-y-2 text-sm text-stone-400 leading-relaxed list-disc list-inside">
            <li>To connect you with hair specialists and manage your bookings</li>
            <li>To share your hair profile with specialists you book with</li>
            <li>To send you booking confirmations and updates via email and push notification</li>
            <li>To allow specialists to be found by clients in their area</li>
            <li>To improve the app and user experience</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Information Sharing</h2>
          <div className="space-y-2 text-sm text-stone-400 leading-relaxed">
            <p>We do not sell your personal information. We share your data only in the following cases:</p>
            <p><span className="text-stone-300 font-medium">With specialists:</span> When you make a booking, your name, hair profile, and appointment details are shared with the specialist you booked.</p>
            <p><span className="text-stone-300 font-medium">With service providers:</span> We use Supabase for data storage and authentication, and Resend for email delivery. These providers process data on our behalf under their own privacy policies.</p>
            <p><span className="text-stone-300 font-medium">Legal requirements:</span> We may disclose information if required by law.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Data Retention</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            We retain your data for as long as your account is active. You can delete your account at any time from Settings → Account Settings → Delete Account. Deleting your account permanently removes all your personal data, profile information, photos, and booking history.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Your Rights</h2>
          <ul className="space-y-2 text-sm text-stone-400 leading-relaxed list-disc list-inside">
            <li>Access and update your profile information at any time in the app</li>
            <li>Delete individual photos from your profile</li>
            <li>Delete your account and all associated data from Settings</li>
            <li>Request a copy of your data by contacting us</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Children's Privacy</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            Root is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Changes to This Policy</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            We may update this privacy policy from time to time. We will notify you of significant changes by posting the new policy in the app. Continued use of Root after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Contact Us</h2>
          <p className="text-sm text-stone-400 leading-relaxed">
            If you have questions about this privacy policy or your data, contact us at:{' '}
            <a href="mailto:bmimp1@gmail.com" className="text-amber-500 hover:text-amber-400 transition-colors">
              bmimp1@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
