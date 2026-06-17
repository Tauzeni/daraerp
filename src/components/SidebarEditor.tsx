import React, { useState } from 'react';
import { WebDesignConfig, Page, ColorPalette, Block, BlockType, CustomDbModel } from '../types';
import { COLOR_PALETTES, createDefaultBlocks } from '../data';
import { FolderPlus, Trash, ChevronUp, ChevronDown, Check, Eye, EyeOff, LayoutTemplate, Palette, Globe, HardDrive, Plus, Cpu, Settings, Shield, Zap, Users, Sparkles, RefreshCw } from 'lucide-react';

interface SidebarEditorProps {
  config: WebDesignConfig;
  onChangeConfig: (newConfig: WebDesignConfig) => void;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

export default function SidebarEditor({
  config,
  onChangeConfig,
  selectedBlockId,
  onSelectBlock
}: SidebarEditorProps) {
  const [newPageTitle, setNewPageTitle] = useState('');
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageTemplate, setNewPageTemplate] = useState<'blank' | 'landing' | 'login' | 'register' | 'dashboard' | 'custom_form' | 'ai_custom'>('landing');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('An employee portal login page with database action loggers');
  const [aiGeneratingPage, setAiGeneratingPage] = useState(false);
  const [customPalettePrompt, setCustomPalettePrompt] = useState('');
  const [aiGeneratingPalette, setAiGeneratingPalette] = useState(false);
  const activePage = config.pages.find(p => p.id === config.activePageId) || config.pages[0];

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (!config.modules) return;
    const items = [...config.modules];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    
    // Swap
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    
    const reordered = items.map((m, idx) => ({ ...m, order: idx + 1 }));
    onChangeConfig({ ...config, modules: reordered });
  };

  const moveSubmodule = (moduleIndex: number, submoduleIndex: number, direction: 'up' | 'down') => {
    if (!config.modules) return;
    const updatedModules = [...config.modules];
    const submodules = [...updatedModules[moduleIndex].submodules];
    const targetIdx = direction === 'up' ? submoduleIndex - 1 : submoduleIndex + 1;
    if (targetIdx < 0 || targetIdx >= submodules.length) return;
    
    // Swap
    const temp = submodules[submoduleIndex];
    submodules[submoduleIndex] = submodules[targetIdx];
    submodules[targetIdx] = temp;
    
    updatedModules[moduleIndex].submodules = submodules.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChangeConfig({ ...config, modules: updatedModules });
  };

  const updateModuleName = (id: string, newName: string) => {
    if (!config.modules) return;
    onChangeConfig({
      ...config,
      modules: config.modules.map(m => m.id === id ? { ...m, name: newName } : m)
    });
  };

  const updateSubmoduleName = (moduleId: string, subId: string, newName: string) => {
    if (!config.modules) return;
    onChangeConfig({
      ...config,
      modules: config.modules.map(m => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          submodules: m.submodules.map(s => s.id === subId ? { ...s, name: newName } : s)
        };
      })
    });
  };

  // Projects config
  const handleProjectNameChange = (name: string) => {
    // Sanitize to safe directory names
    const sanitized = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    onChangeConfig({
      ...config,
      projectName: sanitized
    });
  };

  // Color Theme Changing
  const handlePaletteSelect = (palette: ColorPalette) => {
    onChangeConfig({
      ...config,
      colorPalette: palette
    });
  };

  const handleGeneratePalette = async () => {
    if (!customPalettePrompt.trim()) return;
    setAiGeneratingPalette(true);
    try {
      const response = await fetch('/api/ai/generate-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: customPalettePrompt })
      });
      const data = await response.json();
      if (data.success && data.palette) {
        onChangeConfig({
          ...config,
          colorPalette: {
            id: `palette-custom-${Math.floor(Math.random() * 10000)}`,
            ...data.palette
          }
        });
        setCustomPalettePrompt('');
      } else {
        alert(data.error || 'Failed to synthesize colors.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to AI synthesizer.');
    } finally {
      setAiGeneratingPalette(false);
    }
  };

  // Page management
  const handleAddPage = () => {
    if (!newPageTitle.trim()) return;
    const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (newPageTemplate === 'ai_custom') {
      if (!aiCustomPrompt.trim()) {
        alert('Please describe what you want on the custom AI page.');
        return;
      }
      setAiGeneratingPage(true);
      fetch('/api/ai/generate-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiCustomPrompt,
          pageTitle: newPageTitle
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.layout)) {
          let updatedModels = [...(config.customDbModels || [])];
          let generatedModelId = '';

          if (data.suggestedDbModel) {
            generatedModelId = data.suggestedDbModel.id || `model-${Math.floor(Math.random() * 10000)}`;
            const newModel: CustomDbModel = {
              id: generatedModelId,
              tableName: data.suggestedDbModel.tableName || 'custom_records',
              modelName: data.suggestedDbModel.modelName || 'CustomRecord',
              fields: data.suggestedDbModel.fields || [],
              records: []
            };

            if (!updatedModels.some(m => m.tableName === newModel.tableName || m.modelName === newModel.modelName)) {
              updatedModels.push(newModel);
            }
          }

          // Ensure blocks have visible property and reference correct model binding if applicable
          const finalBlocks = data.layout.map((b: any) => {
            const prepared = { ...b, visible: b.visible !== undefined ? b.visible : true };
            if ((b.type === 'form_custom' || b.type === 'table_custom') && generatedModelId) {
              prepared.bindToCustomModelId = generatedModelId;
            }
            return prepared;
          });

          const newPage: Page = {
            id: `page-${Math.random()}`,
            title: newPageTitle,
            slug,
            blocks: finalBlocks
          };

          onChangeConfig({
            ...config,
            pages: [...config.pages, newPage],
            activePageId: newPage.id,
            customDbModels: updatedModels
          });

          setNewPageTitle('');
          setNewPageTemplate('landing');
          setShowAddPage(false);
        } else {
          alert('Failed to compile page. Error: ' + (data.error || 'Invalid layout returned'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Server connection error. Please retry template generation.');
      })
      .finally(() => {
        setAiGeneratingPage(false);
      });
      return;
    }
    
    let blocksList: Block[] = [];

    // Initialize navbar
    blocksList.push({
      id: `navbar-${Math.random()}`,
      type: 'navbar',
      visible: true,
      brand: config.projectName || 'LaraBoot',
      links: [
        { label: 'Home', url: '/' },
        { label: 'Services', url: '#features' }
      ],
      ctaText: 'Main Portal',
      ctaLink: '/',
      sticky: true,
      themeStyle: 'dark'
    } as any);

    if (newPageTemplate === 'landing') {
      blocksList.push(
        {
          id: `hero-${Math.random()}`,
          type: 'hero',
          visible: true,
          title: newPageTitle,
          subtitle: `A magnificent landing section template dedicated fully to expanding your ${config.projectName} layout.`,
          ctaText: 'Explore More',
          ctaLink: '#features',
          secondaryCtaText: 'Contact Expert',
          secondaryCtaLink: '#contact',
          layout: 'left-split',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
          bgPattern: 'gradient'
        } as any,
        {
          id: `features-${Math.random()}`,
          type: 'features',
          visible: true,
          title: 'Premium SaaS Subsystems',
          subtitle: 'Our auto-compiled modules provide robust architecture for enterprise delivery out of the box.',
          columns: 3,
          items: [
            { id: `feat-${Math.random()}`, icon: 'Sparkles', title: 'Automated Controllers', description: 'Web routing automatically bound to controller templates.' },
            { id: `feat-${Math.random()}`, icon: 'Database', title: 'Dynamic Migrations', description: 'Run fresh db seed operations dynamically on the console.' },
            { id: `feat-${Math.random()}`, icon: 'Shield', title: 'Spatie Security', description: 'Enforce roles, capabilities, and strict middleware gates.' }
          ]
        } as any,
        {
          id: `contact-${Math.random()}`,
          type: 'contact',
          visible: true,
          title: 'Start Collaborating',
          subtitle: 'Submit an inquiry to save directly into our simulated table records.',
          email: 'support@laraboot.dev',
          phone: '+1 (415) 888-0192',
          address: 'Palo Alto Silicon Core, 100 Main St',
          showMap: true,
          buttonText: 'Submit Inquiry'
        } as any
      );
    } else if (newPageTemplate === 'login') {
      blocksList.push({
        id: `login-${Math.random()}`,
        type: 'login',
        visible: true,
        title: 'Secure Access Portal',
        subtitle: 'Please input your administrator credentials below.',
        emailLabel: 'Email Account Address',
        passwordLabel: 'Access Key Password',
        rememberMeLabel: 'Remember this device for 30 days',
        buttonText: 'Authenticate Safe Connection',
        registrationLinkText: 'Initialize a new operator account',
        forgotPasswordLinkText: 'Request secure password reset',
        destinationUrl: '/dashboard'
      } as any);
    } else if (newPageTemplate === 'register') {
      blocksList.push({
        id: `register-${Math.random()}`,
        type: 'register',
        visible: true,
        title: 'Establish Operator Key',
        subtitle: 'Create a security identification to log into ' + config.projectName + '.',
        nameLabel: 'Full Identity Name',
        emailLabel: 'Operational Email Account',
        passwordLabel: 'Safe Passphrase Key',
        passwordConfirmLabel: 'Verify Secure Passphrase Key',
        buttonText: 'Register Operator Profile',
        loginLinkText: 'Already registered? Return to sign in',
        destinationUrl: '/login'
      } as any);
    } else if (newPageTemplate === 'dashboard') {
      blocksList.push({
        id: `dashboard-${Math.random()}`,
        type: 'dashboard',
        visible: true,
        title: 'Compute Node & DB Analytics Dashboard',
        subtitle: 'System core computing resources, simulated Postgres/MySQL migrations, and Spatie rule nodes.',
        userName: 'Root Security Operator',
        userRole: 'System Administrator (Full Access)',
        stats: [
          { label: 'Core CPU Usage', value: '14.2% Safe', trend: 'Optimal health score', icon: 'Cpu' },
          { label: 'Relational SQLite Nodes', value: '2 tables seeded', trend: 'Sync completed', icon: 'Database' },
          { label: 'Active Spatie Claims', value: '12 policy gates', trend: 'Zero alerts flagged', icon: 'Shield' }
        ],
        quickActions: [
          { label: 'Database Console', url: '#migrations', icon: 'Database' },
          { label: 'Spatie Security Gates', url: '#spatie', icon: 'Shield' },
          { label: 'Insert New Blog Post', url: '#content', icon: 'Plus' }
        ]
      } as any);
    } else if (newPageTemplate === 'custom_form') {
      blocksList.push(
        {
          id: `form_custom-${Math.random()}`,
          type: 'form_custom',
          visible: true,
          title: 'Dynamic Entity Intake Form',
          subtitle: 'Design custom SQL inputs that store rows inside your dynamic mock migrations automatically.',
          fields: [
            { label: 'Full Contact Name', name: 'contact_name', type: 'text', placeholder: 'e.g. Alex Mercer', required: true },
            { label: 'Secure Electronic Email', name: 'email_address', type: 'email', placeholder: 'e.g. alex@mercer.com', required: true },
            { label: 'Corporate Project Description', name: 'description', type: 'textarea', placeholder: 'Describe your requirements here...', required: false }
          ],
          buttonText: 'Submit and Auto-Save Row'
        } as any,
        {
          id: `table_custom-${Math.random()}`,
          type: 'table_custom',
          visible: true,
          title: 'Relational Database Real-Time Records',
          subtitle: 'Browse simulated SQL records from your active model. Synchronized instantly in real-time!',
        } as any
      );
    }

    // Initialize footer
    blocksList.push({
      id: `footer-${Math.random()}`,
      type: 'footer',
      visible: true,
      text: `${newPageTitle} section. Powered by compiled Laravel + Bootstrap 5 template layouts.`,
      copyright: '© ' + (new Date().getFullYear()) + ' ' + config.projectName + '. All rights reserved.',
      socials: [{ platform: 'GitHub', url: '#' }]
    } as any);

    const newPage: Page = {
      id: `page-${Math.random()}`,
      title: newPageTitle,
      slug,
      blocks: blocksList
    };

    onChangeConfig({
      ...config,
      pages: [...config.pages, newPage],
      activePageId: newPage.id
    });
    setNewPageTitle('');
    setNewPageTemplate('landing');
    setShowAddPage(false);
  };

  const handleDeletePage = (pageId: string) => {
    if (pageId === 'home') return; // Cannot delete home page
    const filtered = config.pages.filter(p => p.id !== pageId);
    onChangeConfig({
      ...config,
      pages: filtered,
      activePageId: 'home'
    });
    onSelectBlock(null);
  };

  // Block management
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...activePage.blocks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    // Swap
    const temp = blocks[index];
    blocks[index] = blocks[targetIdx];
    blocks[targetIdx] = temp;

    const updatedPages = config.pages.map(p => {
      if (p.id === activePage.id) {
        return { ...p, blocks };
      }
      return p;
    });

    onChangeConfig({
      ...config,
      pages: updatedPages
    });
  };

  const handleToggleBlockVisibility = (index: number) => {
    const blocks = [...activePage.blocks];
    blocks[index] = {
      ...blocks[index],
      visible: !blocks[index].visible
    } as Block;

    const updatedPages = config.pages.map(p => {
      if (p.id === activePage.id) {
        return { ...p, blocks };
      }
      return p;
    });

    onChangeConfig({
      ...config,
      pages: updatedPages
    });
  };

  const handleDeleteBlock = (index: number) => {
    const blocks = activePage.blocks.filter((_, idx) => idx !== index);
    const updatedPages = config.pages.map(p => {
      if (p.id === activePage.id) {
        return { ...p, blocks };
      }
      return p;
    });

    onChangeConfig({
      ...config,
      pages: updatedPages
    });
    onSelectBlock(null);
  };

  const handleAddBlock = (type: BlockType) => {
    const blocks = [...activePage.blocks];
    
    // Choose template starting values
    let newBlock: Block;
    const baseId = `${type}-${Math.random()}`;

    if (type === 'features') {
      newBlock = {
        id: baseId,
        type: 'features',
        visible: true,
        title: 'Core Business Pillars',
        subtitle: 'Our products are shaped by standard modular engineering features.',
        columns: 3,
        items: [
          { id: '1', icon: 'Sparkles', title: 'Feature Alpha', description: 'Advanced responsive capabilities.' },
          { id: '2', icon: 'Database', title: 'Feature Beta', description: 'Full persistent cloud database storage.' }
        ]
      };
    } else if (type === 'pricing') {
      newBlock = {
        id: baseId,
        type: 'pricing',
        visible: true,
        title: 'Flexible Budgets',
        subtitle: 'Unlock maximum potential with custom, low-cost commercial packages.',
        tiers: [
          { id: 't1', name: 'Standard Member', price: '$19', billing: 'per month', features: ['All layouts included', 'Bootstrap static exports'], ctaText: 'Join Standard', featured: true }
        ]
      };
    } else if (type === 'stats') {
      newBlock = {
        id: baseId,
        type: 'stats',
        visible: true,
        title: 'Growth Statistics',
        subtitle: 'Empirical milestones reflecting customer excellence.',
        items: [
          { id: 's1', number: '99%', label: 'Uptime Reliability' },
          { id: 's2', number: '1.2M', label: 'Active Seeders' }
        ]
      };
    } else if (type === 'testimonials') {
      newBlock = {
        id: baseId,
        type: 'testimonials',
        visible: true,
        title: 'Loved by Developers',
        subtitle: 'Read genuine reviews left by open-source Laravel developers.',
        items: [
          { id: 'q1', text: 'Integrating this Bootstrap model to Laravel Blade was an absolute breeze. Perfect design.', author: 'Anya Cole', role: 'Full-Stack Developer', stars: 5 }
        ]
      };
    } else if (type === 'gallery') {
      newBlock = {
        id: baseId,
        type: 'gallery',
        visible: true,
        title: 'Visual Showroom',
        subtitle: 'Craft premium layout representations using beautiful unsplash assets.',
        columns: 3,
        items: [
          { id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80', title: 'Project Zenith', description: 'SaaS framework dashboard representation.' }
        ]
      };
    } else if (type === 'contact') {
      newBlock = {
        id: baseId,
        type: 'contact',
        visible: true,
        title: 'Let\'s collaborate',
        subtitle: 'Have inquiries? Drop an inquiry to our database seeder team.',
        email: 'info@lara-bootstrap.test',
        phone: '+1 (555) 000-0000',
        address: '100 Silicon Way, Palo Alto CA',
        showMap: true,
        buttonText: 'Submit Form'
      };
    } else if (type === 'login') {
      newBlock = {
        id: baseId,
        type: 'login',
        visible: true,
        title: 'Secure Access Portal',
        subtitle: 'Please input your login credentials below.',
        emailLabel: 'Email Address',
        passwordLabel: 'Secret Key Password',
        rememberMeLabel: 'Remember this device',
        buttonText: 'Authenticate Server Action',
        registrationLinkText: 'Sign up for a new account',
        forgotPasswordLinkText: 'Reset password key',
        destinationUrl: '/dashboard'
      } as any;
    } else if (type === 'register') {
      newBlock = {
        id: baseId,
        type: 'register',
        visible: true,
        title: 'Register Safety Account',
        subtitle: 'Enter full credentials to initialize your key record.',
        nameLabel: 'Full Identity Name',
        emailLabel: 'Operational Electronic Mail',
        passwordLabel: 'Passphrase Security',
        passwordConfirmLabel: 'Verify Passphrase Security',
        buttonText: 'Enroll System Operative',
        loginLinkText: 'Return to login credentials gate',
        destinationUrl: '/login'
      } as any;
    } else if (type === 'dashboard') {
      newBlock = {
        id: baseId,
        type: 'dashboard',
        visible: true,
        title: 'Custom Dashboard Terminal',
        subtitle: 'Seeded records and live monitoring of custom DB modules.',
        userName: 'Root System Operator',
        userRole: 'Full Access Admin',
        stats: [
          { label: 'Core CPU Health', value: '24.5% safe', trend: 'Active thread ok', icon: 'Cpu' },
          { label: 'Relational SQLite DB', value: 'Seeded system path', trend: 'Standard schema compiled', icon: 'Database' }
        ],
        quickActions: [
          { label: 'Database Console', url: '#migrations', icon: 'Database' },
          { label: 'Security Spatie Keys', url: '#spatie', icon: 'Shield' }
        ]
      } as any;
    } else if (type === 'form_custom') {
      newBlock = {
        id: baseId,
        type: 'form_custom',
        visible: true,
        title: 'Dynamic Entity Intake Form',
        subtitle: 'Configure specific text, number, and email column parameters below.',
        fields: [
          { label: 'Applicant Full Name', name: 'contact_name', type: 'text', placeholder: 'e.g. Alex Grayson', required: true },
          { label: 'Intake Email Address', name: 'email_address', type: 'email', placeholder: 'e.g. alex@corporate.com', required: true }
        ],
        buttonText: 'Transmit Data Row'
      } as any;
    } else if (type === 'table_custom') {
      newBlock = {
        id: baseId,
        type: 'table_custom',
        visible: true,
        title: 'Live Custom Records Hub',
        subtitle: 'Visual model grid display mapping to custom intake entries.'
      } as any;
    } else {
      newBlock = {
        id: baseId,
        type: 'hero',
        visible: true,
        title: 'New Dynamic Section Title',
        subtitle: 'Edit this subtitle details by clicking inside the section wrapper.',
        ctaText: 'Sign Up',
        ctaLink: '#',
        secondaryCtaText: 'Cancel',
        secondaryCtaLink: '#',
        layout: 'center',
        imageUrl: '',
        bgPattern: 'default'
      };
    }

    // Insert block before the footer block if footer exists
    const footerIdx = blocks.findIndex(b => b.type === 'footer');
    if (footerIdx !== -1) {
      blocks.splice(footerIdx, 0, newBlock);
    } else {
      blocks.push(newBlock);
    }

    const updatedPages = config.pages.map(p => {
      if (p.id === activePage.id) {
        return { ...p, blocks };
      }
      return p;
    });

    onChangeConfig({
      ...config,
      pages: updatedPages
    });
    onSelectBlock(newBlock.id);
  };

  return (
    <div className="space-y-6 text-slate-300">
      {/* 1. Project Global Configurations */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5 px-0.5">
          <Settings className="w-3.5 h-3.5 text-indigo-400" />
          Laravel Project Config
        </h4>
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 space-y-4 shadow-xl">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Project Directory Name (PHP format)
            </label>
            <input
              type="text"
              value={config.projectName}
              onChange={(e) => handleProjectNameChange(e.target.value)}
              className="w-full text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none text-white font-mono"
              placeholder="lara_custom_site"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                Laravel CLI
              </label>
              <select
                value={config.laravelVersion}
                onChange={(e) => onChangeConfig({ ...config, laravelVersion: e.target.value as any })}
                className="w-full text-xs bg-slate-950/80 border border-slate-700/80 py-1.5 px-2 rounded-lg text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="v11.x">L11 (Modern)</option>
                <option value="v10.x">L10 (Stable)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                SQL Database
              </label>
              <select
                value={config.dbDriver}
                onChange={(e) => onChangeConfig({ ...config, dbDriver: e.target.value as any })}
                className="w-full text-xs bg-slate-950/80 border border-slate-700/80 py-1.5 px-2 rounded-lg text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="sqlite">SQLite (File)</option>
                <option value="mysql">MySQL (RDS)</option>
                <option value="pgsql">PostgreSQL</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Page Directory / Routes Routing */}
      <div>
        <div className="flex justify-between items-center mb-2 px-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            Page Routes (web.php)
          </h4>
          <button
            onClick={() => setShowAddPage(!showAddPage)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> Add Page
          </button>
        </div>

        {showAddPage && (
          <div className="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-xl flex flex-col gap-3 mb-4 shadow-lg text-left">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1.5">Page Route Name</label>
              <input
                type="text"
                value={newPageTitle}
                disabled={aiGeneratingPage}
                onChange={(e) => setNewPageTitle(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-slate-950 border border-slate-755 text-white rounded-lg outline-none focus:border-indigo-500 font-medium disabled:opacity-50"
                placeholder="e.g. Pricing, Security, Leads Form"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1.5">Blueprint Template Layout</label>
              <select
                value={newPageTemplate}
                disabled={aiGeneratingPage}
                onChange={(e) => setNewPageTemplate(e.target.value as any)}
                className="w-full text-xs px-2.5 py-2 bg-slate-950 border border-slate-755 text-slate-200 rounded-lg outline-none focus:border-indigo-500 cursor-pointer font-medium disabled:opacity-50"
              >
                <option value="landing">SaaS Landing Layout (Classic Home)</option>
                <option value="login">Operator Portal Login Form View</option>
                <option value="register">Operator Portal Registration View</option>
                <option value="dashboard">Analytics & Control Dashboard Portal</option>
                <option value="custom_form">Dynamic Database Custom Forms Intake</option>
                <option value="ai_custom">✨ Ask AI to Generate Custom Page Layout...</option>
                <option value="blank">Basic Blank Starter Layout</option>
              </select>
            </div>

            {newPageTemplate === 'ai_custom' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  AI Page Goal Prompt description
                </label>
                <textarea
                  rows={3}
                  disabled={aiGeneratingPage}
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-950 border border-slate-755 text-white rounded-lg outline-none focus:border-indigo-500 font-medium resize-none disabled:opacity-50"
                  placeholder="e.g. employee details submit form, survey, contact logs with relational tables..."
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                disabled={aiGeneratingPage}
                onClick={() => setShowAddPage(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiGeneratingPage}
                onClick={handleAddPage}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-1.5 text-xs font-bold cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                {aiGeneratingPage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    Designing Page...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Compile Page
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {config.pages.map(page => {
            const isActive = page.id === config.activePageId;
            return (
              <div
                key={page.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-sm'
                    : 'bg-slate-900/30 border-slate-800 text-slate-300 hover:bg-slate-900/50 home-hover-target'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChangeConfig({ ...config, activePageId: page.id });
                    onSelectBlock(null);
                  }}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-semibold text-white">{page.title}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                    GET /{page.slug === 'index' ? '' : page.slug}
                  </div>
                </button>

                {page.id !== 'home' && (
                  <button
                    onClick={() => handleDeletePage(page.id)}
                    className={`ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-400`}
                    title="Delete page"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bootstrap Themes selection */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5 px-0.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          Color Theme Schemes
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {COLOR_PALETTES.map(p => {
            const isSelected = p.id === config.colorPalette.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePaletteSelect(p)}
                className={`relative w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md' : 'bg-slate-900/30 border-slate-800 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Font: {p.fontFamily}</div>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: p.primary }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: p.secondary }} />
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 ml-1.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Color Synthesizer Action */}
        <div className="mt-3 p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-bold uppercase tracking-wide leading-none">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            AI Theme Synthesizer
          </div>
          <p className="text-[10.5px] text-slate-400 leading-normal">
            Type any style (e.g., "warm forest tones", "neon cyberpunk", "cozy coffee boutique") and Gemini will render the colors.
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Pastel sage & soft cream..."
              value={customPalettePrompt || ''}
              onChange={(e) => setCustomPalettePrompt(e.target.value)}
              className="flex-1 min-w-0 bg-slate-950 border border-slate-850 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-slate-200"
            />
            <button
              type="button"
              onClick={handleGeneratePalette}
              disabled={aiGeneratingPalette || !customPalettePrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1 flex-shrink-0 cursor-pointer transition-colors"
            >
              {aiGeneratingPalette ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <>Synthesize</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5-Layer Architect & Blade Options */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5 px-0.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          5-Layer Architect & Blade Options
        </h4>
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 space-y-4 shadow-xl">
          {/* Blade Template Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              Blade Master Layout Template
            </label>
            <select
              value={config.bladeTemplateStyle || 'landing'}
              onChange={(e) => onChangeConfig({ ...config, bladeTemplateStyle: e.target.value as any })}
              className="w-full text-xs bg-slate-950/80 border border-slate-700/80 py-1.5 px-2 rounded-lg text-slate-200 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="landing">Standard Landing Portal Theme</option>
              <option value="admin_dashboard">Enterprise Admin Workspace Theme</option>
              <option value="business_portal">Business Portal (Mega Menu) Theme</option>
              <option value="laravel_breeze">Laravel Breeze (Alpine/Tailwind Minimalist) Theme</option>
              <option value="laravel_ui">Laravel UI (Bootstrap Standard Authentic) Theme</option>
            </select>
          </div>

          <hr className="border-slate-800" />

          {/* Core MediatR & 5-Layer Architecture switches */}
          <div className="space-y-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Modular Architecture Features
            </label>
            
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={config.enableSpatiePermissions}
                onChange={(e) => onChangeConfig({ ...config, enableSpatiePermissions: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
              />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  Spatie Roles & Permissions
                </div>
                <div className="text-[10px] text-slate-500">Auto-seed Roles & guards</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={config.enableAuditTrail}
                onChange={(e) => onChangeConfig({ ...config, enableAuditTrail: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
              />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Audit Trail Action Logs
                </div>
                <div className="text-[10px] text-slate-500">Logs every Service transaction</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={config.enableDynamicMenu}
                onChange={(e) => onChangeConfig({ ...config, enableDynamicMenu: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
              />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1">
                  <Settings className="w-3 h-3 text-indigo-400" />
                  Dynamic Menu Modules
                </div>
                <div className="text-[10px] text-slate-500">Modules → Submodules sequence</div>
              </div>
            </label>
          </div>

          {/* If Dynamic Menu system, render Modules List Sort Hierarchy editor (Drag-and-Drop) */}
          {config.enableDynamicMenu && config.modules && config.modules.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                <span>Modules Order (Drag/Sort)</span>
                <span className="text-[9px] text-indigo-400 font-mono">Total: {config.modules.length}</span>
              </div>
              
              <div className="space-y-3">
                {config.modules.map((mod, modIdx) => (
                  <div key={mod.id} className="bg-slate-950/65 border border-slate-800 p-2.5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <Users className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={mod.name}
                          onChange={(e) => updateModuleName(mod.id, e.target.value)}
                          className="bg-transparent text-xs text-slate-200 border-none underline decoration-slate-800 focus:decoration-indigo-500 outline-none font-semibold p-0 w-full"
                          placeholder="Module Name"
                        />
                      </div>
                      
                      {/* Priority Ordering Arrows (Drag-and-Drop) */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={modIdx === 0}
                          onClick={() => moveModule(modIdx, 'up')}
                          className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move module up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={modIdx === config.modules.length - 1}
                          onClick={() => moveModule(modIdx, 'down')}
                          className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move module down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Submodules sort nested inside */}
                    <div className="pl-3.5 border-l border-slate-800 space-y-1.5">
                      {mod.submodules.map((sub, subIdx) => (
                        <div key={sub.id} className="flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200">
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => updateSubmoduleName(mod.id, sub.id, e.target.value)}
                            className="bg-transparent text-[11px] text-slate-400 border-none focus:underline outline-none p-0 w-2/3"
                          />
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              disabled={subIdx === 0}
                              onClick={() => moveSubmodule(modIdx, subIdx, 'up')}
                              className="text-slate-500 hover:text-slate-200 disabled:opacity-30 p-0.5"
                              title="Move submodule up"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={subIdx === mod.submodules.length - 1}
                              onClick={() => moveSubmodule(modIdx, subIdx, 'down')}
                              className="text-slate-500 hover:text-slate-200 disabled:opacity-30 p-0.5"
                              title="Move submodule down"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Active Page visual layout modules ordering */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5 px-0.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
          Block Hierarchy ({activePage.blocks.length})
        </h4>

        <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-2.5 space-y-1.5 mb-3">
          {activePage.blocks.map((block, idx) => {
            const isSelected = block.id === selectedBlockId;
            return (
              <div
                key={block.id}
                className={`p-2 rounded-lg border flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-indigo-600/30 border-indigo-500/50' : 'bg-slate-950/50 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectBlock(block.id)}
                  className={`flex-1 text-left font-mono text-[11px] capitalize font-semibold truncate hover:text-indigo-400 ${
                    isSelected ? 'text-indigo-300' : 'text-slate-300'
                  }`}
                >
                  {block.type} section
                </button>

                <div className="flex items-center gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveBlock(idx, 'up')}
                    className="p-1 rounded text-slate-400 hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={idx === activePage.blocks.length - 1}
                    onClick={() => handleMoveBlock(idx, 'down')}
                    className="p-1 rounded text-slate-400 hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleToggleBlockVisibility(idx)}
                    className="p-1 rounded text-slate-400 hover:bg-slate-800"
                    title={block.visible ? 'Hide section' : 'Show section'}
                  >
                    {block.visible ? <Eye className="w-3 h-3 text-slate-300" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                  </button>
                  {activePage.blocks.length > 2 && (
                    <button
                      onClick={() => handleDeleteBlock(idx)}
                      className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-900/20"
                      title="Remove section"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Append Sections list picker */}
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-slate-400 block uppercase px-1 pb-1">
            Insert Visual Layout Section Module
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {['hero', 'features', 'stats', 'pricing', 'blog', 'testimonials', 'gallery', 'contact', 'login', 'register', 'dashboard', 'form_custom', 'table_custom'].map(typ => {
              let label = typ;
              if (typ === 'form_custom') label = 'custom form';
              if (typ === 'table_custom') label = 'custom table';
              return (
                <button
                  key={typ}
                  type="button"
                  onClick={() => handleAddBlock(typ as any)}
                  className="bg-slate-900/30 hover:bg-indigo-600/10 border border-slate-800 rounded-lg p-2 text-left hover:border-indigo-500/50 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-slate-300 capitalize pointer-events-none">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
