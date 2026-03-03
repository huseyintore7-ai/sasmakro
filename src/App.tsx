import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { analyzeMacros } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, FileCode2, AlertCircle, History, PlusCircle, Download, ArrowLeft, FileText, ChevronRight } from 'lucide-react';

interface AnalysisRecord {
  id: string;
  date: string;
  title: string;
  result: string;
}

export default function App() {
  const [v1Original, setV1Original] = useState<File | null>(null);
  const [v1Modified, setV1Modified] = useState<File | null>(null);
  const [v2Original, setV2Original] = useState<File | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'view'>('new');
  const [viewingRecord, setViewingRecord] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sas_analysis_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveToHistory = (record: AnalysisRecord) => {
    const updated = [record, ...history];
    setHistory(updated);
    localStorage.setItem('sas_analysis_history', JSON.stringify(updated));
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    if (!v1Modified || !v2Original) {
      setError('V1_Düzeltilmiş ve V2_Orijinal dosyaları zorunludur.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const v1OrigContent = v1Original ? await readFileContent(v1Original) : '';
      const v1ModContent = await readFileContent(v1Modified);
      const v2OrigContent = await readFileContent(v2Original);

      const analysisResult = await analyzeMacros(v1OrigContent, v1ModContent, v2OrigContent);
      
      const newRecord: AnalysisRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        title: `${v1Modified.name} & ${v2Original.name} Analizi`,
        result: analysisResult
      };
      
      saveToHistory(newRecord);
      setViewingRecord(newRecord);
      setActiveTab('view');
    } catch (err: any) {
      setError(err.message || 'Dosyalar okunurken veya analiz edilirken bir hata oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartNew = () => {
    setV1Original(null);
    setV1Modified(null);
    setV2Original(null);
    setError(null);
    setViewingRecord(null);
    setActiveTab('new');
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-5xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
        
        {/* Header */}
        <div className="text-center space-y-2 no-print">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-600 rounded-2xl mb-4">
            <FileCode2 size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            SAS IFRS 17 Makro Taşıma Aracı
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Kurumunuza özel (customized) SAS makrolarını, yeni IFRS 17 versiyonuna sorunsuz ve mantıksal bütünlük içinde taşıyın.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-8 w-fit mx-auto no-print">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <PlusCircle size={18} />
            Yeni Analiz
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <History size={18} />
            Geçmiş İşlemler
          </button>
        </div>

        {/* Tab Content: New Analysis */}
        {activeTab === 'new' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 no-print">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FileUpload
                label="V1 Orijinal (Opsiyonel)"
                description="Kurulumdaki ilk, dokunulmamış SAS makrosu."
                file={v1Original}
                onFileSelect={setV1Original}
              />
              <FileUpload
                label="V1 Düzeltilmiş (Zorunlu)"
                description="Kurumun kendi iş kuralları için yaptığı eklemeler."
                file={v1Modified}
                onFileSelect={setV1Modified}
              />
              <FileUpload
                label="V2 Orijinal (Zorunlu)"
                description="SAS'ın yayınladığı yeni versiyona ait saf makro."
                file={v2Original}
                onFileSelect={setV2Original}
              />
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !v1Modified || !v2Original}
                className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analiz Ediliyor...
                  </>
                ) : (
                  'Analizi Başlat'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 no-print">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Geçmiş Analizler</h2>
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <History size={48} className="mx-auto mb-4 opacity-20" />
                <p>Henüz geçmiş bir işlem bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(record => (
                  <div 
                    key={record.id} 
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors group cursor-pointer" 
                    onClick={() => { setViewingRecord(record); setActiveTab('view'); }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{record.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(record.date).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-400 group-hover:text-emerald-500" size={20} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: View Record */}
        {activeTab === 'view' && viewingRecord && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 no-print">
              <button
                onClick={() => setActiveTab('history')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft size={18} />
                Geri Dön
              </button>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Download size={18} />
                  PDF İndir
                </button>
                <button
                  onClick={handleStartNew}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
                >
                  <PlusCircle size={18} />
                  Yeni İşlem
                </button>
              </div>
            </div>

            {/* Result Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 overflow-x-auto print:shadow-none print:border-none print:p-0">
              <div id="pdf-content" className="markdown-body">
                <div className="mb-8 pb-6 border-b border-slate-100">
                  <h1 className="!text-2xl !mt-0 !mb-2 !border-0 !pb-0">{viewingRecord.title}</h1>
                  <p className="text-slate-500 text-sm">
                    Analiz Tarihi: {new Date(viewingRecord.date).toLocaleString('tr-TR')}
                  </p>
                </div>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {viewingRecord.result}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
