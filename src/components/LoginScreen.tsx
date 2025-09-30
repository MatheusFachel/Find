import React, { useState } from 'react';
import { DollarSign, TrendingUp, Shield, BarChart3, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LoginScreenProps {
  onLogin?: () => void; // opcional agora; App poderá usar sessão diretamente
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // sucesso: dispara callback (opcional) e deixa App cuidar via onAuthStateChange
        onLogin?.();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo('Conta criada com sucesso. Verifique seu email para confirmar, se necessário, e faça login.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError('Informe seu email para recuperar a senha.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setInfo('Enviamos um link de recuperação de senha para seu email.');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar o email de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const title = mode === 'login' ? 'Faça seu login' : 'Crie sua conta';
  const cta = mode === 'login' ? 'Entrar' : 'Criar conta';

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Boas-vindas */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">FinanceFlow</h1>
                <p className="text-emerald-100">Gestão Financeira Pessoal</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Bem-vindo ao seu
                <br />
                <span className="text-emerald-200">controle financeiro</span>
              </h2>
              <p className="text-xl text-emerald-100 leading-relaxed">
                Organize suas finanças de forma inteligente e tome decisões mais conscientes sobre seu dinheiro.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg mt-1">
                  <TrendingUp className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Controle Total</h3>
                  <p className="text-emerald-100">
                    Monitore todas suas entradas e saídas em tempo real
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg mt-1">
                  <BarChart3 className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Divisão Inteligente</h3>
                  <p className="text-emerald-100">
                    Configure como dividir seu capital automaticamente
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg mt-1">
                  <Shield className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Dados Seguros</h3>
                  <p className="text-emerald-100">
                    Suas informações ficam protegidas no Supabase com RLS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Login/Cadastro */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FinanceFlow</h1>
              <p className="text-sm text-gray-500">Gestão Financeira Pessoal</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600">
                {mode === 'login' ? 'Acesse sua conta para gerenciar suas finanças' : 'Crie sua conta para começar a organizar suas finanças'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {info && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5" />
                <span className="text-sm">{info}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
                </label>
                <button type="button" onClick={handleResetPassword} className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{mode === 'login' ? 'Entrando...' : 'Criando...'}</span>
                  </div>
                ) : (
                  cta
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                </p>
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null); }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  {mode === 'login' ? 'Criar conta gratuita' : 'Fazer login'}
                </button>
              </div>
            </div>

            {/* Nota */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 text-center">
                Seu acesso é validado no Supabase. É necessário criar uma conta para entrar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;