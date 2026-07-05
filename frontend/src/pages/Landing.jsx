import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Activity, CloudLightning, Users, Shield, ArrowRight, Zap, Target, CheckCircle2, ChevronDown } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

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
      title: "Team Management",
      description: "Draft top pilots, manage your budget, and build the ultimate racing team capable of winning the championship.",
      color: "blue"
    },
    {
      icon: <Activity className="w-6 h-6 text-green-500" />,
      title: "Live Simulation Engine",
      description: "Watch the race unfold with our advanced physics-based engine calculating wear, weather, and pilot skills in real-time.",
      color: "green"
    },
    {
      icon: <CloudLightning className="w-6 h-6 text-purple-500" />,
      title: "Dynamic Weather",
      description: "Adapt your strategy on the fly as weather conditions change dramatically during the race weekend.",
      color: "purple"
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "Motorcycle Setup",
      description: "Fine-tune your bikes for each unique circuit to gain those crucial milliseconds per lap.",
      color: "yellow"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      desc: "Join the paddock and get your manager license."
    },
    {
      number: "02",
      title: "Join a Championship",
      desc: "Find an active league or create your own with custom rules."
    },
    {
      number: "03",
      title: "Draft Your Pilots",
      desc: "Select the best talent that fits your team's budget and strategy."
    },
    {
      number: "04",
      title: "Race to Glory",
      desc: "Manage setups, monitor weather, and win the constructor's title."
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
              Sign In
            </button>
            <button
              onClick={() => navigate('/login', { state: { isRegister: true } })}
              className="px-5 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Play Now
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
            <span>Season 2026 is Live</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 mb-6 drop-shadow-2xl">
            RULE THE <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">PADDOCK</span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-gray-400 font-light mb-10 leading-relaxed">
            Take control of your own MotoGP team. Draft elite pilots, master dynamic weather conditions, and outsmart your rivals in our advanced physics-based race simulation.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/login', { state: { isRegister: true } })}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-extrabold rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              START YOUR CAREER
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-gray-800/50 hover:bg-gray-800 text-white font-bold rounded-2xl border border-gray-700/50 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              Discover Features
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
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white">Next-Gen Management</h2>
            <p className="text-gray-400 text-lg">Every decision counts. From the drafting room to the checkered flag, experience the most authentic motorsport management simulation.</p>
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
                Your Journey to <br /> <span className="text-red-500">World Champion</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10">
                Start from the bottom, manage your resources wisely, and climb the ranks of the global leaderboard.
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
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Ready to hit the <span className="text-red-500">apex?</span></h2>
          <p className="text-xl text-gray-400 mb-10">Join thousands of managers and compete for the world championship today.</p>
          <button
            onClick={() => navigate('/login', { state: { isRegister: true } })}
            className="px-10 py-5 bg-white text-black font-extrabold text-lg rounded-2xl hover:bg-gray-200 shadow-xl shadow-white/10 active:scale-95 transition-all flex items-center gap-3 mx-auto group"
          >
            CREATE FREE ACCOUNT
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
            © {new Date().getFullYear()} MotoGP Manager MVP. All rights reserved.
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
