import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Terms = () => {
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
            {t('terms.back', "Volver al Inicio")}
          </button>
          <div className="font-extrabold text-white text-lg tracking-wider">
            MASTERS MANAGER
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">{t('terms.title', "Términos de Servicio")}</h1>
            <p className="text-gray-500 mt-1">{t('terms.last_updated', "Última actualización: Julio 2026")}</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-400 leading-relaxed bg-[#16161C] p-8 md:p-12 rounded-3xl border border-gray-800 shadow-xl">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.s1.title', "1. Aceptación de Términos")}</h2>
            <p>
              {t('terms.s1.p1', "Al acceder y jugar a GP Masters Manager MVP, aceptas y acuerdas estar sujeto a los términos y disposiciones de este acuerdo. Si no aceptas cumplir con estos términos, no debes usar este servicio.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.s2.title', "2. Registro de Cuenta y Reglas")}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('terms.s2.l1', "Debes proporcionar una dirección de correo electrónico válida y una contraseña segura para crear una cuenta.")}</li>
              <li>{t('terms.s2.l2', "Eres responsable de mantener la confidencialidad de las credenciales de tu cuenta.")}</li>
              <li>{t('terms.s2.l3', "Aceptas no usar scripts automatizados, bots ni explotar errores para obtener una ventaja injusta en la simulación.")}</li>
              <li>{t('terms.s2.l4', "Los administradores se reservan el derecho de prohibir o suspender cuentas que infrinjan las pautas de juego limpio.")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.s3.title', "3. Motor de Simulación y Juego")}</h2>
            <p>
              {t('terms.s3.p1', "GP Masters Manager MVP depende de un motor de físicas y simulación personalizado para calcular los resultados de las carreras. Los resultados generados por el motor son definitivos. No garantizamos el tiempo de actividad ininterrumpido de los servidores de simulación, y pueden ocurrir períodos de mantenimiento sin previo aviso.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.s4.title', "4. Contenido del Usuario")}</h2>
            <p>
              {t('terms.s4.p1', "Los usuarios pueden crear campeonatos y equipos. Aceptas no usar lenguaje ofensivo, difamatorio o inapropiado para nombres de usuario, nombres de equipos o nombres de campeonatos. Los administradores se reservan el derecho de renombrar o eliminar contenido considerado inapropiado.")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t('terms.s5.title', "5. Modificaciones del Servicio")}</h2>
            <p>
              {t('terms.s5.p1', "Nos reservamos el derecho de modificar o discontinuar, temporal o permanentemente, el servicio (o cualquier parte del mismo) con o sin previo aviso. No seremos responsables ante ti ni ante terceros por cualquier modificación, suspensión o interrupción del servicio.")}
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} GP Masters Manager MVP. {t('terms.footer.rights', "Todos los derechos reservados.")}
      </footer>
    </div>
  );
};

export default Terms;
