import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Download } from 'lucide-react';
import { SheetAnalytics } from '../../types/sheets';
import { fetchAnalytics } from '../../services/analytics';
import { Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsPanelProps {
  className?: string;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<SheetAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [period, setPeriod] = useState('6months');
  const [groupBy] = useState('month'); // usado na chamada da API
  const chartRef = useRef<HTMLDivElement>(null);

  // Buscar dados de análise
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchAnalytics({
          period,
          groupBy: groupBy as 'month' | 'year' | 'category'
        });
        
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar análises');
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, [period, groupBy]);
  
  // Esta função foi substituída por renderização inline no JSX
  
  // Navegar para o próximo slide
  const nextSlide = () => {
    setCurrentSlide(prev => 
      prev === analytics.length - 1 ? 0 : prev + 1
    );
  };
  
  // Navegar para o slide anterior
  const prevSlide = () => {
    setCurrentSlide(prev => 
      prev === 0 ? analytics.length - 1 : prev - 1
    );
  };
  
  // Exportar dados do gráfico atual
  const exportChart = () => {
    if (!analytics[currentSlide]) return;
    
    // Simulação de exportação - na implementação real, isso exportaria como PNG ou CSV
    alert('Exportação simulada: os dados seriam exportados como PNG ou CSV');
  };

  // Conteúdo de carregamento
  if (loading && !analytics.length) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-5 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="w-40 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Skeleton para o gráfico */}
        <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }
  
  // Conteúdo de erro
  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-5 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-3">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  
  // Sem dados para exibir
  if (!analytics.length) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-5 ${className}`}>
        <div className="text-center py-8 px-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Sem dados para análise</h3>
          <p className="text-gray-600">
            Crie algumas planilhas para visualizar análises e gráficos consolidados.
          </p>
        </div>
      </div>
    );
  }

  const currentChart = analytics[currentSlide];

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-800">{currentChart.title}</h3>
        
        <div className="flex items-center gap-3">
          {/* Filtros */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="6months">Últimos 6 meses</option>
            <option value="1year">Último ano</option>
            <option value="all">Todo o período</option>
          </select>
          
          <button
            onClick={exportChart}
            className="p-1.5 rounded-full hover:bg-gray-100"
            aria-label="Exportar gráfico"
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Container do gráfico com navegação */}
      <div className="relative">
        {/* Área do gráfico */}
        <div 
          ref={chartRef}
          className="min-h-64 w-full py-4 px-8"
        >
          {analytics.length > 0 && analytics[currentSlide] && (() => {
            const chart = analytics[currentSlide];
            
            // Opções comuns para todos os gráficos
            const commonOptions = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                  labels: {
                    usePointStyle: true,
                    boxWidth: 6,
                    font: {
                      size: 11
                    }
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  titleColor: '#333',
                  bodyColor: '#666',
                  borderColor: '#ddd',
                  borderWidth: 1,
                  padding: 10,
                  boxPadding: 6,
                  usePointStyle: true,
                  callbacks: {
                    label: function(context: any) {
                      const value = context.raw;
                      return `${context.dataset.label}: ${new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(value)}`;
                    }
                  }
                }
              }
            };
            
            // Fluxo de caixa e metas - gráfico de barras
            if (chart.type === 'cashflow' || chart.type === 'goals') {
              const options = {
                ...commonOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(tickValue: any) {
                        return new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          notation: 'compact',
                          compactDisplay: 'short'
                        }).format(tickValue);
                      }
                    }
                  }
                }
              };
              
              return (
                <Bar data={chart.data} options={options} />
              );
            }
            
            // Investimentos - gráfico de linha
            if (chart.type === 'investments') {
              const options = {
                ...commonOptions,
                elements: {
                  line: {
                    tension: 0.3 // curva mais suave
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(tickValue: any) {
                        return new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          notation: 'compact',
                          compactDisplay: 'short'
                        }).format(tickValue);
                      }
                    }
                  }
                }
              };
              
              return (
                <Line data={chart.data} options={options} />
              );
            }
            
            // Despesas por categoria - gráfico de rosca
            if (chart.type === 'expenses') {
              const options = {
                ...commonOptions,
                cutout: '60%',
              };
              
              return (
                <Doughnut data={chart.data} options={options} />
              );
            }
            
            return null;
          })()}
        </div>
        
        {/* Botões de navegação */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 border border-gray-100"
          aria-label="Gráfico anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 border border-gray-100"
          aria-label="Próximo gráfico"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Indicador de posição */}
        <div className="flex justify-center mt-4 space-x-2">
          {analytics.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full ${idx === currentSlide ? 'bg-blue-500' : 'bg-gray-300'}`}
              aria-label={`Ir para o gráfico ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;