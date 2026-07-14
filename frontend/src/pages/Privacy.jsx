import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            {t('privacy.back', "Volver al Inicio")}
          </button>
          <div className="font-extrabold text-white text-lg tracking-wider">
            MASTERS MANAGER
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
            <h1 className="text-4xl font-black text-white">{t('privacy.title', "Política de Privacidad")}</h1>
            <p className="text-gray-500 mt-1">{t('privacy.last_updated', "Última actualización: Julio 2026")}</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-400 leading-relaxed bg-[#16161C] p-8 md:p-12 rounded-3xl border border-gray-800 shadow-xl">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.s1.title', "1. Información que Recopilamos")}</h2>
            <p>
              {t('privacy.s1.p1', "Recopilamos la información que nos proporcionas directamente cuando te registras en GP Masters Manager MVP. Esto incluye tu nombre de usuario, dirección de correo electrónico y cualquier contraseña que establezcas para la seguridad de la cuenta. No recopilamos datos personales sensibles como información financiera o direcciones físicas.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.s2.title', "2. Cómo Usamos tu Información")}</h2>
            <p className="mb-4">{t('privacy.s2.p1', "Usamos la información que recopilamos para:")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('privacy.s2.l1', "Proporcionar, mantener y mejorar la plataforma GP Masters Manager MVP.")}</li>
              <li>{t('privacy.s2.l2', "Asegurar tu cuenta y verificar tu identidad durante el inicio de sesión.")}</li>
              <li>{t('privacy.s2.l3', "Comunicarnos contigo respecto a actualizaciones del juego, campeonatos o problemas técnicos.")}</li>
              <li>{t('privacy.s2.l4', "Personalizar tu experiencia dentro de la simulación de gestión.")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.s3.title', "3. Compartir y Divulgar Datos")}</h2>
            <p>
              {t('privacy.s3.p1', "No vendemos, intercambiamos ni transferimos de otra manera tu información personal a terceros. Tu nombre de mánager dentro del juego, las estadísticas de tu equipo y los resultados del campeonato serán visibles para otros jugadores en la plataforma como parte de la experiencia de juego principal.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.s4.title', "4. Seguridad de Datos")}</h2>
            <p>
              {t('privacy.s4.p1', "Implementamos medidas de seguridad estándar de la industria, incluyendo encriptación (bcrypt) para contraseñas y JSON Web Tokens (JWT) seguros para la autenticación. Sin embargo, ninguna transmisión electrónica o almacenamiento de información puede ser completamente seguro, y no podemos garantizar una seguridad absoluta.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('privacy.s5.title', "5. Tus Derechos")}</h2>
            <p>
              {t('privacy.s5.p1', "Tienes el derecho de acceder, actualizar o solicitar la eliminación de tu información personal. Si deseas eliminar tu cuenta por completo, por favor contacta a la administración a través de la plataforma o envía un correo electrónico a support@motogpmanager.com.")}
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} GP Masters Manager MVP. {t('privacy.footer.rights', "Todos los derechos reservados.")}
      </footer>
    </div>
  );
};

export default Privacy;
