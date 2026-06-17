import React, { useState } from 'react';
import { Block, FeatureItem, PricingTier, TestimonialItem, GalleryItem, FooterBlock, WebDesignConfig } from '../types';
import { Trash2, Plus, Sparkles, Wand2, RefreshCw, Layers, Edit3, CheckCircle, HelpCircle, HardDrive } from 'lucide-react';

interface BlockEditorProps {
  block: Block;
  onChangeBlock: (updatedBlock: Block) => void;
  config?: WebDesignConfig;
}

export default function BlockEditor({ block, onChangeBlock, config }: BlockEditorProps) {
  const [aiLoading, setAiLoading] = useState<string | null>(null); // tracks which field is rewriting
  const [aiTone, setAiTone] = useState<string>('Professional marketing copywriting');

  const handleFieldChange = (field: string, value: any) => {
    onChangeBlock({
      ...block,
      [field]: value
    } as Block);
  };

  // Perform AI rewrite of a specific textarea/text field using the server-side Gemini route
  const handleAiRewrite = async (fieldName: string, originalText: string) => {
    if (!originalText.trim()) return;
    setAiLoading(fieldName);
    try {
      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType: block.type,
          currentField: fieldName,
          originalText,
          tone: aiTone
        })
      });
      const data = await response.json();
      if (data.success && data.rewrittenText) {
        handleFieldChange(fieldName, data.rewrittenText);
      } else {
        alert(data.error || 'Failed to rewrite text.');
      }
    } catch (err) {
      console.error(err);
      alert('Network request to server failed.');
    } finally {
      setAiLoading(null);
    }
  };

  // Render individual editor UI depending on block type
  return (
    <div className="space-y-6">
      {/* Block identity header */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {block.type} section
          </span>
          <h4 className="font-semibold text-sm text-slate-800 capitalize mt-1">
            Editing {block.type} Content
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          ID: {block.id.substring(0, 8)}
        </div>
      </div>

      {/* AI copywriting settings */}
      <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-2.5">
        <label className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          Genie Copywriting Assistant
        </label>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Select a business tone, then click the sparkle icon next to write-fields to invoke server-side Gemini 3.5 AI instantly!
        </p>
        <select
          value={aiTone}
          onChange={(e) => setAiTone(e.target.value)}
          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-indigo-400 outline-none text-slate-700"
        >
          <option value="Professional & trustworthy marketing copywriting">Creative & Informative </option>
          <option value="High-converting SaaS product sales pitch with bullet points">High-Converting Pitch</option>
          <option value="Bold, punchy, modernist, tech startup style copy">Bold & Minimalist</option>
          <option value="Warm, inviting, friendly story-telling text">Friendly & Local Business</option>
          <option value="Urgent, FOMO-inspired, agency-focused copy">Hype & Growth</option>
        </select>
      </div>

      {/* Fields render */}
      <div className="space-y-4">
        {block.type === 'navbar' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Navbar Brand Brand Name</label>
              <input
                type="text"
                value={(block as any).brand || ''}
                onChange={(e) => handleFieldChange('brand', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cta Text</label>
                <input
                  type="text"
                  value={(block as any).ctaText || ''}
                  onChange={(e) => handleFieldChange('ctaText', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cta Link Path</label>
                <input
                  type="text"
                  value={(block as any).ctaLink || ''}
                  onChange={(e) => handleFieldChange('ctaLink', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Theme Style</label>
                <select
                  value={(block as any).themeStyle || 'dark'}
                  onChange={(e) => handleFieldChange('themeStyle', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="dark">Dark Theme (Clean Contrast)</option>
                  <option value="light">Light Theme (Soft Slate)</option>
                  <option value="primary">Brand Accent (Custom Palette)</option>
                </select>
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={(block as any).sticky || false}
                    onChange={(e) => handleFieldChange('sticky', e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                  />
                  Sticky position on scroll
                </label>
              </div>
            </div>
          </>
        )}

        {block.type === 'hero' && (
          <>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Display Hero Title</label>
                <button
                  type="button"
                  onClick={() => handleAiRewrite('title', (block as any).title)}
                  disabled={aiLoading === 'title'}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium disabled:opacity-50"
                >
                  {aiLoading === 'title' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3Color-indigo" />}
                  Ask Genie AI Rewrite
                </button>
              </div>
              <textarea
                rows={2}
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Primary Subtitle/Description</label>
                <button
                  type="button"
                  onClick={() => handleAiRewrite('subtitle', (block as any).subtitle)}
                  disabled={aiLoading === 'subtitle'}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium disabled:opacity-50"
                >
                  {aiLoading === 'subtitle' ? <RefreshCw className="w-3 h-3 animate-spin animate-infinite" /> : <Sparkles className="w-3 h-3" />}
                  Rewrite Description
                </button>
              </div>
              <textarea
                rows={3}
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Button Label</label>
                <input
                  type="text"
                  value={(block as any).ctaText || ''}
                  onChange={(e) => handleFieldChange('ctaText', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Route #Hash</label>
                <input
                  type="text"
                  value={(block as any).ctaLink || ''}
                  onChange={(e) => handleFieldChange('ctaLink', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Button Label</label>
                <input
                  type="text"
                  value={(block as any).secondaryCtaText || ''}
                  onChange={(e) => handleFieldChange('secondaryCtaText', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Link Path</label>
                <input
                  type="text"
                  value={(block as any).secondaryCtaLink || ''}
                  onChange={(e) => handleFieldChange('secondaryCtaLink', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Visual Layout Grid</label>
                <select
                  value={(block as any).layout || 'center'}
                  onChange={(e) => handleFieldChange('layout', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="center">Centered Text Hero</option>
                  <option value="left-split">Split: Copy Left, Image Right</option>
                  <option value="right-split">Split: Image Left, Copy Right</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Backdrop Pattern</label>
                <select
                  value={(block as any).bgPattern || 'default'}
                  onChange={(e) => handleFieldChange('bgPattern', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                >
                  <option value="default">Solid Slate Canvas</option>
                  <option value="gradient">Custom Theme Gradient Blue/Green</option>
                  <option value="glass">Translucent Blurry Glass</option>
                  <option value="toned-down">Slight Off-White Slate</option>
                </select>
              </div>
            </div>

            {(block as any).layout !== 'center' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mock Mockup Image URL</label>
                <input
                  type="text"
                  value={(block as any).imageUrl || ''}
                  onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
                />
              </div>
            )}
          </>
        )}

        {block.type === 'features' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Header Title</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-heading</label>
              <textarea
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grid Columns count</label>
              <select
                value={(block as any).columns || 3}
                onChange={(e) => handleFieldChange('columns', parseInt(e.target.value))}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400"
              >
                <option value={2}>2 Column Grid</option>
                <option value={3}>3 Column Grid</option>
                <option value={4}>4 Column Grid</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-800 flex justify-between items-center">
                Bullet Feature Modules ({(block as any).items?.length || 0})
                <button
                  type="button"
                  onClick={() => {
                    const newItems = [...((block as any).items || [])];
                    newItems.push({
                      id: `feat-${Math.random()}`,
                      icon: 'Sparkles',
                      title: 'Specialty Core Option',
                      description: 'Custom details generated beautifully.'
                    });
                    handleFieldChange('items', newItems);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2 py-1 text-[10px] font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Feature Card
                </button>
              </span>

              {((block as any).items || []).map((item: FeatureItem, idx: number) => (
                <div key={item.id} className="border border-slate-250 p-3 rounded-lg bg-slate-50/50 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = ((block as any).items || []).filter((i: FeatureItem) => i.id !== item.id);
                      handleFieldChange('items', newItems);
                    }}
                    className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Icon Style</label>
                      <select
                        value={item.icon || 'Sparkles'}
                        onChange={(e) => {
                          const newItems = [...((block as any).items || [])];
                          newItems[idx] = { ...item, icon: e.target.value };
                          handleFieldChange('items', newItems);
                        }}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded px-2 py-1"
                      >
                        <option value="Sparkles">Sparkles</option>
                        <option value="Database">Database Set</option>
                        <option value="Cpu">CPU Tech</option>
                        <option value="Shield">Shield Lock</option>
                        <option value="Zap">Zap Surge</option>
                        <option value="Box">Box Layer</option>
                        <option value="ShoppingCart">Cart Ecomm</option>
                        <option value="Users">Users Team</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Title Text</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...((block as any).items || [])];
                          newItems[idx] = { ...item, title: e.target.value };
                          handleFieldChange('items', newItems);
                        }}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Description details</label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...((block as any).items || [])];
                        newItems[idx] = { ...item, description: e.target.value };
                        handleFieldChange('items', newItems);
                      }}
                      className="w-full text-[10px] bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {block.type === 'pricing' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Title</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Description</label>
              <textarea
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>

            <div className="space-y-4 pt-2">
              <span className="text-xs font-semibold text-slate-800 flex justify-between items-center">
                Product Pricing Packages
                <button
                  type="button"
                  onClick={() => {
                    const newTiers = [...((block as any).tiers || [])];
                    newTiers.push({
                      id: `tier-${Math.random()}`,
                      name: 'Business Growth',
                      price: '$99',
                      billing: 'month billing',
                      features: ['10 Dynamic Seats', 'Secure database migrations'],
                      ctaText: 'Deploy Now',
                      featured: false
                    });
                    handleFieldChange('tiers', newTiers);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2 py-1 text-[10px] font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Package
                </button>
              </span>

              {((block as any).tiers || []).map((tier: PricingTier, idx: number) => (
                <div key={tier.id} className="border border-slate-250 p-4 rounded-xl bg-slate-50/50 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const newTiers = ((block as any).tiers || []).filter((t: PricingTier) => t.id !== tier.id);
                      handleFieldChange('tiers', newTiers);
                    }}
                    className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Package Name</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => {
                          const newTiers = [...((block as any).tiers || [])];
                          newTiers[idx] = { ...tier, name: e.target.value };
                          handleFieldChange('tiers', newTiers);
                        }}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Price (Label)</label>
                      <input
                        type="text"
                        value={tier.price}
                        onChange={(e) => {
                          const newTiers = [...((block as any).tiers || [])];
                          newTiers[idx] = { ...tier, price: e.target.value };
                          handleFieldChange('tiers', newTiers);
                        }}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Billing Terms</label>
                      <input
                        type="text"
                        value={tier.billing}
                        onChange={(e) => {
                          const newTiers = [...((block as any).tiers || [])];
                          newTiers[idx] = { ...tier, billing: e.target.value };
                          handleFieldChange('tiers', newTiers);
                        }}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Action Button text</label>
                      <input
                        type="text"
                        value={tier.ctaText}
                        onChange={(e) => {
                          const newTiers = [...((block as any).tiers || [])];
                          newTiers[idx] = { ...tier, ctaText: e.target.value };
                          handleFieldChange('tiers', newTiers);
                        }}
                        className="w-full text-[11px] bg-white border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={tier.featured}
                      id={`check-${tier.id}`}
                      onChange={(e) => {
                        const newTiers = [...((block as any).tiers || [])];
                        newTiers[idx] = { ...tier, featured: e.target.checked };
                        handleFieldChange('tiers', newTiers);
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-400"
                    />
                    <label htmlFor={`check-${tier.id}`} className="text-[11px] text-slate-600 cursor-pointer select-none">
                      Highlight as "Most Popular" (Thick Accent border)
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Included Bullet Features (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={tier.features.join('\n')}
                      onChange={(e) => {
                        const newTiers = [...((block as any).tiers || [])];
                        newTiers[idx] = { ...tier, features: e.target.value.split('\n') };
                        handleFieldChange('tiers', newTiers);
                      }}
                      className="w-full text-[10px] bg-white border border-slate-200 rounded px-2.5 py-1.5 outline-none font-sans"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {block.type === 'blog' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blog Section Title</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Subtitle Details</label>
              <textarea
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl">
              <span className="text-xs font-semibold text-indigo-900 block mb-1">Laravel Schema Sync Active</span>
              <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
                This blog block is linked to the <strong>Dynamic CMS Tables</strong>. Any changes you perform inside the mock database tab will sync immediately to the view!
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-xs text-slate-600 font-semibold">Active Database mapping: App\Models\BlogPost</span>
              </div>
            </div>
          </>
        )}

        {block.type === 'contact' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Heading</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Instruction Details</label>
              <textarea
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Email</label>
                <input
                  type="text"
                  value={(block as any).email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telephone Account</label>
                <input
                  type="text"
                  value={(block as any).phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HQ Silicon Address</label>
              <input
                type="text"
                value={(block as any).address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Form Button Value</label>
                <input
                  type="text"
                  value={(block as any).buttonText || ''}
                  onChange={(e) => handleFieldChange('buttonText', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={(block as any).showMap || false}
                    onChange={(e) => handleFieldChange('showMap', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-400"
                  />
                  Embed dummy maps component
                </label>
              </div>
            </div>
          </>
        )}

        {block.type === 'footer' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand motto or small about</label>
              <textarea
                value={(block as any).text || ''}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Copyright Legal string</label>
              <input
                type="text"
                value={(block as any).copyright || ''}
                onChange={(e) => handleFieldChange('copyright', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
          </>
        )}

        {block.type === 'login' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Form Heading Title</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Form Subheading text</label>
              <textarea
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Input Label</label>
                <input
                  type="text"
                  value={(block as any).emailLabel || ''}
                  onChange={(e) => handleFieldChange('emailLabel', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Input Label</label>
                <input
                  type="text"
                  value={(block as any).passwordLabel || ''}
                  onChange={(e) => handleFieldChange('passwordLabel', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remember Me Label</label>
              <input
                type="text"
                value={(block as any).rememberMeLabel || ''}
                onChange={(e) => handleFieldChange('rememberMeLabel', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Login Button Text</label>
              <input
                type="text"
                value={(block as any).buttonText || ''}
                onChange={(e) => handleFieldChange('buttonText', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Forgot Password Link Text</label>
              <input
                type="text"
                value={(block as any).forgotPasswordLinkText || ''}
                onChange={(e) => handleFieldChange('forgotPasswordLinkText', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Prompt Link Text</label>
              <input
                type="text"
                value={(block as any).registrationLinkText || ''}
                onChange={(e) => handleFieldChange('registrationLinkText', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Success Target URL Route</label>
              <input
                type="text"
                value={(block as any).destinationUrl || ''}
                onChange={(e) => handleFieldChange('destinationUrl', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono text-indigo-650"
              />
            </div>
          </>
        )}

        {block.type === 'register' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Heading Title</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subheading text</label>
              <textarea
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name Input Label</label>
                <input
                  type="text"
                  value={(block as any).nameLabel || ''}
                  onChange={(e) => handleFieldChange('nameLabel', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Input Label</label>
                <input
                  type="text"
                  value={(block as any).emailLabel || ''}
                  onChange={(e) => handleFieldChange('emailLabel', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Input Label</label>
                <input
                  type="text"
                  value={(block as any).passwordLabel || ''}
                  onChange={(e) => handleFieldChange('passwordLabel', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Confirm Label</label>
                <input
                  type="text"
                  value={(block as any).passwordConfirmLabel || ''}
                  onChange={(e) => handleFieldChange('passwordConfirmLabel', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Submit Button Text</label>
              <input
                type="text"
                value={(block as any).buttonText || ''}
                onChange={(e) => handleFieldChange('buttonText', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Existing Login Link Text</label>
              <input
                type="text"
                value={(block as any).loginLinkText || ''}
                onChange={(e) => handleFieldChange('loginLinkText', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Success Register Target Route</label>
              <input
                type="text"
                value={(block as any).destinationUrl || ''}
                onChange={(e) => handleFieldChange('destinationUrl', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono text-indigo-650"
              />
            </div>
          </>
        )}

        {block.type === 'dashboard' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Portal Main Heading</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Underline Subtitle text</label>
              <input
                type="text"
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border p-3.5 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mock User Name</label>
                <input
                  type="text"
                  value={(block as any).userName || ''}
                  onChange={(e) => handleFieldChange('userName', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">User Authorization Role</label>
                <input
                  type="text"
                  value={(block as any).userRole || ''}
                  onChange={(e) => handleFieldChange('userRole', e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
                />
              </div>
            </div>

            {/* Dashboard Stats Cards list */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">Metric Cards</label>
              {((block as any).stats || []).map((st: any, idx: number) => (
                <div key={idx} className="border border-slate-250 p-3 rounded-lg bg-indigo-50/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-750">Metric Card #{idx + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label e.g. Sales"
                      value={st.label}
                      onChange={(e) => {
                        const copy = [...(block as any).stats];
                        copy[idx].label = e.target.value;
                        handleFieldChange('stats', copy);
                      }}
                      className="text-xs bg-white border px-2 py-1 rounded outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Value e.g. 5,420"
                      value={st.value}
                      onChange={(e) => {
                        const copy = [...(block as any).stats];
                        copy[idx].value = e.target.value;
                        handleFieldChange('stats', copy);
                      }}
                      className="text-xs bg-white border px-2 py-1 rounded outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Trend e.g. +12% this week"
                      value={st.trend}
                      onChange={(e) => {
                        const copy = [...(block as any).stats];
                        copy[idx].trend = e.target.value;
                        handleFieldChange('stats', copy);
                      }}
                      className="text-xs bg-white border px-2 py-1 rounded outline-none"
                    />
                    <select
                      value={st.icon}
                      onChange={(e) => {
                        const copy = [...(block as any).stats];
                        copy[idx].icon = e.target.value;
                        handleFieldChange('stats', copy);
                      }}
                      className="text-xs bg-white border px-2 py-1 rounded outline-none text-slate-700"
                    >
                      <option value="TrendingUp">TrendingUp (Icon)</option>
                      <option value="Users">Users (Icon)</option>
                      <option value="Database">Database (Icon)</option>
                      <option value="Shield">Shield (Icon)</option>
                      <option value="ShoppingCart">Cart (Icon)</option>
                      <option value="Heart">Heart (Icon)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {block.type === 'form_custom' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Form Header Heading</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Form Subheading text</label>
              <textarea
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>

            {/* Linked model option dropdown */}
            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl space-y-1.5">
              <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                Linked Laravel Database Table Model
              </label>
              <p className="text-[10px] text-slate-600 leading-normal">
                Submitting this form in visually active preview automatically writes new Eloquent records to this database configuration state.
              </p>
              <select
                value={(block as any).bindToCustomModelId || ''}
                onChange={(e) => handleFieldChange('bindToCustomModelId', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:border-emerald-400 outline-none text-slate-700 mt-1"
              >
                <option value="">-- Let System Select / Auto-create Model --</option>
                {config?.customDbModels?.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.modelName} (Table: {m.tableName})
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic form fields manager list */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure Form Fields</label>
                <button
                  type="button"
                  onClick={() => {
                    const fields = [...((block as any).fields || [])];
                    fields.push({
                      name: `field_${Date.now().toString().slice(-4)}`,
                      label: 'New Dynamic Field',
                      type: 'string',
                      required: false,
                      placeholder: 'Input your value here...'
                    });
                    handleFieldChange('fields', fields);
                  }}
                  className="text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 px-2 py-1 rounded"
                >
                  <Plus className="w-3.5 h-3.5" /> Field
                </button>
              </div>

              {((block as any).fields || []).map((fd: any, idx: number) => (
                <div key={idx} className="border p-3 rounded-xl bg-slate-50 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => {
                      const fields = ((block as any).fields || []).filter((_: any, i: number) => i !== idx);
                      handleFieldChange('fields', fields);
                    }}
                    className="absolute top-2.5 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-2 mt-1 pr-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Label Text</label>
                      <input
                        type="text"
                        value={fd.label}
                        onChange={(e) => {
                          const copy = [...(block as any).fields];
                          copy[idx].label = e.target.value;
                          handleFieldChange('fields', copy);
                        }}
                        className="w-full text-xs bg-white border px-2 py-1 rounded outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">DB Field Name (AlphaNumeric)</label>
                        <input
                          type="text"
                          value={fd.name}
                          onChange={(e) => {
                            const copy = [...(block as any).fields];
                            copy[idx].name = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                            handleFieldChange('fields', copy);
                          }}
                          className="w-full text-[11px] font-mono bg-white border px-2 py-1 rounded outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">HTML/SQL Type</label>
                        <select
                          value={fd.type}
                          onChange={(e) => {
                            const copy = [...(block as any).fields];
                            copy[idx].type = e.target.value;
                            handleFieldChange('fields', copy);
                          }}
                          className="w-full text-xs bg-white border px-1.5 py-1 rounded outline-none text-slate-700"
                        >
                          <option value="text">text (string)</option>
                          <option value="email">email (string)</option>
                          <option value="password">password (string)</option>
                          <option value="number">number (decimal/int)</option>
                          <option value="textarea">textarea (text)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Placeholder</label>
                      <input
                        type="text"
                        value={fd.placeholder || ''}
                        onChange={(e) => {
                          const copy = [...(block as any).fields];
                          copy[idx].placeholder = e.target.value;
                          handleFieldChange('fields', copy);
                        }}
                        className="w-full text-xs bg-white border px-2 py-1 rounded outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-slate-600 pt-1">
                      <input
                        type="checkbox"
                        checked={fd.required || false}
                        onChange={(e) => {
                          const copy = [...(block as any).fields];
                          copy[idx].required = e.target.checked;
                          handleFieldChange('fields', copy);
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-400"
                      />
                      Required Validation Mark
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Submit Button Text</label>
              <input
                type="text"
                value={(block as any).buttonText || ''}
                onChange={(e) => handleFieldChange('buttonText', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
          </>
        )}

        {block.type === 'table_custom' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Table Section Title</label>
              <input
                type="text"
                value={(block as any).title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Table Subheading text</label>
              <input
                type="text"
                value={(block as any).subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>

            {/* Linked model option dropdown */}
            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl space-y-1.5">
              <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                Dynamic Database Table Source
              </label>
              <p className="text-[10px] text-slate-600 leading-normal">
                This component queries custom seeded tables in real-time. Link it to the Form block model above to display inputs visual rendering inside the live active preview.
              </p>
              <select
                value={(block as any).bindToCustomModelId || ''}
                onChange={(e) => handleFieldChange('bindToCustomModelId', e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:border-emerald-400 outline-none text-slate-700 mt-1"
              >
                <option value="">-- Let System Select / Default Simulated Seeds --</option>
                {config?.customDbModels?.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.modelName} (Table: {m.tableName}, Records Seeding: {m.records.length})
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
