import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-gray-300 font-sans selection:bg-red-500/30 selection:text-white">
      {/* Navigation Header */}
      <nav className="border-b border-gray-800/50 bg-[#0A0A0C]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="font-extrabold text-white text-lg tracking-wider">
            MOTOGP MANAGER
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
            <p className="text-gray-500 mt-1">Last updated: July 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-400 leading-relaxed bg-[#16161C] p-8 md:p-12 rounded-3xl border border-gray-800 shadow-xl">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you register for MotoGP Manager MVP. 
              This includes your username, email address, and any password you establish for account security. 
              We do not collect sensitive personal data such as financial information or physical addresses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the MotoGP Manager MVP platform.</li>
              <li>Secure your account and verify your identity during login.</li>
              <li>Communicate with you regarding game updates, championships, or technical issues.</li>
              <li>Personalize your experience within the management simulation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to outside parties. 
              Your in-game manager name, team statistics, and championship results will be visible to 
              other players on the platform as part of the core gameplay experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <p>
              We implement industry-standard security measures, including encryption (bcrypt) for passwords 
              and secure JSON Web Tokens (JWT) for authentication. However, no electronic transmission or 
              storage of information can be entirely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
            <p>
              You have the right to access, update, or request deletion of your personal information. 
              If you wish to delete your account entirely, please contact the administration through the 
              platform or send an email to support@motogpmanager.com.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} MotoGP Manager MVP. All rights reserved.
      </footer>
    </div>
  );
};

export default Privacy;
