import React, { useState } from 'react';
import { createInitialConfig } from './data';
import { WebDesignConfig, Block } from './types';
import SidebarEditor from './components/SidebarEditor';
import CanvasPreview from './components/CanvasPreview';
import BlockEditor from './components/BlockEditor';
import LaravelViewer from './components/LaravelViewer';
import ContentDatabase from './components/ContentDatabase';
import ProjectExporter from './components/ProjectExporter';
import { 
  Sparkles, 
  Code, 
  Database, 
  Workflow, 
  Download, 
  Layout, 
  Settings, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Play, 
  AlertCircle, 
  RefreshCw,
  FolderOpen,
  Edit3
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<WebDesignConfig>(createInitialConfig());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'database' | 'export'>('visual');
  const [viewportWidth, setViewportWidth] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // AI Layout Generator variables
  const [aiPrompt, setAiPrompt] = useState('An innovative cyber security software suite offering firewall, cloud scanning, and real-time team encryption');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Helper to handle Block edits
  const handleUpdateBlock = (updatedBlock: Block) => {
    const activePage = config.pages.find(p => p.id === config.activePageId) || config.pages[0];
    const updatedBlocks = activePage.blocks.map(b => (b.id === updatedBlock.id ? updatedBlock : b));
    
    const updatedPages = config.pages.map(p => {
      if (p.id === activePage.id) {
        return { ...p, blocks: updatedBlocks };
      }
      return p;
    });

    setConfig({
      ...config,
      pages: updatedPages
    });
  };

  // Ask server-side Gemini to generate a tailored landing page block config
  const handleAiGenerateLayout = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          pageTitle: config.projectName
        })
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.layout)) {
        const activePage = config.pages.find(p => p.id === config.activePageId) || config.pages[0];
        const updatedPages = config.pages.map(p => {
          if (p.id === activePage.id) {
            return { 
              ...p, 
              title: 'Custom AI Page',
              blocks: data.layout 
            };
          }
          return p;
        });

        setConfig({
          ...config,
          pages: updatedPages
        });
        setSelectedBlockId(null);
        alert('AI successfully synthesized your custom Bootstrap layout. Check the preview!');
      } else {
        alert(data.error || 'Server rejected AI layout template compile.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to backend server configuration.');
    } finally {
      setAiGenerating(false);
    }
  };

  const activePage = config.pages.find(p => p.id === config.activePageId) || config.pages[0];
  const selectedBlock = activePage.blocks.find(b => b.id === selectedBlockId);

  return (
    <div id="cms-main-root" className="min-h-screen bg-[#0F172A] flex flex-col font-sans select-none antialiased text-slate-300">
      {/* 1. Header Navigation Bar */}
      <nav className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 text-slate-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex justify-between h-14 items-center">
            {/* Left Brand with Target Platform Switcher */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-650 bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 text-sm">
                  L
                </div>
                <div className="h-4 w-px bg-slate-700"></div>
                <div>
                  <h1 className="font-semibold text-sm tracking-tight text-white leading-none">
                    LaraBoot Studio CMS
                  </h1>
                </div>
              </div>

              {/* Exporter Target Stack selector - DaraERP C# Compliance rule integration */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, exportPlatform: 'laravel' })}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all uppercase tracking-wider cursor-pointer ${
                    (config.exportPlatform || 'laravel') === 'laravel'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Laravel Stack
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, exportPlatform: 'dotnet' })}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all uppercase tracking-wider cursor-pointer ${
                    config.exportPlatform === 'dotnet'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  C# DaraERP Clean
                </button>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex h-full items-center gap-1">
              <div className="flex rounded-md bg-slate-900/50 p-1">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`rounded px-3 py-1 text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    activeTab === 'visual'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layout className="w-3 h-3" />
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`rounded px-3 py-1 text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    activeTab === 'code'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3 h-3" />
                  Logic & Views
                </button>
                <button
                  onClick={() => setActiveTab('database')}
                  className={`rounded px-3 py-1 text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    activeTab === 'database'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Database className="w-3 h-3" />
                  CMS Database
                </button>
              </div>

              <button
                onClick={() => setActiveTab('export')}
                className={`rounded-md bg-indigo-600 hover:bg-indigo-700 font-semibold px-4 py-1.5 text-xs text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all ml-2`}
              >
                <Download className="w-3.5 h-3.5" />
                Publish & Export
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Main Workspace Layout */}
      {activeTab === 'visual' ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Top Panel: AI Genie Generator Prompts */}
          <div className="bg-slate-900/40 border-b border-slate-700/50 py-3 px-4 lg:px-6 flex-shrink-0 text-white">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/20 p-1.5 rounded-lg border border-indigo-500/30">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-[10px] uppercase tracking-widest text-slate-400">AI Layout Genie</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Gemini instantly designs custom landing sections</p>
                </div>
              </div>

              {/* Prompt box */}
              <div className="flex-1 max-w-2xl flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1 text-[11px] bg-slate-950/80 border border-slate-750 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. A dental clinic with schedule, features grid, pricing tier and team reviews..."
                />
                <button
                  type="button"
                  onClick={handleAiGenerateLayout}
                  disabled={aiGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
                >
                  {aiGenerating ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Designing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Build Section
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            {/* Left config layout rail */}
            <div className="w-full lg:w-80 border-r border-slate-700/50 bg-slate-800/40 p-6 overflow-y-auto max-h-[300px] lg:max-h-full">
              <SidebarEditor
                config={config}
                onChangeConfig={setConfig}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
              />
            </div>

            {/* Middle visual preview wrapper */}
            <div className="flex-1 flex flex-col bg-[#020617] overflow-hidden relative">
              {/* Width switches */}
              <div className="bg-slate-900/60 p-2.5 border-b border-slate-700/50 flex items-center justify-between z-10 flex-shrink-0">
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider ml-1 uppercase">
                  Workspace Visual Canvas
                </span>
                
                <div className="flex bg-slate-950/80 border border-slate-700/50 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewportWidth('desktop')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewportWidth === 'desktop' ? 'bg-indigo-650 text-white' : 'text-slate-500 hover:text-slate-100'
                    }`}
                    title="Desktop Preview 100%"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewportWidth('tablet')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewportWidth === 'tablet' ? 'bg-indigo-650 text-white' : 'text-slate-500 hover:text-slate-100'
                    }`}
                    title="Tablet Preview 768px"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewportWidth('mobile')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewportWidth === 'mobile' ? 'bg-indigo-650 text-white' : 'text-slate-500 hover:text-slate-100'
                    }`}
                    title="Mobile Portrait 375px"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewport render block */}
              <div className="flex-1 overflow-hidden flex flex-col relative p-6">
                <div className="flex-1 overflow-hidden rounded-t-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <CanvasPreview
                    config={config}
                    onChangeConfig={setConfig}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                    viewportWidth={viewportWidth}
                  />
                </div>
              </div>
            </div>

            {/* Right configuration properties panel */}
            <div className="w-full lg:w-80 border-l border-slate-700/50 bg-slate-800/40 p-6 overflow-y-auto max-h-[300px] lg:max-h-full">
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  onChangeBlock={handleUpdateBlock}
                  config={config}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-lg border border-slate-700/50 bg-slate-900/40 flex items-center justify-center mb-3 text-indigo-400">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#6366F1]">Style Inspector</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Click any element inside the mock canvas to edit colors, copy, spacing, and dynamic parameters.
                  </p>
                  <div className="mt-8 w-full">
                    <div className="rounded-lg bg-indigo-500/10 p-4 border border-indigo-500/20 text-left">
                      <h4 className="text-[11px] font-bold text-indigo-300 uppercase mb-2">Blade Context</h4>
                      <pre className="text-[10px] text-indigo-200/70 font-mono leading-relaxed overflow-x-auto">
{`@extends('layouts.app')
@section('content')
  <x-laravel-live />
@endsection`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'code' ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0F172A]">
          <LaravelViewer config={config} />
        </div>
      ) : activeTab === 'database' ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0F172A]">
          <ContentDatabase config={config} onChangeConfig={setConfig} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0F172A]">
          <ProjectExporter config={config} />
        </div>
      )}

      {/* 3. Sleek Footer metrics panel */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-700/50 bg-slate-800/80 px-4 text-slate-400">
        <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Connected
          </span>
          {config.exportPlatform === 'dotnet' ? (
            <>
              <span className="text-cyan-400 font-bold">.NET 8.0 Solution</span>
              <span>DaraERP v2.0 Rule engine</span>
            </>
          ) : (
            <>
              <span>Laravel 11.x</span>
              <span>PHP 8.3 VM</span>
            </>
          )}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Stage Selection: <span className="text-white font-semibold">{activePage.title} &gt; {selectedBlock ? selectedBlock.type : 'none'}</span>
        </div>
      </footer>
    </div>
  );
}
