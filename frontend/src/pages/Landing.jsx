import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Activity, CloudLightning, Users, Shield, ArrowRight, Zap, Target, CheckCircle2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();

  // Handle scroll to add background to fixed navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: t('landing.features.team.title', "Gestión de Equipo"),
      description: t('landing.features.team.desc', "Ficha a los mejores pilotos, gestiona tu presupuesto y construye el equipo definitivo capaz de ganar el campeonato."),
      color: "blue"
    },
    {
      icon: <Activity className="w-6 h-6 text-green-500" />,
      title: t('landing.features.sim.title', "Motor de Simulación en Vivo"),
      description: t('landing.features.sim.desc', "Observa cómo se desarrolla la carrera con nuestro avanzado motor basado en físicas que calcula desgaste, clima y habilidades en tiempo real."),
      color: "green"
    },
    {
      icon: <CloudLightning className="w-6 h-6 text-purple-500" />,
      title: t('landing.features.weather.title', "Clima Dinámico"),
      description: t('landing.features.weather.desc', "Adapta tu estrategia sobre la marcha a medida que las condiciones climáticas cambian drásticamente durante el fin de semana de carrera."),
      color: "purple"
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: t('landing.features.setup.title', "Configuración de Moto"),
      description: t('landing.features.setup.desc', "Ajusta tus motos para cada circuito único para ganar esas milésimas de segundo cruciales por vuelta."),
      color: "yellow"
    }
  ];

  const steps = [
    {
      number: "01",
      title: t('landing.steps.1.title', "Crea Tu Cuenta"),
      desc: t('landing.steps.1.desc', "Únete al paddock y obtén tu licencia de mánager.")
    },
    {
      number: "02",
      title: t('landing.steps.2.title', "Únete a un Campeonato"),
      desc: t('landing.steps.2.desc', "Encuentra una liga activa o crea la tuya propia con reglas personalizadas.")
    },
    {
      number: "03",
      title: t('landing.steps.3.title', "Ficha a Tus Pilotos"),
      desc: t('landing.steps.3.desc', "Selecciona el mejor talento que se ajuste al presupuesto y estrategia de tu equipo.")
    },
    {
      number: "04",
      title: t('landing.steps.4.title', "Compite por la Gloria"),
      desc: t('landing.steps.4.desc', "Gestiona configuraciones, monitorea el clima y gana el título de constructores.")
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-gray-200 font-sans selection:bg-red-500/30 selection:text-white overflow-x-hidden">

      {/* Navigation Header */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0C]/90 backdrop-blur-md border-b border-gray-800/50 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none group">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-red-600/20">
              GP
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-wider">
                MOTOGP
              </span>
              <span className="font-light text-gray-400 text-xs block -mt-1 uppercase tracking-widest">
                Manager MVP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              {t('landing.nav.signin', "Iniciar Sesión")}
            </button>
            <button
              onClick={() => navigate('/login', { state: { isRegister: true } })}
              className="px-5 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              {t('landing.nav.playnow', "Jugar Ahora")}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Gradients & Elements */}
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>

        <div className="max-w-7xl mx-auto px-4 w-full relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up">
            <Trophy className="w-4 h-4" />
            <span>{t('landing.hero.badge', "La Temporada 2026 está en Directo")}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 mb-6 drop-shadow-2xl">
            {t('landing.hero.title1', "DOMINA EL")} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">{t('landing.hero.title2', "PADDOCK")}</span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-gray-400 font-light mb-10 leading-relaxed">
            {t('landing.hero.desc', "Toma el control de tu propio equipo de MotoGP. Ficha pilotos de élite, domina las condiciones climáticas dinámicas y supera a tus rivales en nuestra avanzada simulación de carreras basada en físicas.")}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/login', { state: { isRegister: true } })}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-extrabold rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              {t('landing.hero.start', "COMIENZA TU CARRERA")}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-gray-800/50 hover:bg-gray-800 text-white font-bold rounded-2xl border border-gray-700/50 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              {t('landing.hero.discover', "Descubrir Características")}
            </button>
          </div>

          <div className="mt-20 animate-bounce cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative bg-[#0F0F12] border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white">{t('landing.nextgen.title', "Gestión de Nueva Generación")}</h2>
            <p className="text-gray-400 text-lg">{t('landing.nextgen.desc', "Cada decisión cuenta. Desde la sala de fichajes hasta la bandera a cuadros, experimenta la simulación de gestión de deportes de motor más auténtica.")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-[#16161C] border border-gray-800 rounded-3xl p-8 hover:bg-[#1A1A24] transition-colors group">
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">

            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white leading-tight">
                {t('landing.journey.title1', "Tu Camino a")} <br /> <span className="text-red-500">{t('landing.journey.title2', "Campeón del Mundo")}</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10">
                {t('landing.journey.desc', "Comienza desde abajo, gestiona tus recursos sabiamente y escala posiciones en la clasificación global.")}
              </p>

              <div className="space-y-8">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center font-black text-gray-400 group-hover:bg-red-500/10 group-hover:text-red-500 group-hover:border-red-500/30 transition-all">
                        {step.number}
                      </div>
                      {idx !== steps.length - 1 && (
                        <div className="w-px h-full bg-gray-800 mt-4 group-hover:bg-red-500/30 transition-colors"></div>
                      )}
                    </div>
                    <div className="pb-8">
                      <h4 className="text-xl font-bold text-gray-200 mb-2">{step.title}</h4>
                      <p className="text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-[#16161C] border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full pointer-events-none group-hover:bg-red-500/20 transition-colors"></div>
                <div className="flex items-center gap-4 mb-8">
                  <Shield className="w-8 h-8 text-red-500" />
                  <div>
                    <h3 className="font-bold text-white text-lg">Live Race Dashboard</h3>
                    <p className="text-sm text-gray-400">Simulation Engine Preview</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'M. Márquez', pos: 1, gap: 'Leader', pace: '1:31.420', status: 'Pushing' },
                    { name: 'P. Acosta', pos: 2, gap: '+0.142', pace: '1:31.455', status: 'Managing' },
                    { name: 'J. Martín', pos: 3, gap: '+1.205', pace: '1:31.602', status: 'Tire Wear' },
                  ].map((rider, idx) => (
                    <div key={idx} className="bg-[#0F0F12] border border-gray-800/50 rounded-2xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-sm text-gray-300">
                          P{rider.pos}
                        </div>
                        <div>
                          <div className="font-bold text-gray-200">{rider.name}</div>
                          <div className="text-xs text-gray-500">Gap: {rider.gap}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-white">{rider.pace}</div>
                        <div className={`text-xs font-semibold ${rider.status === 'Pushing' ? 'text-red-400' : rider.status === 'Managing' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {rider.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative border-t border-gray-800/50 bg-[#16161C]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">{t('landing.cta.title1', "¿Listo para llegar al")} <span className="text-red-500">{t('landing.cta.title2', "vértice?")}</span></h2>
          <p className="text-xl text-gray-400 mb-10">{t('landing.cta.desc', "Únete a miles de mánagers y compite por el campeonato mundial hoy mismo.")}</p>
          <button
            onClick={() => navigate('/login', { state: { isRegister: true } })}
            className="px-10 py-5 bg-white text-black font-extrabold text-lg rounded-2xl hover:bg-gray-200 shadow-xl shadow-white/10 active:scale-95 transition-all flex items-center gap-3 mx-auto group"
          >
            {t('landing.cta.btn', "CREAR CUENTA GRATIS")}
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0C] border-t border-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 select-none opacity-50">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white font-extrabold">
              GP
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-wider">
                MOTOGP MANAGER
              </span>
            </div>
          </div>
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} MotoGP Manager MVP. {t('landing.footer.rights', "Todos los derechos reservados.")}
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">{t('landing.footer.privacy', "Privacidad")}</button>
            <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">{t('landing.footer.terms', "Términos")}</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
