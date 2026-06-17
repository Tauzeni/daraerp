import React, { useState } from 'react';
import { WebDesignConfig } from '../types';
import { generateLaravelFiles } from '../utils/laravel-generator';
import { generateDotnetFiles } from '../utils/dotnet-generator';
import JSZip from 'jszip';
import { Download, CheckCircle2, ShieldCheck, Terminal, HelpCircle, Server, Code, Layers, Folder, FolderOpen, FileCode, ChevronDown, ChevronRight, Settings } from 'lucide-react';

interface ProjectExporterProps {
  config: WebDesignConfig;
}

interface TreeNode {
  name: string;
  type: 'dir' | 'file';
  description?: string;
  children?: TreeNode[];
}

export default function ProjectExporter({ config }: ProjectExporterProps) {
  const [zipping, setZipping] = useState(false);
  const [complete, setComplete] = useState(false);
  const [rightTab, setRightTab] = useState<'cli' | 'tree'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'app': true,
    'config': true,
    'database': false,
    'resources': false,
    'routes': false,
  });

  const isDotnet = config.exportPlatform === 'dotnet';

  const toggleNode = (nodeName: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeName]: !prev[nodeName] }));
  };

  // Generate ZIP bundle on the client side using the highly robust JSZip
  const handleZipDownload = async () => {
    setZipping(true);
    setComplete(false);

    try {
      const files = isDotnet ? generateDotnetFiles(config) : generateLaravelFiles(config);
      const zip = new JSZip();

      // Loop through computed key/value sets representing path names and text scripts
      Object.entries(files).forEach(([filePath, content]) => {
        zip.file(filePath, content);
      });

      // Compile binary blob
      const contentBlob = await zip.generateAsync({ type: 'blob' });
      
      // Save directly to user filesystem
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(contentBlob);
      downloadLink.download = `${config.projectName || 'clean_architecture_project'}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setComplete(true);
      setTimeout(() => setComplete(false), 5000);
    } catch (e) {
      console.error(e);
      alert(isDotnet ? 'Failed to package .NET Solution.' : 'Failed to package Laravel structure.');
    } finally {
      setZipping(false);
    }
  };

  const laravelTreeData: TreeNode[] = [
    {
      name: 'app',
      type: 'dir',
      description: 'Core application code (MVC & Business architecture)',
      children: [
        {
          name: 'Http/Controllers',
          type: 'dir',
          children: [
            { name: 'HomeController.php', type: 'file', description: 'Handles front welcome routes and dashboard views rendering' }
          ]
        },
        {
          name: 'Models',
          type: 'dir',
          children: [
            { name: 'BlogPost.php', type: 'file', description: 'Eloquent Model mapping custom blog articles & parameters' },
            { name: 'Product.php', type: 'file', description: 'Eloquent Model mapping shop items and inventory metrics' },
            { name: 'AuditTrail.php', type: 'file', description: 'Saves platform user logs, schema events & record status' }
          ]
        },
        {
          name: 'Repositories',
          type: 'dir',
          children: [
            { name: 'Contracts/BaseRepositoryInterface.php', type: 'file', description: 'Blueprint Interface declaring standard generic CRUD functions' },
            { name: 'Eloquent/BaseRepository.php', type: 'file', description: 'Database concrete handler carrying DB executions safely' }
          ]
        },
        {
          name: 'Services',
          type: 'dir',
          children: [
            { name: 'BlogPostService.php', type: 'file', description: 'Handles publishing restrictions, inputs, and database transfers' },
            { name: 'ProductService.php', type: 'file', description: 'Validates quantity values, computes total costs and inventory thresholds' }
          ]
        },
        {
          name: 'Providers',
          type: 'dir',
          children: [
            { name: 'AppServiceProvider.php', type: 'file', description: 'Registers Spatie Gates and registers global database models callbacks' },
            { name: 'RepositoryServiceProvider.php', type: 'file', description: 'Binds all interface contracts to Concrete adapters automatically' }
          ]
        }
      ]
    },
    {
      name: 'bootstrap',
      type: 'dir',
      description: 'Application framework bootstrappers and active cache drivers',
      children: [
        { name: 'app.php', type: 'file', description: 'Laravel 11 routing, exceptions handler and active middlewares registry' },
        { name: 'providers.php', type: 'file', description: 'Master Service provider list used to bootstrap app components' },
        { name: 'cache/', type: 'dir', description: 'Temporary system performance execution indexes' }
      ]
    },
    {
      name: 'config',
      type: 'dir',
      description: 'Production configuration suite including Spatie permission rules',
      children: [
        { name: 'app.php', type: 'file', description: 'Application general configurations, encryption algorithms and locale keys' },
        { name: 'auth.php', type: 'file', description: 'Roles authentication guards mapping controllers to dynamic users' },
        { name: 'cache.php', type: 'file', description: 'Optimized performance cache stores setup' },
        { name: 'database.php', type: 'file', description: 'SQL DB config files mapping Postgres/MySQL/SQLite pools' },
        { name: 'filesystems.php', type: 'file', description: 'Folder target disk drivers used for local upload or Amazon S3 buckets' },
        { name: 'logging.php', type: 'file', description: 'Custom logging pathways storing system event journals' },
        { name: 'mail.php', type: 'file', description: 'SMTP port variables and system mailing triggers' },
        { name: 'permission.php', type: 'file', description: 'Spatie Security ACL configuration specifying db roles tables' },
        { name: 'queue.php', type: 'file', description: 'Background job dispatchers' },
        { name: 'sanctum.php', type: 'file', description: 'Secure bearer token handlers preventing cross-site scripting' },
        { name: 'services.php', type: 'file', description: 'Registers credentials to link with third party platforms' },
        { name: 'session.php', type: 'file', description: 'Secure cookie session durations and browser save drivers' }
      ]
    },
    {
      name: 'database',
      type: 'dir',
      description: 'Structured tables migrations, active SQLite binary database, seed records',
      children: [
        { name: 'database.sqlite', type: 'file', description: 'Standalone direct SQLite binary storage db file' },
        {
          name: 'migrations',
          type: 'dir',
          children: [
            { name: '2026_06_16_000000_create_cms_tables.php', type: 'file', description: 'Executes physical DDL commands creating categories, blogs, and Spatie tables' }
          ]
        },
        {
          name: 'seeders',
          type: 'dir',
          children: [
            { name: 'DatabaseSeeder.php', type: 'file', description: 'Auto-generates Administrator, Editor roles, custom Spatie permissions and test records' }
          ]
        }
      ]
    },
    {
      name: 'resources',
      type: 'dir',
      description: 'Visual interfaces, pages templates, stylesheets and script items',
      children: [
        { name: 'css/app.css', type: 'file', description: 'Active stylesheet importing CDN styles' },
        { name: 'js/app.js', type: 'file', description: 'Vanilla core scripts loading dependencies' },
        {
          name: 'views',
          type: 'dir',
          children: [
            { name: 'welcome.blade.php', type: 'file', description: 'HTML template representing the control-panel CMS interface' },
            { name: 'layouts/app.blade.php', type: 'file', description: 'Master view shell carrying dynamic content blocks' }
          ]
        }
      ]
    },
    {
      name: 'routes',
      type: 'dir',
      description: 'Application address gateways',
      children: [
        { name: 'web.php', type: 'file', description: 'Maps URL targets to controllers through auth filters and Spatie guidelines' },
        { name: 'console.php', type: 'file', description: 'Cron and interactive CLI parameters description list' }
      ]
    }
  ];

  const dotnetTreeData: TreeNode[] = [
    {
      name: 'Dara.Domain',
      type: 'dir',
      description: 'Domain Layer (Enterprise Objects & Models)',
      children: [
        { name: 'Entities/BaseEntity.cs', type: 'file', description: 'Standard class tracking universal entry fields' },
        { name: 'Entities/BlogPost.cs', type: 'file', description: 'Entity representing CMS blog parameters' }
      ]
    },
    {
      name: 'Dara.Application',
      type: 'dir',
      description: 'Application Layer (CQRS and Interfaces)',
      children: [
        { name: 'Interfaces/IGenericRepository.cs', type: 'file', description: 'Asynchronous Db communication contract template' },
        { name: 'Features/BlogPosts/Commands/CreateBlogPost.cs', type: 'file', description: 'MediatR CQRS handler' }
      ]
    },
    {
      name: 'Dara.Infrastructure',
      type: 'dir',
      description: 'Infrastructure Layer (EF Core and external channels)',
      children: [
        { name: 'Persistence/ApplicationDbContext.cs', type: 'file', description: 'Handles C# model-to-table physical mappings' }
      ]
    },
    {
      name: 'Dara.ClientApi',
      type: 'dir',
      description: 'Client API Gateway (Controllers, Middlewares, Program.cs)',
      children: [
        { name: 'Controllers/BlogPostsController.cs', type: 'file', description: 'Exposes clean endpoints shielded by JWT auth tokens' },
        { name: 'Program.cs', type: 'file', description: 'Service collection registrar' }
      ]
    }
  ];

  const renderTree = (nodes: TreeNode[], pathPrefix = '') => {
    return (
      <div className="space-y-1 pl-2">
        {nodes.map(node => {
          const currentPath = `${pathPrefix}${node.name}`;
          const isDir = node.type === 'dir';
          const isExpanded = expandedNodes[currentPath];
          
          return (
            <div key={currentPath} className="text-xs">
              <div 
                className={`flex items-center gap-2 py-1 px-1.5 rounded transition-all select-none ${
                  isDir ? 'hover:bg-slate-800/80 cursor-pointer text-indigo-300 font-semibold' : 'text-slate-300 hover:bg-slate-900/60'
                }`}
                onClick={() => isDir && toggleNode(currentPath)}
              >
                {isDir ? (
                  <>
                    <span className="text-slate-500">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-indigo-400">
                      {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-3.5"></span>
                    <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </>
                )}
                
                <span className="font-mono text-xs text-slate-250 font-medium">
                  {node.name.split('/').pop()}
                </span>
                
                {node.description && (
                  <span className="text-[10px] text-slate-500 font-normal truncate hidden sm:inline-block border-l border-slate-800 pl-2 ml-auto select-all max-w-[240px]" title={node.description}>
                    {node.description}
                  </span>
                )}
              </div>

              {isDir && isExpanded && node.children && (
                <div className="border-l border-slate-800 ml-3.5 pl-1.5 mt-0.5 space-y-0.5">
                  {renderTree(node.children, `${currentPath}/`)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto h-full text-slate-100">
      <div className="border-b border-slate-800 pb-5 mb-6">
        <h3 className="font-bold text-lg text-white flex items-center gap-2 font-sans">
          <Download className="w-5 h-5 text-indigo-400" />
          {isDotnet ? 'Compile & Export DaraERP .NET Solution' : 'Compile & Export Laravel Project'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isDotnet 
            ? 'Save your visual parameters as a robust, fully-compliant 5-layer C# Clean Architecture ASP.NET active solution.'
            : 'Save your visual layout configurations as a pristine, standalone Laravel MVC folder structured package.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left container: Action triggers */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-805 rounded-xl p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isDotnet ? 'DaraERP Compliance Verification' : 'Production Ready MVC Checklist'}
            </h4>
            
            {isDotnet ? (
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked readOnly className="rounded border-slate-700 bg-slate-950 text-indigo-500 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-100 block">5-Layer Architectural Segregation</span>
                    <span className="text-slate-400">Dara.Domain, Dara.Application, Dara.Infrastructure, Dara.ClientApi, and Dara.ClientPortal are configured cleanly.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked readOnly className="rounded border-slate-700 bg-slate-950 text-indigo-500 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-100 block">Strict Auditable Entity Inheritance</span>
                    <span className="text-slate-400">All models correctly map: BaseEntity → AuditableBaseEntity → AuditableEntity (CompanyId tracking and Soft Delete fields).</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked readOnly className="rounded border-slate-700 bg-slate-950 text-indigo-500 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-100 block">MediatR CQRS Pipelines & UnitOfWork</span>
                    <span className="text-slate-400">Controllers invoke Mediator only. Database access routes strictly via standard IUnitOfWork and IGenericRepository.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked readOnly className="rounded border-slate-700 bg-slate-950 text-indigo-500 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-100 block">Bootstrap 5 CDN Integrations</span>
                    <span className="text-slate-400">Fully configured inside resources/views/layouts/app.blade.php with responsive scripts.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked readOnly className="rounded border-slate-700 bg-slate-950 text-indigo-500 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-100 block">Dynamic Eloquent models and seeders</span>
                    <span className="text-slate-400">App\Models\BlogPost and Product structured directories with database.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked readOnly className="rounded border-slate-700 bg-slate-950 text-indigo-500 mt-1" />
                  <div>
                    <span className="font-semibold text-slate-100 block">Routes definition file (web.php)</span>
                    <span className="text-slate-400">Fully mapped endpoints for all custom defined pages.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleZipDownload}
                disabled={zipping}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-805 disabled:opacity-50 text-white font-semibold rounded-xl py-3 px-6 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                {zipping ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Assembling zip file in browser...
                  </>
                ) : complete ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Success! Download started!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download complete `.ZIP` Package
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-900/50 p-5 rounded-xl space-y-2">
            <h5 className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-400" />
              {isDotnet ? 'C# Solution Architecture Specifications' : 'CMS Specifications'}
            </h5>
            <ul className="text-xs text-slate-300 space-y-1.5">
              {isDotnet ? (
                <>
                  <li>• System framework: <strong className="text-white">ASP.NET MVC Core (net8.0)</strong></li>
                  <li>• Software architectural design: <strong className="text-white">CQRS/MediatR Clean v5-Layer</strong></li>
                  <li>• Dynamic company tenant security: <strong className="text-white">Multi-tenant CompanyId query automatic filter</strong></li>
                  <li>• Persistence approach: <strong className="text-white">EF Core with unit-tested SQLite context</strong></li>
                </>
              ) : (
                <>
                  <li>• System layout standard: <strong className="text-white">Laravel Blade + Bootstrap 5</strong></li>
                  <li>• Directory export format: <strong className="text-white">Physical zip archive</strong></li>
                  <li>• Generated pages list: <strong className="text-white">{config.pages.map(p => p.slug).join(', ')}</strong></li>
                  <li>• Default DB Driver: <strong className="text-white">{config.dbDriver} (configured in app.php / .env)</strong></li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Right container: Dynamic Switcher for Tree View & Local CLI Walkthrough */}
        <div className="bg-slate-900 border border-slate-800 text-slate-300 p-6 rounded-2xl space-y-5 shadow-xl flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {rightTab === 'tree' ? (
                <Layers className="w-4.5 h-4.5 text-indigo-400" />
              ) : (
                <Terminal className="w-4.5 h-4.5 text-indigo-400" />
              )}
              <h4 className="text-sm font-bold text-slate-100">
                {rightTab === 'tree' ? 'Directory & Config Explorer' : 'CLI Setup Walkthrough'}
              </h4>
            </div>

            {/* Premium Tab Buttons */}
            <div className="flex p-0.5 bg-slate-950/80 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setRightTab('tree')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  rightTab === 'tree'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Structure Tree
              </button>
              <button
                type="button"
                onClick={() => setRightTab('cli')}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  rightTab === 'cli'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                CLI Guide
              </button>
            </div>
          </div>

          {rightTab === 'tree' ? (
            <div className="space-y-4 flex-1">
              <p className="text-xs text-slate-400 leading-relaxed">
                Check out the logical layout below. Your downloaded package will bundle every necessary configuration file for out-of-the-box local executions!
              </p>
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 max-h-[480px] overflow-y-auto select-none">
                {renderTree(isDotnet ? dotnetTreeData : laravelTreeData)}
              </div>

              {!isDotnet && (
                <div className="text-[10px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 space-y-1">
                  <span className="font-semibold text-slate-350 block flex items-center gap-1">
                    <Settings className="w-3 h-3 text-indigo-400" /> 
                    Frictionless Multi-Config Bundling
                  </span>
                  <p>
                    All required files (<code className="text-amber-500 font-mono text-[9px]">app.php</code>, <code className="text-amber-500 font-mono text-[9px]">auth.php</code>, <code className="text-amber-500 font-mono text-[9px]">permission.php</code>, etc.) are pre-configured to automatically bind Spatie authentication guards to the sqlite/mariadb target environment during database setup.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              <p className="text-xs text-slate-400 leading-relaxed">
                {isDotnet 
                  ? 'Follow these direct CLI commands to compile, run and test your generated DaraERP compliance solution:' 
                  : 'Follow these direct CLI commands to deploy and serve your generated Bootstrap / Laravel template locally:'}
              </p>

              {isDotnet ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-indigo-300 block mb-1">1. Extract and install dotnet modules</span>
                    <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono whitespace-pre overflow-x-auto text-slate-200 border border-slate-800/40">
{`unzip ${config.projectName || 'clean_architecture_project'}.zip -d ${config.projectName || 'clean_architecture_project'}
cd ${config.projectName || 'clean_architecture_project'}
dotnet restore`}
                    </pre>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-indigo-300 block mb-1">2. Run Web API services (Dara.ClientApi)</span>
                    <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono whitespace-pre overflow-x-auto text-slate-200 border border-slate-800/40">
{`cd Dara.ClientApi
dotnet run
# Runs on Port 5211 (Swagger Dashboard UI Active!)`}
                    </pre>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-indigo-300 block mb-1">3. Start Customer Portal (Dara.ClientPortal)</span>
                    <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono whitespace-pre overflow-x-auto text-slate-200 border border-slate-800/40">
{`cd ../Dara.ClientPortal
dotnet run
# Runs on Port 5000 / Web Customer Dashboard loaded!`}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-indigo-300 block mb-1">1. Install core dependencies</span>
                    <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono whitespace-pre overflow-x-auto text-slate-200 border border-slate-800/40">
{`unzip ${config.projectName}.zip -d ${config.projectName}
cd ${config.projectName}
# Bypasses local environment security advisory blockages
composer install --no-audit`}
                    </pre>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-indigo-300 block mb-1">2. Environment configuration setup</span>
                    <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono whitespace-pre overflow-x-auto text-slate-200 border border-slate-800/40">
{`cp .env.example .env
php artisan key:generate`}
                    </pre>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-indigo-300 block mb-1">3. Seed Database & run migrations</span>
                    <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono whitespace-pre overflow-x-auto text-slate-200 border border-slate-800/40">
{`# Creates standard tables for blogs and products
php artisan migrate --seed`}
                    </pre>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-indigo-300 block mb-1">4. Serve locally</span>
                    <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono whitespace-pre overflow-x-auto text-slate-200 border border-slate-800/40">
{`npm install
npm run dev &
php artisan serve`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
