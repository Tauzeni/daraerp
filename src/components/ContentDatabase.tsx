import React, { useState, useEffect } from 'react';
import { WebDesignConfig, DynamicBlogModel, DynamicProductModel, SpatieRole, SpatiePermission, CustomDbField, CustomDbModel } from '../types';
import { Plus, Trash2, Database, BookOpen, ShoppingBag, Calendar, User, Tag, HelpCircle, Package, Archive, Terminal, Server, CheckCircle2, Play, Save, RefreshCw, Shield, Key, Lock, Settings, Edit, Users, Check, Trash, Sparkles } from 'lucide-react';

interface ContentDatabaseProps {
  config: WebDesignConfig;
  onChangeConfig: (newConfig: WebDesignConfig) => void;
}

export default function ContentDatabase({ config, onChangeConfig }: ContentDatabaseProps) {
  const [activeTab, setActiveTab] = useState<'blogs' | 'products' | 'migrations' | 'spatie'>('blogs');

  // Database Connection settings state
  const [dbState, setDbState] = useState({
    dbDriver: config.dbDriver || 'sqlite',
    dbHost: config.dbHost || '127.0.0.1',
    dbPort: config.dbPort || (config.dbDriver === 'pgsql' ? '5432' : config.dbDriver === 'sqlite' ? '' : '3306'),
    dbDatabase: config.dbDatabase || config.projectName || 'laravel',
    dbUsername: config.dbUsername || 'root',
    dbPassword: config.dbPassword || '',
  });

  // Sync state if config changes
  useEffect(() => {
    setDbState({
      dbDriver: config.dbDriver || 'sqlite',
      dbHost: config.dbHost || '127.0.0.1',
      dbPort: config.dbPort || (config.dbDriver === 'pgsql' ? '5432' : config.dbDriver === 'sqlite' ? '' : '3306'),
      dbDatabase: config.dbDatabase || config.projectName || 'laravel',
      dbUsername: config.dbUsername || 'root',
      dbPassword: config.dbPassword || '',
    });
  }, [config.dbDriver, config.dbHost, config.dbPort, config.dbDatabase, config.dbUsername, config.dbPassword]);

  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [seedingLoading, setSeedingLoading] = useState<string | null>(null);
  
  // Visual Inspection States
  const [inspectTable, setInspectTable] = useState<string>('blog_posts');
  const [inspectView, setInspectView] = useState<'data' | 'structure'>('data');
  const [dbSearch, setDbSearch] = useState('');

  // Dynamic Schema Creator States
  const [newTableName, setNewTableName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newTableFields, setNewTableFields] = useState<CustomDbField[]>([
    { name: 'title', type: 'string', nullable: false },
    { name: 'description', type: 'text', nullable: true },
    { name: 'views_count', type: 'integer', nullable: true }
  ]);

  const handleSeedCustomTable = async (tableName: string) => {
    const matchedCustomModel = (config.customDbModels || []).find(m => m.tableName === tableName);
    if (!matchedCustomModel) return;

    setSeedingLoading(tableName);
    try {
      const response = await fetch('/api/ai/generate-seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: matchedCustomModel.tableName,
          modelName: matchedCustomModel.modelName,
          fields: matchedCustomModel.fields
        })
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.records)) {
        const updatedModels = (config.customDbModels || []).map(m => {
          if (m.tableName === tableName) {
            // Keep unique records
            const merged = [...data.records, ...(m.records || [])];
            // Remove duplicates by ID just in case
            const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
            return {
              ...m,
              records: unique
            };
          }
          return m;
        });
        onChangeConfig({
          ...config,
          customDbModels: updatedModels
        });
      } else {
        alert(data.error || 'Failed to synthesize seed records.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to Gemini Database Seeder Agent.');
    } finally {
      setSeedingLoading(null);
    }
  };

  const handleSubmitCustomSchema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim() || !newModelName.trim()) {
      alert('Please specify both a physical Table Name and Eloquent Model Name.');
      return;
    }

    const tName = newTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const mName = newModelName.trim().replace(/[^a-zA-Z0-9]/g, '');

    if (!tName || !mName) {
      alert('Table Name and Model Name contain invalid characters.');
      return;
    }

    // Check for duplicate tables
    const isDuplicate = ['blog_posts', 'products', ...((config.customDbModels || []).map(m => m.tableName))].includes(tName);
    if (isDuplicate) {
      alert(`The table name "${tName}" already exists in the system schema.`);
      return;
    }

    // Prepare fields
    const validFields = newTableFields.map(f => ({
      name: f.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      type: f.type,
      nullable: !!f.nullable
    })).filter(f => f.name !== '');

    if (validFields.length === 0) {
      alert('Please define at least one valid database field column.');
      return;
    }

    const newModelId = `model-custom-${Math.floor(Math.random() * 100000)}`;
    const newCustomModel: CustomDbModel = {
      id: newModelId,
      tableName: tName,
      modelName: mName,
      fields: validFields,
      records: []
    };

    const updatedCustomDbModels = [...(config.customDbModels || []), newCustomModel];
    onChangeConfig({
      ...config,
      customDbModels: updatedCustomDbModels
    });

    // Reset input fields
    setNewTableName('');
    setNewModelName('');
    setNewTableFields([
      { name: 'title', type: 'string', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'views_count', type: 'integer', nullable: true }
    ]);

    // Automatically inspect the newly created custom table
    setInspectTable(tName);
    setInspectView('data');

    alert(`Successfully generated database entity App\\Models\\${mName} mapping to table "${tName}"!`);
  };

  const handleDropCustomTable = (modelId: string, modelName: string, tableName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to drop the custom table "${tableName}" and its Eloquent model App\\Models\\${modelName}? All stored records will be permanently deleted.`)) {
      return;
    }
    const filtered = (config.customDbModels || []).filter(m => m.id !== modelId);
    onChangeConfig({
      ...config,
      customDbModels: filtered
    });
    // If the dropped table was currently selected, reset inspectTable to defaults
    if (inspectTable === tableName) {
      setInspectTable('blog_posts');
    }
    alert(`Custom table schema "${tableName}" has been dropped.`);
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeConfig({
      ...config,
      dbDriver: dbState.dbDriver as 'mysql' | 'sqlite' | 'pgsql',
      dbHost: dbState.dbHost,
      dbPort: dbState.dbPort,
      dbDatabase: dbState.dbDatabase,
      dbUsername: dbState.dbUsername,
      dbPassword: dbState.dbPassword,
    });
    alert('Database connection successfully updated and mapped across Laravel config file models!');
  };

  const handleRunMigrations = () => {
    setMigrationStatus('running');
    setTerminalLogs([]);
    const logs = [
      `$ php artisan migrate:fresh --seed`,
      `Connecting to database server using connection [${dbState.dbDriver}]...`,
      `✓ Connection established successfully to [${dbState.dbDriver}://${dbState.dbHost}${dbState.dbPort ? ':' + dbState.dbPort : ''}/${dbState.dbDatabase}]`,
      `INFO  Dropping all standard tables on database default schema ... Done!`,
      `INFO  Preparing physical migrations mapping.`,
      `  • database/migrations/2026_06_16_000000_create_cms_tables.php`,
      `INFO  Running database migrations.`,
      `  ✓ 2026_06_16_000000_create_cms_tables ................. 18.25ms DONE`,
      `INFO  Sourcing and executing dynamic seed.`,
      `  • database/seeders/DatabaseSeeder.php`,
      `INFO  Seeding database records from custom model datasets.`,
      `  ✓ Seeding App\\Models\\BlogPost records (${config.blogModels.length} rows) ... DONE`,
      `  ✓ Seeding App\\Models\\Product records (${config.productModels.length} rows) ... DONE`,
      `  ✓ Database\\Seeders\\DatabaseSeeder .................... 11.40ms DONE`,
      ``,
      `SUCCESS: Migrations executed! All database endpoints successfully compiled.`,
      `⚡ Ready for query handling inside Eloquent App\\Models classes!`
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < logs.length) {
        setTerminalLogs(prev => [...prev, logs[current]]);
        current++;
      } else {
        clearInterval(interval);
        setMigrationStatus('success');
      }
    }, 400);
  };

  // New item draft templates
  const [newBlog, setNewBlog] = useState<Partial<DynamicBlogModel>>({
    title: '',
    category: 'Innovation',
    excerpt: '',
    body: '',
    author: 'Admin Team',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80'
  });

  const [newProduct, setNewProduct] = useState<Partial<DynamicProductModel>>({
    name: '',
    price: '29.99',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=600&q=80',
    inStock: true
  });

  // Spatie Roles & Permissions States
  const [selectedRoleId, setSelectedRoleId] = useState<string>('r1');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newPermName, setNewPermName] = useState('');
  const [newPermModule, setNewPermModule] = useState('blog_posts');
  const [newPermAction, setNewPermAction] = useState<'create' | 'read' | 'update' | 'delete' | 'manage'>('read');
  const [newPermDesc, setNewPermDesc] = useState('');

  // Sourcing current list with safeguards in case they are undefined on the first load
  const currentRoles: SpatieRole[] = config.spatieRoles || [
    { id: 'r1', name: 'Administrator', description: 'System Administrator with full access rights', permissions: ['blog_posts.create', 'blog_posts.read', 'blog_posts.update', 'blog_posts.delete', 'products.create', 'products.read', 'products.update', 'products.delete', 'pages.create', 'pages.read', 'pages.update', 'pages.delete'] },
    { id: 'r2', name: 'Editor', description: 'Content Editor who can manage blogs and products, but cannot delete or modify structural pages', permissions: ['blog_posts.create', 'blog_posts.read', 'blog_posts.update', 'products.create', 'products.read', 'products.update', 'pages.read'] },
    { id: 'r3', name: 'User', description: 'Regular User with basic read-only rights to browse posts and products', permissions: ['blog_posts.read', 'products.read'] }
  ];

  const currentPermissions: SpatiePermission[] = config.spatiePermissions || [
    { id: 'p1', name: 'blog_posts.create', module: 'blog_posts', action: 'create', description: 'Create blog posts' },
    { id: 'p2', name: 'blog_posts.read', module: 'blog_posts', action: 'read', description: 'View blog posts' },
    { id: 'p3', name: 'blog_posts.update', module: 'blog_posts', action: 'update', description: 'Update blog posts' },
    { id: 'p4', name: 'blog_posts.delete', module: 'blog_posts', action: 'delete', description: 'Delete blog posts' },
    { id: 'p5', name: 'products.create', module: 'products', action: 'create', description: 'Add new products' },
    { id: 'p6', name: 'products.read', module: 'products', action: 'read', description: 'Browse products catalog' },
    { id: 'p7', name: 'products.update', module: 'products', action: 'update', description: 'Edit existing products' },
    { id: 'p8', name: 'products.delete', module: 'products', action: 'delete', description: 'Remove products' },
    { id: 'p9', name: 'pages.create', module: 'pages', action: 'create', description: 'Create web pages' },
    { id: 'p10', name: 'pages.read', module: 'pages', action: 'read', description: 'Access web pages panel' },
    { id: 'p11', name: 'pages.update', module: 'pages', action: 'update', description: 'Modify web page structures' },
    { id: 'p12', name: 'pages.delete', module: 'pages', action: 'delete', description: 'Delete custom pages' }
  ];

  const handleUpdateRolesAndPermissions = (newRoles: SpatieRole[], newPerms: SpatiePermission[]) => {
    onChangeConfig({
      ...config,
      spatieRoles: newRoles,
      spatiePermissions: newPerms
    });
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const cleanName = newRoleName.trim();
    if (currentRoles.some(r => r.name.toLowerCase() === cleanName.toLowerCase())) {
      alert(`The role [${cleanName}] already exists in this configuration.`);
      return;
    }
    const createdRole: SpatieRole = {
      id: `role-${Math.random()}`,
      name: cleanName,
      description: newRoleDesc.trim() || 'Custom Spatie ACL user role.',
      permissions: []
    };
    const updatedRoles = [...currentRoles, createdRole];
    handleUpdateRolesAndPermissions(updatedRoles, currentPermissions);
    setSelectedRoleId(createdRole.id);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  const handleDeleteCustomRole = (id: string, name: string) => {
    if (name === 'Administrator') {
      alert('Cannot delete the root [Administrator] role as it protects core platform security rules.');
      return;
    }
    const updatedRoles = currentRoles.filter(r => r.id !== id);
    handleUpdateRolesAndPermissions(updatedRoles, currentPermissions);
    if (selectedRoleId === id) {
      setSelectedRoleId(currentRoles[0]?.id || '');
    }
  };

  const handleTogglePermission = (roleId: string, permName: string) => {
    const updatedRoles = currentRoles.map(role => {
      if (role.id !== roleId) return role;
      const alreadyHas = role.permissions.includes(permName);
      const newPermList = alreadyHas 
        ? role.permissions.filter(p => p !== permName)
        : [...role.permissions, permName];
      return { ...role, permissions: newPermList };
    });
    handleUpdateRolesAndPermissions(updatedRoles, currentPermissions);
  };

  const handleToggleSelectAllModule = (roleId: string, moduleKey: string) => {
    const modulePerms = currentPermissions.filter(p => p.module === moduleKey).map(p => p.name);
    const updatedRoles = currentRoles.map(role => {
      if (role.id !== roleId) return role;
      const hasAll = modulePerms.every(pName => role.permissions.includes(pName));
      let newPermList: string[];
      if (hasAll) {
        newPermList = role.permissions.filter(pName => !modulePerms.includes(pName));
      } else {
        newPermList = Array.from(new Set([...role.permissions, ...modulePerms]));
      }
      return { ...role, permissions: newPermList };
    });
    handleUpdateRolesAndPermissions(updatedRoles, currentPermissions);
  };

  const handleAddCustomPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermName.trim()) return;
    const cleanPart = newPermName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const computedName = `${newPermModule}.${cleanPart}`;
    
    if (currentPermissions.some(p => p.name.toLowerCase() === computedName.toLowerCase())) {
      alert(`The permission [${computedName}] already exists.`);
      return;
    }

    const createdPerm: SpatiePermission = {
      id: `perm-${Math.random()}`,
      name: computedName,
      module: newPermModule,
      action: newPermAction,
      description: newPermDesc.trim() || `Custom permission in module ${newPermModule}`
    };

    const updatedPerms = [...currentPermissions, createdPerm];
    handleUpdateRolesAndPermissions(currentRoles, updatedPerms);
    setNewPermName('');
    setNewPermDesc('');
  };

  const handleDeleteCustomPermission = (id: string, name: string) => {
    const updatedPerms = currentPermissions.filter(p => p.id !== id);
    // Remove from all roles as well
    const updatedRoles = currentRoles.map(r => ({
      ...r,
      permissions: r.permissions.filter(pName => pName !== name)
    }));
    handleUpdateRolesAndPermissions(updatedRoles, updatedPerms);
  };

  // Blog Actions
  const handleAddBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlog.title) return;
    const slug = newBlog.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const createdItem: DynamicBlogModel = {
      id: `blog-item-${Math.random()}`,
      title: newBlog.title,
      slug,
      excerpt: newBlog.excerpt || 'Short preview description.',
      body: newBlog.body || 'Complete body details.',
      category: newBlog.category || 'General',
      author: newBlog.author || 'Writer',
      imageUrl: newBlog.imageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date().toISOString().split('T')[0]
    };

    onChangeConfig({
      ...config,
      blogModels: [createdItem, ...config.blogModels]
    });

    setNewBlog({
      title: '',
      category: 'Innovation',
      excerpt: '',
      body: '',
      author: 'Admin Team',
      imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80'
    });
  };

  const handleDeleteBlog = (id: string) => {
    const filtered = config.blogModels.filter(b => b.id !== id);
    onChangeConfig({
      ...config,
      blogModels: filtered
    });
  };

  // Product Actions
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;
    const slug = newProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const createdItem: DynamicProductModel = {
      id: `product-item-${Math.random()}`,
      name: newProduct.name,
      slug,
      price: newProduct.price || '9.99',
      description: newProduct.description || 'Custom digital product.',
      imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=600&q=80',
      inStock: newProduct.inStock ?? true
    };

    onChangeConfig({
      ...config,
      productModels: [createdItem, ...config.productModels]
    });

    setNewProduct({
      name: '',
      price: '29.99',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=600&q=80',
      inStock: true
    });
  };

  const handleDeleteProduct = (id: string) => {
    const filtered = config.productModels.filter(p => p.id !== id);
    onChangeConfig({
      ...config,
      productModels: filtered
    });
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto h-full">
      {/* Tab bar header */}
      <div className="border-b border-slate-200 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Dynamic CMS Table Models
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Build and seed mock records that dynamic-loop through Laravel's Blade views automatically.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('blogs')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'blogs'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            App\Models\BlogPost ({config.blogModels.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            App\Models\Product ({config.productModels.length})
          </button>
          <button
            onClick={() => setActiveTab('migrations')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'migrations'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-orange-500" />
            Connections & Migrations
          </button>
          <button
            onClick={() => setActiveTab('spatie')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'spatie'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Spatie Roles & Permissions
          </button>
        </div>
      </div>

      {activeTab === 'blogs' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 align-start">
          {/* Create Blog Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-455 mb-4 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              Seed New Blog Post
            </h4>
            <form onSubmit={handleAddBlog} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Article Headline</label>
                <input
                  type="text"
                  required
                  value={newBlog.title}
                  onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400"
                  placeholder="e.g. Mastering MVC architecture"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category tag</label>
                  <input
                    type="text"
                    value={newBlog.category}
                    onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={newBlog.author}
                    onChange={(e) => setNewBlog({ ...newBlog, author: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Hero Backdrop Image Url</label>
                <input
                  type="text"
                  value={newBlog.imageUrl}
                  onChange={(e) => setNewBlog({ ...newBlog, imageUrl: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Short Excerpt (Grid Card Preview)</label>
                <textarea
                  rows={2}
                  required
                  value={newBlog.excerpt}
                  onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white"
                  placeholder="Insert a short catchy preview description..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Complete Body Article content</label>
                <textarea
                  rows={4}
                  value={newBlog.body}
                  onChange={(e) => setNewBlog({ ...newBlog, body: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white"
                  placeholder="Markdown or HTML body content..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-indigo-650 active:bg-indigo-700 text-white rounded-lg py-2.5 text-xs font-semibold transition-colors mt-2"
              >
                Insert Row & Seed database
              </button>
            </form>
          </div>

          {/* Seeded list display */}
          <div className="xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-455 flex items-center gap-1 px-1">
              <Archive className="w-4 h-4 text-slate-500" />
              Dynamic BlogPost Seeds (mapped to blog controller query)
            </h4>

            {config.blogModels.length === 0 ? (
              <div className="p-8 text-center bg-white border rounded-xl text-slate-400 text-sm">
                No blog records currently seeded. Click left to insert items!
              </div>
            ) : (
              <div className="space-y-3.5">
                {config.blogModels.map(blog => (
                  <div key={blog.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-4 relative">
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="absolute top-4 right-4 text-rose-500 hover:text-rose-700 transition"
                      title="Delete database row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <img
                      src={blog.imageUrl}
                      className="w-20 h-20 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                      alt={blog.title}
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {blog.category}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <User className="w-3 h-3" /> {blog.author}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" /> {blog.createdAt}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-800 text-sm truncate">{blog.title}</h5>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{blog.excerpt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'products' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 align-start">
          {/* Create Product Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-455 mb-4 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              Seed New Product Model
            </h4>
            <form onSubmit={handleAddProduct} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Product Display Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400"
                  placeholder="e.g. Ultimate Dev Guide"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Price ($USD decimal)</label>
                  <input
                    type="text"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Stock status</label>
                  <select
                    value={newProduct.inStock ? 'true' : 'false'}
                    onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.value === 'true' })}
                    className="w-full text-xs bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-700"
                  >
                    <option value="true">In Stock</option>
                    <option value="false">Out of stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Thumbnail Preview Image</label>
                <input
                  type="text"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-505 mb-1">Commercial Description details</label>
                <textarea
                  rows={3}
                  required
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white"
                  placeholder="Provide package specifications..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-indigo-650 active:bg-indigo-700 text-white rounded-lg py-2.5 text-xs font-semibold cursor-pointer"
              >
                Insert Product seed row
              </button>
            </form>
          </div>

          {/* Seeded products rendering list */}
          <div className="xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-455 flex items-center gap-1 px-1">
              <Package className="w-4 h-4 text-slate-500" />
              Dynamic Product Seeds (binds to products model queries)
            </h4>

            {config.productModels.length === 0 ? (
              <div className="p-8 text-center bg-white border rounded-xl text-slate-400 text-sm">
                No product records currently seeded. Click left to insert items!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.productModels.map(prod => (
                  <div key={prod.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between relative">
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete product row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex gap-3">
                      <img
                        src={prod.imageUrl}
                        className="w-16 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0 border border-slate-200"
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1 pr-6">
                        <h5 className="font-bold text-slate-800 text-sm truncate mb-0.5">{prod.name}</h5>
                        <div className="text-xs font-mono font-bold text-indigo-600 mb-2">${prod.price}</div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{prod.description}</p>
                      </div>
                    </div>

                    <div className="border-t mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>slug: {prod.slug}</span>
                      <span className={`font-semibold ${prod.inStock ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {prod.inStock ? '● Active In Stock' : '● Sold Out'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'migrations' ? (
        <div className="space-y-8">
          {/* Top Panel: Credentials Configuration & Visual Migrations Console */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 align-start animate-fade-in">
            {/* Card 1: Connection configurations */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Server className="w-5 h-5 text-indigo-650" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Database Settings & Credentials</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Configure parameters for your compiled .env file</p>
                </div>
              </div>

              <form onSubmit={handleSaveConnection} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Database Connection Driver (DB_CONNECTION)</label>
                  <select
                    value={dbState.dbDriver}
                    onChange={(e) => {
                      const drv = e.target.value;
                      let prt = '3306';
                      if (drv === 'pgsql') prt = '5432';
                      else if (drv === 'sqlite') prt = '';
                      setDbState({ ...dbState, dbDriver: drv, dbPort: prt });
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-750 font-medium cursor-pointer"
                  >
                    <option value="sqlite">SQLite (.sqlite database file)</option>
                    <option value="mysql">MySQL Engine</option>
                    <option value="pgsql">PostgreSQL Engine</option>
                  </select>
                </div>

                {dbState.dbDriver !== 'sqlite' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-505 mb-1">Database Host (DB_HOST)</label>
                      <input
                        type="text"
                        required
                        value={dbState.dbHost}
                        onChange={(e) => setDbState({ ...dbState, dbHost: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-505 mb-1">Database Port (DB_PORT)</label>
                      <input
                        type="text"
                        required
                        value={dbState.dbPort}
                        onChange={(e) => setDbState({ ...dbState, dbPort: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-505 mb-1">
                    {dbState.dbDriver === 'sqlite' ? 'SQLite Database File Path (DB_DATABASE)' : 'Database Name (DB_DATABASE)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={dbState.dbDatabase}
                    onChange={(e) => setDbState({ ...dbState, dbDatabase: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none font-mono"
                  />
                </div>

                {dbState.dbDriver !== 'sqlite' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-505 mb-1">Database Username (DB_USERNAME)</label>
                      <input
                        type="text"
                        required
                        value={dbState.dbUsername}
                        onChange={(e) => setDbState({ ...dbState, dbUsername: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-505 mb-1">Database Password (DB_PASSWORD)</label>
                      <input
                        type="password"
                        value={dbState.dbPassword}
                        onChange={(e) => setDbState({ ...dbState, dbPassword: e.target.value })}
                        className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none font-mono"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Apply Database Config inside .env
                </button>
              </form>
            </div>

            {/* Card 2: Interactive migrations simulator console */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between text-slate-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Visual Migrations Console</h4>
                      <p className="text-[11px] text-slate-400">Initialize and seed the configured schemas</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunMigrations}
                    disabled={migrationStatus === 'running'}
                    className="bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 active:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {migrationStatus === 'running' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current text-white" />
                        Run Migrations & Seed
                      </>
                    )}
                  </button>
                </div>

                {/* Terminal Screen */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl h-64 p-4 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1 block align-top">
                  {terminalLogs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-indigo-500/25" />
                      <p>Click "Run Migrations & Seed" to test database schema mapping</p>
                      <p className="text-[10px] text-slate-650 font-medium">Maps physical tables directly onto your simulated [ {dbState.dbDriver} ] schemas</p>
                    </div>
                  )}
                  {terminalLogs.map((log, idx) => {
                    let textClass = 'text-slate-300';
                    if (log.startsWith('$')) textClass = 'text-indigo-400 font-semibold';
                    else if (log.startsWith('✓') || log.startsWith('SUCCESS')) textClass = 'text-emerald-400 font-semibold';
                    else if (log.startsWith('INFO')) textClass = 'text-blue-400';
                    else if (log.startsWith('CRITICAL')) textClass = 'text-amber-400';
                    else if (log.startsWith('⚡')) textClass = 'text-orange-400 font-semibold';
                    
                    return (
                      <div key={idx} className={`${textClass} leading-relaxed break-all`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Local dev terminal copy helper */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Local Setup Production Commands</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  To migrate and seed this dynamic Bootstrap CMS content on your local system, run these commands inside the root directory:
                </p>
                <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-200 font-mono whitespace-pre overflow-x-auto text-left">
{`# 1. Config environment details inside .env
# 2. Run schema execution and seed simulated rows
php artisan migrate --seed`}
                </pre>
              </div>
            </div>
          </div>

          {/* Card 3: Interactive Database Schema & Table Inspector Grid */}
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-md text-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-5 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    Interactive Database Table Inspector
                    <span className="text-[11px] font-mono font-medium text-slate-400">({dbState.dbDatabase})</span>
                  </h4>
                  <p className="text-xs text-slate-400">Browse actual seeded tables and inspect standard DB structural columns</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-semibold">Status:</span>
                {migrationStatus === 'success' ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/35 px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ACTIVE & SEEDED
                  </span>
                ) : migrationStatus === 'running' ? (
                  <span className="bg-indigo-500/10 text-indigo-450 border border-indigo-500/35 px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-spin"></span>
                    MIGRATING TABLES...
                  </span>
                ) : (
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/35 px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    MIGRATION PENDING
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tables sidebar */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Tables ({2 + (config.customDbModels?.length || 0)})
                  </span>
                  <button
                    onClick={() => { setInspectTable('blog_posts'); }}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between border transition-all cursor-pointer ${
                      inspectTable === 'blog_posts'
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300 font-bold'
                        : 'bg-slate-950/50 border-slate-800/60 text-slate-400 hover:bg-slate-950/80 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs truncate">
                      <Archive className="w-4.5 h-4.5 flex-shrink-0" />
                      <span className="truncate">blog_posts</span>
                    </div>
                    <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded-md ${
                      inspectTable === 'blog_posts' ? 'bg-indigo-550/20 text-indigo-400' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {config.blogModels.length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setInspectTable('products'); }}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between border transition-all cursor-pointer ${
                      inspectTable === 'products'
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300 font-bold'
                        : 'bg-slate-950/50 border-slate-800/60 text-slate-400 hover:bg-slate-950/80 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs truncate">
                      <Package className="w-4.5 h-4.5 flex-shrink-0" />
                      <span className="truncate">products</span>
                    </div>
                    <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded-md ${
                      inspectTable === 'products' ? 'bg-indigo-550/20 text-indigo-400' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {config.productModels.length}
                    </span>
                  </button>

                  {/* Render custom user/AI model databases */}
                  {(config.customDbModels || []).map(model => (
                    <div
                      key={model.id}
                      className={`group w-full p-2.5 rounded-lg flex items-center justify-between border transition-all ${
                        inspectTable === model.tableName
                          ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300'
                          : 'bg-slate-950/50 border-slate-800/60 text-slate-400 hover:bg-slate-950/80 hover:text-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => { setInspectTable(model.tableName); }}
                        className="flex-1 text-left flex items-center gap-2 text-xs truncate cursor-pointer font-medium"
                      >
                        <Database className={`w-4 h-4 flex-shrink-0 ${inspectTable === model.tableName ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-bold text-slate-200">{model.tableName}</span>
                          <span className="text-[9.5px] text-slate-550 font-mono">App\Models\{model.modelName}</span>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 pl-1 shrink-0">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          inspectTable === model.tableName ? 'bg-indigo-550/25 text-indigo-400' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {model.records?.length || 0}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDropCustomTable(model.id, model.modelName, model.tableName);
                          }}
                          title="Drop custom table schema"
                          className="text-slate-500 hover:text-rose-450 p-1 rounded-md hover:bg-rose-500/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => { setInspectTable('_new_custom_table_'); }}
                    className={`w-full p-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-dashed transition-all cursor-pointer text-xs font-bold leading-none ${
                      inspectTable === '_new_custom_table_'
                        ? 'bg-emerald-600/15 border-emerald-500/50 text-emerald-300'
                        : 'border-slate-800 text-slate-400 bg-slate-950/20 hover:border-slate-705 hover:text-slate-200 hover:bg-slate-950/50'
                    }`}
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Create Custom Table
                  </button>

                  <div className="pt-4 border-t border-slate-800 space-y-1 text-slate-500 text-[11px]">
                    <div className="flex justify-between">
                      <span>Server Engine:</span>
                      <span className="text-slate-300 capitalize font-mono">{dbState.dbDriver}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database:</span>
                      <span className="text-slate-300 font-mono truncate max-w-[100px]" title={dbState.dbDatabase}>
                        {dbState.dbDatabase}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Data and Column structure frame */}
                <div className="lg:col-span-3 space-y-4">
                  {inspectTable !== '_new_custom_table_' && migrationStatus !== 'success' && migrationStatus !== 'running' ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80 p-6 min-h-[350px]">
                      <Database className="w-10 h-10 text-slate-600 animate-pulse" />
                      <div className="max-w-md">
                        <h5 className="font-bold text-white text-sm">Table Data is Pending Migration</h5>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          This schema table ({inspectTable}) is defined in your blueprint. To view, query, or seed database rows, click <span className="text-indigo-400 font-semibold">"Run Migrations & Seed"</span> in the console above to execute SQL blueprints and activate details!
                        </p>
                      </div>
                    </div>
                  ) : inspectTable === '_new_custom_table_' ? (
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                            <Database className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h5 className="font-bold text-white text-base">Eloquent Table Schema Architect</h5>
                            <p className="text-xs text-slate-400">Manually design tables and Laravel Eloquent database models visually</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectTable('blog_posts')}
                          className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-3 py-1.5 border border-slate-800 rounded-lg hover:bg-slate-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleSubmitCustomSchema} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Physical SQL Table Name (snake_case)
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g., job_tickets"
                              value={newTableName}
                              onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                                setNewTableName(val);
                                // Auto guess CamelCase Model if empty or matches previous tableName pattern
                                const camel = val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
                                setNewModelName(camel);
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-semibold font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Eloquent Model Class (StudlyCase)
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g., JobTicket"
                              value={newModelName}
                              onChange={(e) => setNewModelName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 outline-none focus:border-emerald-500 font-semibold font-mono"
                            />
                          </div>
                        </div>

                        <div className="border border-slate-800 rounded-lg bg-slate-900/30 overflow-hidden">
                          <div className="bg-slate-900 p-3 flex items-center justify-between border-b border-slate-850">
                            <span className="text-[11px] font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                              Model Field Columns Schema
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setNewTableFields(prev => [...prev, { name: '', type: 'string', nullable: true }]);
                              }}
                              className="bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs px-2.5 py-1.5 flex items-center gap-1 font-bold cursor-pointer transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add New Column
                            </button>
                          </div>

                          <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto">
                            {/* Static system Id field informational helper */}
                            <div className="grid grid-cols-12 gap-3 items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                              <div className="col-span-5">
                                <span className="text-xs font-mono font-bold text-slate-500">id (Primary Key)</span>
                              </div>
                              <div className="col-span-4">
                                <span className="text-[10px] font-semibold text-emerald-405 bg-emerald-500/10 border border-emerald-505/20 px-2 py-0.5 rounded-full font-mono uppercase">BIGINT AUTO-INCREMENT</span>
                              </div>
                              <div className="col-span-3 text-center">
                                <span className="text-[9.5px] text-slate-500 uppercase tracking-wider font-bold font-mono">System Primary</span>
                              </div>
                            </div>

                            {newTableFields.map((field, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-950/30 p-2 rounded-lg border border-slate-800 flex-wrap">
                                <div className="col-span-4">
                                  <input
                                    type="text"
                                    required
                                    placeholder="column_name_snake"
                                    value={field.name}
                                    onChange={(e) => {
                                      const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                                      setNewTableFields(prev => {
                                        const copy = [...prev];
                                        copy[idx].name = cleaned;
                                        return copy;
                                      });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-white outline-none font-mono"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <select
                                    value={field.type}
                                    onChange={(e) => {
                                      setNewTableFields(prev => {
                                        const copy = [...prev];
                                        copy[idx].type = e.target.value as any;
                                        return copy;
                                      });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-300 outline-none"
                                  >
                                    <option value="string">string (VARCHAR 255)</option>
                                    <option value="text">text (TEXT longer content)</option>
                                    <option value="integer">integer (BigInt / count)</option>
                                    <option value="decimal">decimal (10, 2 / price)</option>
                                    <option value="boolean">boolean (TINYINT default)</option>
                                  </select>
                                </div>
                                <div className="col-span-3 flex items-center justify-center gap-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400">
                                    <input
                                      type="checkbox"
                                      checked={field.nullable}
                                      onChange={(e) => {
                                        setNewTableFields(prev => {
                                          const copy = [...prev];
                                          copy[idx].nullable = e.target.checked;
                                          return copy;
                                        });
                                      }}
                                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                                    />
                                    Nullable
                                  </label>
                                </div>
                                <div className="col-span-1 text-right">
                                  <button
                                    type="button"
                                    disabled={newTableFields.length <= 1}
                                    onClick={() => {
                                      setNewTableFields(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                    className="text-slate-500 hover:text-rose-450 p-1.5 rounded-lg hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setInspectTable('blog_posts')}
                            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 px-4 py-2 rounded-lg text-xs font-bold font-sans cursor-pointer"
                          >
                            Discard
                          </button>
                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-550 border border-emerald-500/45 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                          >
                            <Save className="w-4 h-4" />
                            Build Dynamic Model Blueprint
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <>
                      {/* Tabs: data vs structure */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/60 font-medium">
                      <button
                        onClick={() => setInspectView('data')}
                        className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                          inspectView === 'data'
                            ? 'bg-indigo-600/20 border border-indigo-500/25 text-indigo-300'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Browse Table Data ({
                          inspectTable === 'blog_posts' 
                            ? config.blogModels.length 
                            : inspectTable === 'products' 
                            ? config.productModels.length 
                            : (config.customDbModels || []).find(m => m.tableName === inspectTable)?.records?.length || 0
                        } rows)
                      </button>
                      <button
                        onClick={() => setInspectView('structure')}
                        className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                          inspectView === 'structure'
                            ? 'bg-indigo-600/20 border border-indigo-500/25 text-indigo-300'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Table Schema Definition
                      </button>
                    </div>

                    {inspectView === 'data' && (
                      <div className="flex items-center gap-2">
                        {/* Seeder shortcut for custom models */}
                        {!(inspectTable === 'blog_posts' || inspectTable === 'products') && (
                          <button
                            onClick={() => handleSeedCustomTable(inspectTable)}
                            disabled={seedingLoading === inspectTable}
                            className="bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs px-2.5 py-1.5 flex items-center gap-1 cursor-pointer disabled:opacity-50 font-semibold transition-all"
                          >
                            {seedingLoading === inspectTable ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Seeding...
                              </>
                            ) : (
                              <>
                                <Database className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                Seed with AI
                              </>
                            )}
                          </button>
                        )}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search database rows..."
                            value={dbSearch}
                            onChange={(e) => setDbSearch(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg text-xs py-1 px-2.5 outline-none text-slate-200 placeholder-slate-600 w-48 font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Browser viewport */}
                  {inspectView === 'data' ? (
                    <div>
                      {(() => {
                        const matchedCustomModel = (config.customDbModels || []).find(m => m.tableName === inspectTable);
                        if (matchedCustomModel) {
                          return (
                            <div className="overflow-x-auto border border-slate-850 rounded-lg">
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-850">
                                  <tr>
                                    <th className="p-3">id</th>
                                    {matchedCustomModel.fields.map(f => (
                                      <th key={f.name} className="p-3">{f.name}</th>
                                    ))}
                                    <th className="p-3">created_at</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850 bg-slate-900/40">
                                  {matchedCustomModel.records.filter(r => {
                                    if (!dbSearch) return true;
                                    return Object.values(r).some(val => 
                                      String(val).toLowerCase().includes(dbSearch.toLowerCase())
                                    );
                                  }).map((rec) => (
                                    <tr key={rec.id} className="hover:bg-slate-950/20 text-slate-300">
                                      <td className="p-3 font-mono font-bold text-slate-500">{rec.id}</td>
                                      {matchedCustomModel.fields.map(f => (
                                        <td key={f.name} className="p-3 text-white">
                                          {rec[f.name] !== undefined ? String(rec[f.name]) : 'NULL'}
                                        </td>
                                      ))}
                                      <td className="p-3 font-mono text-slate-500">{rec.created_at ? new Date(rec.created_at).toLocaleString() : 'Just Now'}</td>
                                    </tr>
                                  ))}
                                  {matchedCustomModel.records.filter(r => {
                                    if (!dbSearch) return true;
                                    return Object.values(r).some(val => 
                                      String(val).toLowerCase().includes(dbSearch.toLowerCase())
                                    );
                                  }).length === 0 && (
                                    <tr>
                                      <td colSpan={matchedCustomModel.fields.length + 2} className="p-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center space-y-3 py-4">
                                          <Database className="w-8 h-8 text-slate-600 animate-pulse" />
                                          <div className="text-xs font-semibold text-slate-400">No database rows found.</div>
                                          <p className="text-[10.5px] text-slate-500 max-w-sm leading-relaxed">
                                            Fill form entries inside the interactive visual design preview to insert records, or let Gemini AI instantly seed realistic content into this custom table.
                                          </p>
                                          <button
                                            onClick={() => handleSeedCustomTable(matchedCustomModel.tableName)}
                                            disabled={seedingLoading === matchedCustomModel.tableName}
                                            className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                                          >
                                            {seedingLoading === matchedCustomModel.tableName ? (
                                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <>
                                                <Database className="w-3.5 h-3.5 text-indigo-200" />
                                                Seed 5 Sample Rows with Gemini AI
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          );
                        }

                        if (inspectTable === 'blog_posts') {
                          return (
                            <div className="overflow-x-auto border border-slate-850 rounded-lg">
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-850">
                                  <tr>
                                    <th className="p-3">id</th>
                                    <th className="p-3">title</th>
                                    <th className="p-3">slug</th>
                                    <th className="p-3">category</th>
                                    <th className="p-3">author</th>
                                    <th className="p-3">created_at</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850 bg-slate-900/40">
                                  {config.blogModels.filter(b => 
                                    !dbSearch || 
                                    b.title.toLowerCase().includes(dbSearch.toLowerCase()) ||
                                    b.category.toLowerCase().includes(dbSearch.toLowerCase()) ||
                                    b.author.toLowerCase().includes(dbSearch.toLowerCase())
                                  ).map((blog, postIdx) => (
                                    <tr key={blog.id} className="hover:bg-slate-950/20 text-slate-300">
                                      <td className="p-3 font-mono font-bold text-slate-500">{postIdx + 1}</td>
                                      <td className="p-3 font-semibold text-white max-w-[150px] truncate" title={blog.title}>{blog.title}</td>
                                      <td className="p-3 font-mono text-indigo-450 max-w-[100px] truncate">{blog.slug}</td>
                                      <td className="p-3"><span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">{blog.category}</span></td>
                                      <td className="p-3 text-slate-400">{blog.author}</td>
                                      <td className="p-3 font-mono text-slate-500">{blog.createdAt || '2026-06-16'}</td>
                                    </tr>
                                  ))}
                                  {config.blogModels.filter(b => 
                                    !dbSearch || 
                                    b.title.toLowerCase().includes(dbSearch.toLowerCase()) ||
                                    b.category.toLowerCase().includes(dbSearch.toLowerCase())
                                  ).length === 0 && (
                                    <tr>
                                      <td colSpan={6} className="p-8 text-center text-slate-550">No matching database rows found.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          );
                        }

                        // Default product rendering
                        return (
                          <div className="overflow-x-auto border border-slate-850 rounded-lg">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-850">
                                <tr>
                                  <th className="p-3">id</th>
                                  <th className="p-3">name</th>
                                  <th className="p-3">slug</th>
                                  <th className="p-3">price</th>
                                  <th className="p-3">in_stock</th>
                                  <th className="p-3">description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850 bg-slate-900/40">
                                {config.productModels.filter(p => 
                                  !dbSearch || 
                                  p.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
                                  p.slug.toLowerCase().includes(dbSearch.toLowerCase()) ||
                                  p.description.toLowerCase().includes(dbSearch.toLowerCase())
                                ).map((prod, prodIdx) => (
                                  <tr key={prod.id} className="hover:bg-slate-950/20 text-slate-300">
                                    <td className="p-3 font-mono font-bold text-slate-500">{prodIdx + 1}</td>
                                    <td className="p-3 font-semibold text-white max-w-[140px] truncate" title={prod.name}>{prod.name}</td>
                                    <td className="p-3 font-mono text-indigo-455 max-w-[100px] truncate">{prod.slug}</td>
                                    <td className="p-3 font-mono text-emerald-400 font-bold">${parseFloat(String(prod.price || 0)).toFixed(2)}</td>
                                    <td className="p-3">
                                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9.5px] ${
                                        prod.inStock ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-slate-800 text-slate-450'
                                      }`}>
                                        {prod.inStock ? 'TRUE' : 'FALSE'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-450 max-w-[150px] truncate" title={prod.description}>{prod.description}</td>
                                  </tr>
                                ))}
                                {config.productModels.filter(p => 
                                  !dbSearch || 
                                  p.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
                                  p.slug.toLowerCase().includes(dbSearch.toLowerCase())
                                ).length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-550">No matching database rows found.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-850 rounded-lg animate-fade-in">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-850">
                          <tr>
                            <th className="p-3">Field Column</th>
                            <th className="p-3">SQL Datatype</th>
                            <th className="p-3">Constraints</th>
                            <th className="p-3">Nullability</th>
                            <th className="p-3">Default Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 font-mono bg-slate-900/40 text-slate-300 animate-fade-in">
                          {(() => {
                            const matchedCustomModel = (config.customDbModels || []).find(m => m.tableName === inspectTable);
                            if (matchedCustomModel) {
                              return (
                                <>
                                  <tr>
                                    <td className="p-3 font-bold text-white">id</td>
                                    <td className="p-3 text-emerald-400">INTEGER (BigInt)</td>
                                    <td className="p-3 text-orange-400">PRIMARY KEY, AUTO_INC</td>
                                    <td className="p-3 text-slate-500">NO</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  {matchedCustomModel.fields.map(f => (
                                    <tr key={f.name}>
                                      <td className="p-3 font-bold text-white">{f.name}</td>
                                      <td className="p-3 text-blue-400">
                                        {f.type === 'string' ? "VARCHAR(255)" :
                                         f.type === 'integer' ? "INTEGER" :
                                         f.type === 'decimal' ? "DECIMAL(10,2)" :
                                         f.type === 'text' ? "TEXT" :
                                         f.type === 'boolean' ? "TINYINT(1)" : String(f.type).toUpperCase()}
                                      </td>
                                      <td className="p-3 text-slate-500">-</td>
                                      <td className="p-3 text-indigo-400 font-semibold font-sans">
                                        {f.nullable ? 'YES' : 'NO'}
                                      </td>
                                      <td className="p-3 text-slate-500">NULL</td>
                                    </tr>
                                  ))}
                                  <tr>
                                    <td className="p-3 font-bold text-white">created_at</td>
                                    <td className="p-3 text-purple-400">TIMESTAMP</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                    <td className="p-3 text-slate-500">CURRENT_TIMESTAMP</td>
                                  </tr>
                                </>
                              );
                            }

                            if (inspectTable === 'blog_posts') {
                              return (
                                <>
                                  <tr>
                                    <td className="p-3 font-bold text-white">id</td>
                                    <td className="p-3 text-emerald-400">INTEGER (BigInt)</td>
                                    <td className="p-3 text-orange-400">PRIMARY KEY, AUTO_INC</td>
                                    <td className="p-3 text-slate-500">NO</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">title</td>
                                    <td className="p-3 text-blue-400">VARCHAR(255)</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-slate-500">NO</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">slug</td>
                                    <td className="p-3 text-blue-400">VARCHAR(255)</td>
                                    <td className="p-3 text-orange-400">UNIQUE INDEX</td>
                                    <td className="p-3 text-slate-500">NO</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">excerpt</td>
                                    <td className="p-3 text-blue-400">TEXT</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-slate-500">NO</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">body</td>
                                    <td className="p-3 text-blue-400">LONGTEXT (Text)</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-slate-500">NO</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">category</td>
                                    <td className="p-3 text-blue-400">VARCHAR(100)</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">author</td>
                                    <td className="p-3 text-blue-400">VARCHAR(100)</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">image_url</td>
                                    <td className="p-3 text-blue-400">VARCHAR(2048)</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">created_at</td>
                                    <td className="p-3 text-purple-400">TIMESTAMP</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold text-white">updated_at</td>
                                    <td className="p-3 text-purple-400">TIMESTAMP</td>
                                    <td className="p-3 text-slate-500">-</td>
                                    <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                    <td className="p-3 text-slate-500">NULL</td>
                                  </tr>
                                </>
                              );
                            }

                            return (
                              <>
                                <tr>
                                  <td className="p-3 font-bold text-white">id</td>
                                  <td className="p-3 text-emerald-400">INTEGER (BigInt)</td>
                                  <td className="p-3 text-orange-400">PRIMARY KEY, AUTO_INC</td>
                                  <td className="p-3 text-slate-500">NO</td>
                                  <td className="p-3 text-slate-500">NULL</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">name</td>
                                  <td className="p-3 text-blue-400">VARCHAR(255)</td>
                                  <td className="p-3 text-slate-500">-</td>
                                  <td className="p-3 text-slate-500">NO</td>
                                  <td className="p-3 text-slate-500">NULL</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">slug</td>
                                  <td className="p-3 text-blue-400">VARCHAR(255)</td>
                                  <td className="p-3 text-orange-400">UNIQUE INDEX</td>
                                  <td className="p-3 text-slate-500">NO</td>
                                  <td className="p-3 text-slate-500">NULL</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">price</td>
                                  <td className="p-3 text-emerald-400">DECIMAL(10,2)</td>
                                  <td className="p-3 text-slate-500">-</td>
                                  <td className="p-3 text-slate-500">NO</td>
                                  <td className="p-3 text-slate-500">NULL</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">description</td>
                                  <td className="p-3 text-blue-400">TEXT</td>
                                  <td className="p-3 text-slate-500">-</td>
                                  <td className="p-3 text-slate-500">NO</td>
                                  <td className="p-3 text-slate-500">NULL</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">image_url</td>
                                  <td className="p-3 text-blue-400">VARCHAR(2048)</td>
                                  <td className="p-3 text-slate-500">-</td>
                                  <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                  <td className="p-3 text-slate-500">NULL</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">in_stock</td>
                                  <td className="p-3 text-emerald-400">TINYINT(1)</td>
                                  <td className="p-3 text-slate-500">-</td>
                                  <td className="p-3 text-slate-500">NO</td>
                                  <td className="p-3 text-indigo-400 font-sans">1 (true)</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">created_at</td>
                                  <td className="p-3 text-purple-400">TIMESTAMP</td>
                                  <td className="p-3 text-slate-500">-</td>
                                  <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                  <td className="p-3 text-slate-500">NULL</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">updated_at</td>
                                  <td className="p-3 text-purple-400">TIMESTAMP</td>
                                  <td className="p-3 text-slate-500">-</td>
                                  <td className="p-3 text-indigo-400 font-semibold font-sans">YES</td>
                                  <td className="p-3 text-slate-500">NULL</td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                    </>
                  )}
                </div>
              </div>
          </div>

          {/* Card 4: Local Laragon MySQL Database Troubleshooting Diagnostic Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-4 pb-3 border-b border-sidebar border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <HelpCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Local Laragon Database Diagnosis & Setup Guide</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Follow these step-by-step instructions to map tables correctly on your local computer using Laragon + HeidiSQL.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-650">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <span className="font-bold text-slate-805 block text-xs border-l-2 border-indigo-500 pl-2">Step 1: Create the Database manually in HeidiSQL</span>
                  <p className="text-[11px] text-slate-500">
                    Laravel's migration command requires that the MySQL database schema already exist. If you run migrations without creating the blank schema, the connection will abort or throw a <code className="bg-slate-100 rounded px-1 py-0.5 text-orange-655 font-mono">1049 Unknown Database</code> error.
                  </p>
                  <div className="bg-slate-55 bg-indigo-50/20 rounded-lg p-3.5 border border-indigo-100 font-sans text-[11px]">
                    <span className="font-bold text-indigo-950 block mb-1">To create the schema:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-indigo-900 font-medium">
                      <li>Launch Laragon and make sure the MySQL service is started.</li>
                      <li>Click the <strong className="font-bold text-indigo-950">"Database"</strong> button inside Laragon to open HeidiSQL.</li>
                      <li>In HeidiSQL, right-click on your <code className="bg-slate-100 border border-slate-200/50 rounded px-1 text-[10px] font-mono font-normal">localhost</code> connection name in the left sidebar.</li>
                      <li>Choose <strong className="font-bold text-indigo-950">"Create new" &rarr; "Database"</strong>.</li>
                      <li>Input database name: <strong className="font-mono bg-indigo-150/50 px-1.5 py-0.5 rounded text-indigo-700">{dbState.dbDatabase || 'laravel'}</strong> and choose <code className="text-indigo-900">utf8mb4_unicode_ci</code> collation.</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-805 block text-xs border-l-2 border-indigo-500 pl-2">Step 2: Confirm Laragon Defaults inside .env</span>
                  <p className="text-[11px] text-slate-500">
                    Verify that your local <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">.env</code> configurations match Laragon's MySQL defaults. In standard Laragon packages exist without passwords.
                  </p>
                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[10.5px] leading-relaxed border border-slate-850 overflow-x-auto">
{`DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${dbState.dbDatabase || 'laravel'}
DB_USERNAME=root
DB_PASSWORD=`}
                  </pre>
                  <p className="text-[10px] font-medium text-slate-400">
                    *Leave <code className="font-mono bg-slate-100 rounded px-1">DB_PASSWORD</code> completely empty unless you set a customized DB user password.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <span className="font-bold text-slate-805 block text-xs border-l-2 border-indigo-500 pl-2">Step 3: Clear Cached Laravel Configurations</span>
                  <p className="text-[11px] text-slate-500">
                    If you modified migrations or database settings, Laravel often holds stale configs in boot files. Bust the cache completely to reload environment keys from your newly updated <code className="font-mono">.env</code>:
                  </p>
                  <pre className="p-2.5 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] leading-snug overflow-x-auto border border-slate-850">
{`# Clear configurations
php artisan config:clear
php artisan cache:clear-env`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-805 block text-xs border-l-2 border-indigo-500 pl-2">Step 4: Execute Fresh Migration (Laragon Console)</span>
                  <p className="text-[11px] text-slate-500">
                    Inside your cmd/terminal, navigate to the extracted root directory <code className="text-[10px] font-mono font-semibold bg-slate-100 px-1 py-0.5 text-slate-700">C:\\laragon\\www\\my\\lara_bootstrap_site</code> and run this Artisan wrapper:
                  </p>
                  <pre className="p-2.5 bg-slate-950 text-emerald-400 rounded-lg font-mono text-[11px] leading-snug overflow-x-auto border border-slate-850">
{`# 1. Pull up cmd inside 'lara_bootstrap_site'
# 2. Re-compile pristine structures and populate datasets
php artisan migrate:fresh --seed`}
                  </pre>
                  <p className="text-[10px] bg-slate-50 text-slate-450 p-2 rounded border leading-relaxed">
                    <strong>Note:</strong> Laragon does auto-detect folders. Refresh HeidiSQL (F5) after running the seed command; the <span className="font-mono font-semibold text-slate-700">blog_posts</span> and <span className="font-mono font-semibold text-slate-700">products</span> tables will populate instantly!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header alert if Spatie is disabled */}
          {!config.enableSpatiePermissions && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <span className="font-bold text-amber-900 block mb-0.5 animate-pulse">Spatie Permissions Library is Disabled</span>
                Spatie Roles & Permissions is currently set to inactive in your sidebar settings. Laravel will scaffold clean roles but skip standard authorization directives.
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, enableSpatiePermissions: true })}
                  className="mt-2 block bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold py-1 px-3 rounded text-[10px] transition-colors cursor-pointer"
                >
                  Enable Spatie Protection Engine Now
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Role Directory */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Add custom role */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3.5 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Define New ACL Role
                </h4>
                <form onSubmit={handleAddCustomRole} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 font-mono">Role Key/Name</label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. Moderator"
                      className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 font-mono">Role Description</label>
                    <textarea
                      rows={2}
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      placeholder="e.g. Can browse drafts but cannot publish"
                      className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 active:bg-indigo-700 text-white rounded-lg py-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    Scaffold Custom Role
                  </button>
                </form>
              </div>

              {/* Card 2: Role lists */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3 font-mono">Role Directory ({currentRoles.length})</span>
                <div className="space-y-2">
                  {currentRoles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    const isAdministrator = role.name === 'Administrator';
                    return (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between group ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="min-w-0 pr-4">
                          <h5 className="font-bold text-xs flex items-center gap-1.5 capitalize text-slate-800">
                            <Users className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {role.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={role.description}>
                            {role.description}
                          </p>
                          <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-600 border px-1.5 py-0.5 rounded-md font-bold">
                              {role.permissions.length} perms
                            </span>
                            <span className="text-[9px] font-mono bg-slate-100/50 text-slate-400 px-1 rounded-md">
                              guard: web
                            </span>
                          </div>
                        </div>

                        {!isAdministrator && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomRole(role.id, role.name);
                            }}
                            className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity cursor-pointer"
                            title={`Delete role ${role.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Specific Permissions Matrix */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: Permissions Matrix for Selected Role */}
              {selectedRoleId && currentRoles.find(r => r.id === selectedRoleId) ? (
                (() => {
                  const activeRole = currentRoles.find(r => r.id === selectedRoleId)!;
                  
                  // Group permissions by module
                  const modulesMap: Record<string, SpatiePermission[]> = {};
                  currentPermissions.forEach(p => {
                    if (!modulesMap[p.module]) {
                      modulesMap[p.module] = [];
                    }
                    modulesMap[p.module].push(p);
                  });

                  // Maps module identifiers to printable names
                  const moduleHeaders: Record<string, string> = {
                    blog_posts: 'BlogPost Controller (App\\Models\\BlogPost)',
                    products: 'Product CRUD (App\\Models\\Product)',
                    pages: 'CMS Pages Router (WebPagesController)',
                    roles: 'Role & Permission Manager',
                    system: 'Core System Administration',
                  };

                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-650 border border-indigo-100 rounded-lg">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              Spatie Guard Assignment & Permissions
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Configure CRUD access rights for <span className="font-bold text-indigo-700 capitalize font-mono bg-slate-50 px-1 py-0.5 rounded border">{activeRole.name}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Acting Role:</span>
                          <span className="bg-indigo-100 inline-block text-indigo-700 font-bold font-mono text-[10px] px-2.5 py-1 rounded-full capitalize">
                            {activeRole.name}
                          </span>
                        </div>
                      </div>

                      {/* Permissions Group Grid */}
                      <div className="space-y-5">
                        {Object.keys(modulesMap).map((modKey) => {
                          const permsInMod = modulesMap[modKey];
                          const hasAll = permsInMod.every(p => activeRole.permissions.includes(p.name));
                          
                          return (
                            <div key={modKey} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                                <div>
                                  <h5 className="text-xs font-bold text-slate-700 capitalize">
                                    {moduleHeaders[modKey] || `${modKey.replace(/[-_]/g, ' ')} Module`}
                                  </h5>
                                  <p className="text-[9.5px] text-slate-400 mt-0.5 font-medium">CRUD abilities bound to controller middlewares</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectAllModule(activeRole.id, modKey)}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                >
                                  {hasAll ? 'Deselect All' : 'Grant All CRUD'}
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {permsInMod.map((perm) => {
                                  const isChecked = activeRole.permissions.includes(perm.name);
                                  
                                  // Color schemes depending on action type
                                  const actionColors: Record<string, string> = {
                                    create: 'bg-emerald-50 text-emerald-800 border-emerald-100',
                                    read: 'bg-blue-50 text-blue-800 border-blue-100',
                                    update: 'bg-amber-50 text-amber-800 border-amber-100',
                                    delete: 'bg-rose-50 text-rose-800 border-rose-100',
                                    manage: 'bg-purple-50 text-purple-800 border-purple-100',
                                  };

                                  return (
                                    <div
                                      key={perm.id}
                                      onClick={() => handleTogglePermission(activeRole.id, perm.name)}
                                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                                        isChecked
                                          ? 'bg-white border-indigo-200 shadow-sm text-slate-800'
                                          : 'bg-white/60 border-slate-200 text-slate-400 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                        isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                      }`}>
                                        {isChecked && <Check className="w-3 h-3 stroke-[3px]" />}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono text-[10px] font-semibold text-slate-700 block truncate" title={perm.name}>
                                            {perm.name}
                                          </span>
                                          <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                            actionColors[perm.action] || 'bg-slate-100 text-slate-700'
                                          }`}>
                                            {perm.action}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{perm.description}</p>
                                      </div>
                                      
                                      {/* Allow deleting custom permissions (whose id starts with "perm-") */}
                                      {perm.id.startsWith('perm-') && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCustomPermission(perm.id, perm.name);
                                          }}
                                          className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                                          title="Remove custom permission"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Display warning helper */}
                      <div className="p-3.5 bg-indigo-50/40 border border-indigo-150 rounded-lg text-[10.5px] text-slate-600 flex items-start gap-2">
                        <Lock className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Spatie Blade Directive Mapping:</strong> Assigning these permits creates mapping tables. In Laragon welcome layouts, they auto-authorize view elements using standard directive checks e.g. <code className="bg-slate-100 rounded px-1.5 py-0.5 text-[10px] text-amber-800 font-mono font-semibold">@can('{activeRole.permissions[0] || 'blog_posts.create'}') ... @endcan</code> automatically!
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs shadow-sm">
                  Select a User Role in the left directory to configure and bind permissions.
                </div>
              )}

              {/* Card 2: Create Custom Permission */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-650 mb-3.5 flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  Define Custom Action Permission
                </h4>
                <form onSubmit={handleAddCustomPermission} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 font-mono">Module Area</label>
                      <select
                        value={newPermModule}
                        onChange={(e) => setNewPermModule(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-700 cursor-pointer"
                      >
                        <option value="blog_posts">blog_posts (Blogs)</option>
                        <option value="products">products (Product Catalog)</option>
                        <option value="pages">pages (Router Modules)</option>
                        <option value="system">system (System Audit)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 font-mono">CRUD Action Type</label>
                      <select
                        value={newPermAction}
                        onChange={(e) => setNewPermAction(e.target.value as any)}
                        className="w-full text-xs bg-slate-50 border border-slate-205 py-2 px-3 rounded-lg text-slate-700 cursor-pointer"
                      >
                        <option value="create">create</option>
                        <option value="read">read</option>
                        <option value="update">update</option>
                        <option value="delete">delete</option>
                        <option value="manage">manage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 font-mono">Permission Key Suffix</label>
                      <input
                        type="text"
                        required
                        value={newPermName}
                        onChange={(e) => setNewPermName(e.target.value)}
                        placeholder="e.g. approve_drafts"
                        className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1 font-mono">Purpose / Description</label>
                      <input
                        type="text"
                        value={newPermDesc}
                        onChange={(e) => setNewPermDesc(e.target.value)}
                        placeholder="e.g. Allows approving and scheduling draft blog entries"
                        className="w-full text-xs bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 active:bg-indigo-700 text-white rounded-lg py-2  text-xs font-bold cursor-pointer transition-all text-center"
                      >
                        Register Perm
                      </button>
                    </div>
                  </div>
                  
                  {newPermName.trim() && (
                    <div className="text-[10px] font-mono text-indigo-650 bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg">
                      <strong>Generated Spatie Permission Tag:</strong> {newPermModule}.{newPermName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}
                    </div>
                  )}
                </form>
              </div>

              {/* Card 3: Middleware Integration Guide */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 mb-3">
                  <Terminal className="text-emerald-400 w-4.5 h-4.5" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider block">Laravel Spatie PHP Implementation Guide</span>
                </div>
                <div className="space-y-3.5 text-xs text-slate-300">
                  <p className="leading-relaxed text-[11px]">
                    Spatie permissions are mapped via standard Laravel Gates inside <code className="text-indigo-300 font-mono">App\Providers\AppServiceProvider.php</code>.
                  </p>
                  
                  <div className="space-y-2">
                    <span className="text-[10.5px] font-bold text-slate-405 block tracking-wide font-mono">1. Route / Controller Middleware Protection</span>
                    <pre className="p-2.5 bg-slate-950 text-slate-200 border border-slate-850 rounded-lg text-[10px] font-mono leading-relaxed overflow-x-auto text-left">
{`use Spatie\\Permission\\Middlewares\\PermissionMiddleware;

// Group or single protected router endpoint 
Route::post('/admin/blogs', [BlogPostController::class, 'store'])
    ->middleware('permission:blog_posts.create');`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10.5px] font-bold text-slate-405 block tracking-wide font-mono">2. Front-End Blade Directive Authorization</span>
                    <pre className="p-2.5 bg-slate-950 text-slate-200 border border-slate-850 rounded-lg text-[10px] font-mono leading-relaxed overflow-x-auto text-left">
{`@can('products.create')
    <button class="btn btn-primary">Add New Product</button>
@endcan`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helpful tutorial overlay */}
      <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 mt-8 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-700">
          <h5 className="font-bold text-indigo-900 mb-0.5">Dynamic Blade Binding Tutorial (MVC)</h5>
          <p className="mb-2">
            Laravel's MVC pattern decouples the raw static assets from dynamic rows. By utilizing standard blade tags:
          </p>
          <pre className="p-2.5 bg-slate-900 text-slate-200 rounded font-mono text-[10px] whitespace-pre overflow-x-auto leading-relaxed">
{`@foreach($blogs as $post)
    <h5 class="fw-bold">{{ $post->title }}</h5>
    <p>{{ Str::limit($post->excerpt, 120) }}</p>
@endforeach`}
          </pre>
          <p className="mt-2">
            The generated code inside <code className="text-indigo-900 font-semibold">welcome.blade.php</code> implements this logic flawlessly, so dynamic data populates automatically in production.
          </p>
        </div>
      </div>
    </div>
  );
}
