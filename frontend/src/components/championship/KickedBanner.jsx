import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

/**
 * Full-page banner shown when the current user has been kicked from the championship.
 * This is an early-return view — it replaces the entire page content.
 */
const KickedBanner = ({ championship }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-fadeIn">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO DASHBOARD
      </button>

      <div className="glass rounded-2xl border border-red-500/20 p-8 text-center space-y-6 bg-gradient-to-br from-red-950/20 to-transparent">
        <div className="inline-flex items-center justify-center p-4 bg-red-600/10 border border-red-500/25 rounded-2xl">
          <Shield className="w-12 h-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Has sido expulsado de este campeonato</h2>
          <p className="text-gray-450 text-sm max-w-md mx-auto leading-relaxed">
            Un organizador (Master o Admin) te ha retirado la participación activa de este torneo.
          </p>
        </div>
        {championship.kick_reason && (
          <div className="bg-[#0F0F12]/80 border border-red-500/10 p-5 rounded-2xl max-w-lg mx-auto text-left space-y-1">
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block">Motivo especificado:</span>
            <p className="text-gray-300 text-sm leading-relaxed italic">"{championship.kick_reason}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KickedBanner;
