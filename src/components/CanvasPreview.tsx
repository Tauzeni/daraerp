import React, { useEffect, useRef } from 'react';
import { WebDesignConfig, Block } from '../types';
import { getBootstrapIconClass } from '../utils/laravel-generator';

interface CanvasPreviewProps {
  config: WebDesignConfig;
  onChangeConfig: (newConfig: WebDesignConfig) => void;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  viewportWidth: 'desktop' | 'tablet' | 'mobile';
}

export default function CanvasPreview({
  config,
  onChangeConfig,
  selectedBlockId,
  onSelectBlock,
  viewportWidth
}: CanvasPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const activePage = config.pages.find(p => p.id === config.activePageId) || config.pages[0];

  // Helper to convert hex to RGB
  function hexToRgb(hex: string): string {
    let c = hex.substring(1);
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const num = parseInt(c, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Compile customized active sections into standard Bootstrap 5 HTML
    let htmlContent = '';
    
    activePage.blocks.forEach((block: Block) => {
      if (!block.visible) return;

      const blockActiveOutline = block.id === selectedBlockId 
        ? 'border: 3px dashed #fc135d; position: relative; border-radius: 4px; box-shadow: 0 0 16px rgba(252,19,93,0.3);' 
        : 'border: 1px transparent solid; cursor: pointer; transition: all 0.2s ease;';

      const wrapperStart = `<div class="cms-block-wrapper" data-id="${block.id}" style="${blockActiveOutline}" title="Click to edit ${block.type}">`;
      const wrapperEnd = `</div>`;

      let inner = '';

      switch (block.type) {
        case 'navbar': {
          const bgClass = block.themeStyle === 'dark' ? 'bg-dark navbar-dark' : block.themeStyle === 'primary' ? 'bg-primary navbar-dark' : 'bg-light navbar-light';
          inner = `
            <nav class="navbar navbar-expand-lg ${bgClass} ${block.sticky ? 'sticky-top shadow' : ''} py-3">
              <div class="container">
                <a class="navbar-brand fw-bold fs-3 d-flex align-items-center" href="#home">
                  <i class="bi bi-cpu text-primary me-2"></i> ${config.projectName}
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav-${block.id}">
                  <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="nav-${block.id}">
                  <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                    ${block.links.map(link => `
                      <li class="nav-item">
                        <a class="nav-link px-3" href="${link.url}">${link.label}</a>
                      </li>
                    `).join('')}
                  </ul>
                  <a href="${block.ctaLink}" class="btn btn-primary px-4 rounded-pill fw-semibold shadow-sm">${block.ctaText}</a>
                </div>
              </div>
            </nav>
          `;
          break;
        }
        case 'hero': {
          const bgClass = block.bgPattern === 'gradient' ? 'gradient-banner' : block.bgPattern === 'glass' ? 'bg-body-tertiary border-bottom glass-card' : 'bg-body';
          
          let columns = '';
          if (block.layout === 'center') {
            columns = `
              <div class="col-lg-8 mx-auto text-center">
                <h1 class="display-4 fw-bold mb-3">${block.title}</h1>
                <p class="lead mb-4 opacity-90">${block.subtitle}</p>
                <div class="d-flex justify-content-center gap-3">
                  <a href="${block.ctaLink}" class="btn btn-primary btn-lg px-4 rounded-pill shadow">${block.ctaText}</a>
                  <a href="${block.secondaryCtaLink}" class="btn btn-outline-dark btn-lg px-4 rounded-pill">${block.secondaryCtaText}</a>
                </div>
              </div>
            `;
          } else if (block.layout === 'left-split') {
            columns = `
              <div class="col-lg-6 my-auto text-start">
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill mb-3 text-uppercase tracking-wider">Laravel Blade & Bootstrap</span>
                <h1 class="display-5 fw-bold mb-3">${block.title}</h1>
                <p class="lead mb-4 opacity-90">${block.subtitle}</p>
                <div class="d-flex gap-3">
                  <a href="${block.ctaLink}" class="btn btn-primary btn-lg px-4 rounded-pill shadow-sm">${block.ctaText}</a>
                  <a href="${block.secondaryCtaLink}" class="btn btn-outline-secondary btn-lg px-4 rounded-pill">${block.secondaryCtaText}</a>
                </div>
              </div>
              <div class="col-lg-6 mt-4 mt-lg-0">
                <img src="${block.imageUrl}" class="img-fluid rounded-4 shadow-lg border" alt="Hero representation" referrerPolicy="no-referrer">
              </div>
            `;
          } else {
            columns = `
              <div class="col-lg-6 mb-4 my-auto">
                <img src="${block.imageUrl}" class="img-fluid rounded-4 shadow-lg border" alt="Hero representation" referrerPolicy="no-referrer">
              </div>
              <div class="col-lg-6 my-auto text-start ps-lg-5">
                <h1 class="display-5 fw-bold mb-3">${block.title}</h1>
                <p class="lead mb-4 opacity-90">${block.subtitle}</p>
                <div class="d-flex gap-3">
                  <a href="${block.ctaLink}" class="btn btn-primary btn-lg px-4 rounded-pill shadow-sm">${block.ctaText}</a>
                  <a href="${block.secondaryCtaLink}" class="btn btn-outline-secondary btn-lg px-4 rounded-pill">${block.secondaryCtaText}</a>
                </div>
              </div>
            `;
          }

          inner = `
            <header class="${bgClass} py-5 border-bottom">
              <div class="container py-4">
                <div class="row align-items-center">
                  ${columns}
                </div>
              </div>
            </header>
          `;
          break;
        }
        case 'features': {
          const colClass = block.columns === 4 ? 'col-lg-3' : block.columns === 2 ? 'col-lg-6' : 'col-lg-4';
          inner = `
            <section class="py-5 bg-body-secondary" id="features">
              <div class="container py-4 text-center">
                <h2 class="fw-bold text-dark display-6 mb-2">${block.title}</h2>
                <p class="text-secondary col-md-8 mx-auto mb-5 lead">${block.subtitle}</p>
                <div class="row g-4 text-start">
                  ${block.items.map(item => `
                    <div class="${colClass} col-md-6">
                      <div class="card h-100 p-4 border shadow-sm rounded-4 bg-body">
                        <div class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary fs-3 rounded-3 p-3 mb-3" style="width: 56px; height: 56px;">
                          <i class="bi ${getBootstrapIconClass(item.icon)}"></i>
                        </div>
                        <h4 class="fw-bold mb-2 text-dark">${item.title}</h4>
                        <p class="text-secondary small mb-0">${item.description}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'stats': {
          inner = `
            <section class="py-5 gradient-banner text-center text-white">
              <div class="container py-3">
                <h3 class="fw-bold mb-3">${block.title}</h3>
                <p class="lead opacity-90 col-md-8 mx-auto mb-5">${block.subtitle}</p>
                <div class="row g-4 justify-content-center">
                  ${block.items.map(item => `
                    <div class="col-6 col-md-3">
                      <h2 class="display-4 fw-black mb-1">${item.number}</h2>
                      <p class="text-uppercase tracking-wider small opacity-75 mb-0">${item.label}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'blog': {
          const articles = config.blogModels;
          inner = `
            <section class="py-5 bg-body" id="blog">
              <div class="container py-4">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-5">
                  <div>
                    <h2 class="fw-bold text-dark display-6 mb-1">${block.title}</h2>
                    <p class="text-secondary lead mb-0">${block.subtitle}</p>
                  </div>
                  <span class="badge bg-secondary rounded-pill mt-2 mt-md-0 px-3 py-2">Dynamic Model Bound</span>
                </div>
                
                <div class="row g-4">
                  ${articles.map(art => `
                    <div class="col-lg-6">
                      <div class="card h-100 border rounded-4 overflow-hidden shadow-sm bg-body">
                        <div class="row g-0 h-100">
                          <div class="col-md-5">
                            <img src="${art.imageUrl}" class="img-fluid h-100 object-fit-cover" style="min-height: 180px; width: 100%" alt="${art.title}" referrerPolicy="no-referrer">
                          </div>
                          <div class="col-md-7 d-flex flex-column p-4">
                            <span class="badge bg-primary-subtle text-primary align-self-start mb-2">${art.category}</span>
                            <h5 class="fw-bold text-dark mb-2">${art.title}</h5>
                            <p class="text-secondary small flex-grow-1">${art.excerpt}</p>
                            <div class="d-flex align-items-center mt-3 pt-3 border-top justify-content-between text-muted small">
                              <span>${art.author}</span>
                              <span>${art.createdAt}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'pricing': {
          inner = `
            <section class="py-5 bg-body-secondary" id="pricing">
              <div class="container py-4 text-center">
                <h2 class="fw-bold text-dark display-6 mb-2">${block.title}</h2>
                <p class="text-secondary lead col-md-8 mx-auto mb-5">${block.subtitle}</p>
                <div class="row g-4 justify-content-center text-start">
                  ${block.tiers.map(tier => `
                    <div class="col-lg-4 col-md-6">
                      <div class="card h-100 p-4 border ${tier.featured ? 'border-primary border-3 shadow-lg' : 'shadow-sm'} rounded-4 bg-body d-flex flex-column">
                        ${tier.featured ? '<span class="badge bg-primary text-white rounded-pill px-3 py-2 align-self-start mb-3">Most Popular</span>' : ''}
                        <h4 class="fw-bold text-dark mb-1">${tier.name}</h4>
                        <div class="d-flex align-items-baseline mb-3">
                          <span class="display-5 fw-bold text-dark">${tier.price}</span>
                          <span class="text-secondary ms-2">${tier.billing}</span>
                        </div>
                        <ul class="list-unstyled flex-grow-1 border-top pt-3 mb-4">
                          ${tier.features.map(f => `
                            <li class="mb-2 d-flex align-items-center">
                              <i class="bi bi-patch-check-fill text-success me-2"></i>
                              <span class="text-secondary-subtitle">${f}</span>
                            </li>
                          `).join('')}
                        </ul>
                        <button class="btn ${tier.featured ? 'btn-primary' : 'btn-outline-dark'} btn-lg w-100 rounded-pill shadow-sm py-2 fw-semibold">${tier.ctaText}</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'testimonials': {
          inner = `
            <section class="py-5 bg-body">
              <div class="container py-4 text-center">
                <h2 class="fw-bold text-dark display-6 mb-2">${block.title}</h2>
                <p class="text-secondary col-md-8 mx-auto mb-5 lead">${block.subtitle}</p>
                <div class="row g-4 text-start">
                  ${block.items.map(item => `
                    <div class="col-md-6 col-lg-4">
                      <div class="card h-100 p-4 border rounded-4 shadow-sm bg-body d-flex flex-column justify-content-between">
                        <div>
                          <div class="text-warning mb-3">
                            ${Array.from({ length: item.stars }).map(() => '<i class="bi bi-star-fill me-1"></i>').join('')}
                          </div>
                          <p class="text-secondary italic mb-4">"${item.text}"</p>
                        </div>
                        <div class="d-flex align-items-center border-top pt-3">
                          <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style="width: 44px; height: 44px;">
                            ${item.author[0]}
                          </div>
                          <div>
                            <h6 class="fw-bold text-dark mb-0">${item.author}</h6>
                            <small class="text-muted">${item.role}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'gallery': {
          const colClass = block.columns === 4 ? 'col-lg-3' : 'col-lg-4';
          inner = `
            <section class="py-5 bg-body-secondary">
              <div class="container py-4">
                <div class="text-center mb-5">
                  <h2 class="fw-bold text-dark display-6 mb-2">${block.title}</h2>
                  <p class="text-secondary lead col-md-8 mx-auto">${block.subtitle}</p>
                </div>
                <div class="row g-4">
                  ${block.items.map(img => `
                    <div class="${colClass} col-md-6">
                      <div class="card h-100 overflow-hidden border shadow-sm rounded-4 bg-body">
                        <img src="${img.imageUrl}" class="img-fluid" style="height: 220px; object-fit: cover;" alt="${img.title}" referrerPolicy="no-referrer">
                        <div class="p-3">
                          <h5 class="fw-bold text-dark mb-1">${img.title}</h5>
                          <p class="text-secondary small mb-0">${img.description}</p>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'contact': {
          inner = `
            <section class="py-5 bg-body" id="contact">
              <div class="container py-4">
                <div class="row g-5 align-items-stretch">
                  <div class="col-lg-5 d-flex flex-column justify-content-between">
                    <div>
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill mb-3">Deployment Hub</span>
                      <h2 class="fw-bold text-dark display-6 mb-3">${block.title}</h2>
                      <p class="text-secondary mb-4 lead">${block.subtitle}</p>
                    </div>
                    <div class="mb-4">
                      <div class="d-flex align-items-center mb-3">
                        <span class="bg-primary bg-opacity-10 text-primary p-2 rounded-3 me-3 fs-3"><i class="bi bi-envelope"></i></span>
                        <div>
                          <h6 class="fw-bold mb-0">Email Address</h6>
                          <span class="text-secondary small">${block.email}</span>
                        </div>
                      </div>
                      <div class="d-flex align-items-center mb-3">
                        <span class="bg-primary bg-opacity-10 text-primary p-2 rounded-3 me-3 fs-3"><i class="bi bi-telephone"></i></span>
                        <div>
                          <h6 class="fw-bold mb-0">Telephone Support</h6>
                          <span class="text-secondary small">${block.phone}</span>
                        </div>
                      </div>
                      <div class="d-flex align-items-center">
                        <span class="bg-primary bg-opacity-10 text-primary p-2 rounded-3 me-3 fs-3"><i class="bi bi-geo-alt"></i></span>
                        <div>
                          <h6 class="fw-bold mb-0">Silicon HQ Location</h6>
                          <span class="text-secondary small">${block.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-7">
                    <div class="card p-4 p-md-5 border shadow-sm rounded-4 bg-body">
                      <form onsubmit="event.preventDefault(); alert('Inquiry Simulation Validated!');">
                        <div class="row g-3">
                          <div class="col-md-6">
                            <label class="form-label text-secondary small fw-semibold">Your Full Name</label>
                            <input type="text" class="form-control rounded-pill py-2 px-3" required placeholder="Alex Mercer" disabled>
                          </div>
                          <div class="col-md-6">
                            <label class="form-label text-secondary small fw-semibold">Email Account</label>
                            <input type="email" class="form-control rounded-pill py-2 px-3" required placeholder="alex@mercer.com" disabled>
                          </div>
                          <div class="col-12">
                            <label class="form-label text-secondary small fw-semibold">Message Body</label>
                            <textarea class="form-control rounded-3" rows="3" placeholder="Click in CMS edit panel to customize inputs..." disabled></textarea>
                          </div>
                          <button type="button" class="btn btn-primary rounded-pill w-100 py-3 fw-semibold shadow-sm mt-3">${block.buttonText}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'login': {
          inner = `
            <section class="py-5 bg-light" id="login-${block.id}">
              <div class="container py-4">
                <div class="row justify-content-center">
                  <div class="col-md-6 col-lg-5">
                    <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
                      <div class="bg-primary text-white p-4 text-center">
                        <i class="bi bi-shield-lock-fill fs-1"></i>
                        <h3 class="fw-bold mt-2 mb-0">${block.title}</h3>
                        <p class="text-white-50 small mb-0">${block.subtitle}</p>
                      </div>
                      <div class="card-body p-4 bg-white">
                        <form>
                          <div class="mb-3 text-start">
                            <label class="form-label text-secondary small fw-bold">${block.emailLabel}</label>
                            <input type="email" name="email" class="form-control" placeholder="name@example.com" required value="admin@laraboot.dev" />
                          </div>
                          <div class="mb-3 text-start">
                            <label class="form-label text-secondary small fw-bold">${block.passwordLabel}</label>
                            <input type="password" name="password" class="form-control" placeholder="••••••••" required value="secret123" />
                          </div>
                          <div class="d-flex justify-content-between align-items-center mb-4 text-start">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" id="rem-${block.id}" checked>
                              <label class="form-check-label small text-secondary select-none" for="rem-${block.id}">
                                ${block.rememberMeLabel}
                              </label>
                            </div>
                            <a href="#" class="small text-decoration-none fw-semibold" onclick="event.preventDefault(); alert('Reset simulation triggered!');">${block.forgotPasswordLinkText}</a>
                          </div>
                          <button type="submit" class="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm mb-3">
                            ${block.buttonText}
                          </button>
                          <div class="text-center">
                            <a href="#" class="small text-decoration-none text-muted" onclick="event.preventDefault(); alert('Navigation simulation: Register page');">${block.registrationLinkText}</a>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'register': {
          inner = `
            <section class="py-5 bg-light" id="register-${block.id}">
              <div class="container py-4">
                <div class="row justify-content-center">
                  <div class="col-md-6 col-lg-5">
                    <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
                      <div class="bg-primary text-white p-4 text-center">
                        <i class="bi bi-person-plus-fill fs-1"></i>
                        <h3 class="fw-bold mt-2 mb-0">${block.title}</h3>
                        <p class="text-white-50 small mb-0">${block.subtitle}</p>
                      </div>
                      <div class="card-body p-4 bg-white text-start">
                        <form>
                          <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">${block.nameLabel}</label>
                            <input type="text" name="name" class="form-control" placeholder="Alex Mercer" required />
                          </div>
                          <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">${block.emailLabel}</label>
                            <input type="email" name="email" class="form-control" placeholder="alex@mercer.com" required />
                          </div>
                          <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">${block.passwordLabel}</label>
                            <input type="password" name="password" class="form-control" placeholder="••••••••" required />
                          </div>
                          <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">${block.passwordConfirmLabel}</label>
                            <input type="password" name="password_confirmation" class="form-control" placeholder="••••••••" required />
                          </div>
                          <button type="submit" class="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm mb-3">
                            ${block.buttonText}
                          </button>
                          <div class="text-center">
                            <a href="#" class="small text-decoration-none text-muted" onclick="event.preventDefault(); alert('Navigation simulation: Login page');">${block.loginLinkText}</a>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'dashboard': {
          inner = `
            <section class="py-5 bg-light text-start" id="dashboard-${block.id}">
              <div class="container py-4">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                  <div>
                    <span class="badge bg-primary text-uppercase px-2.5 py-1 text-[10px] fw-bold">Live Portal Environment</span>
                    <h2 class="fw-bold mt-1 mb-0">${block.title}</h2>
                    <p class="text-secondary small mb-0">${block.subtitle}</p>
                  </div>
                  <div class="d-flex align-items-center bg-white border p-2 rounded-3 shadow-sm align-self-start">
                    <div class="bg-primary bg-opacity-10 p-2 rounded-2 me-2 text-primary">
                       <i class="bi bi-person-fill"></i>
                    </div>
                    <div class="text-start">
                      <div class="fw-bold text-[11px] mb-0 text-dark">${block.userName}</div>
                      <span class="text-[9px] text-uppercase text-secondary fw-semibold">${block.userRole}</span>
                    </div>
                  </div>
                </div>

                <div class="row g-3 mb-4 text-start">
                  ${block.stats.map(st => `
                    <div class="col-md-4">
                      <div class="card border-0 shadow-sm p-3.5 bg-white rounded-3 h-100">
                        <div class="d-flex justify-content-between align-items-start">
                          <div>
                            <span class="text-secondary text-[11px] uppercase tracking-wider font-semibold">${st.label}</span>
                            <h3 class="fw-black text-dark mt-1.5 mb-1">${st.value}</h3>
                            <span class="text-success small fw-semibold"><i class="bi bi-arrow-up-right"></i> ${st.trend}</span>
                          </div>
                          <div class="bg-primary bg-opacity-10 text-primary p-2 px-3 fs-4 rounded-3 d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                            <i class="bi ${getBootstrapIconClass(st.icon)}"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>

                <div class="card border-0 shadow-sm p-4 bg-white rounded-3 hover-border text-start">
                  <h5 class="fw-bold mb-3 text-dark"><i class="bi bi-rocket-takeoff text-primary me-2"></i> Quick Administrative Operations</h5>
                  <div class="d-flex flex-wrap gap-2">
                    ${block.quickActions.map(act => `
                      <a href="${act.url}" class="btn btn-outline-dark d-flex align-items-center gap-2 px-3.5 py-2 text-[12px] rounded-pill font-medium" onclick="event.preventDefault(); alert('Active route simulated: ${act.label}');">
                        <i class="bi ${getBootstrapIconClass(act.icon)} text-primary"></i> ${act.label}
                      </a>
                    `).join('')}
                  </div>
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'form_custom': {
          inner = `
            <section class="py-5 bg-light" id="form_custom-${block.id}">
              <div class="container py-4">
                <div class="row justify-content-center">
                  <div class="col-lg-8">
                    <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white text-start">
                      <h2 class="fw-bold text-dark text-center mb-2">${block.title}</h2>
                      <p class="text-secondary text-center small mb-4 mx-auto col-md-10">${block.subtitle}</p>
                      
                      <form class="custom-entity-form">
                        <div class="row g-3">
                          ${block.fields.map(fd => `
                            <div class="col-12 col-md-${fd.type === 'textarea' ? '12' : '6'}">
                              <label class="form-label small fw-bold text-secondary mb-1">${fd.label} ${fd.required ? '<span class="text-danger">*</span>' : ''}</label>
                              ${fd.type === 'textarea' ? `
                                <textarea name="${fd.name}" class="form-control" rows="3" placeholder="${fd.placeholder || ''}" ${fd.required ? 'required' : ''}></textarea>
                              ` : `
                                <input type="${fd.type}" name="${fd.name}" class="form-control" placeholder="${fd.placeholder || ''}" ${fd.required ? 'required' : ''} />
                              `}
                            </div>
                          `).join('')}
                        </div>
                        <button type="submit" class="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm mt-4">
                          <i class="bi bi-file-earmark-plus me-1"></i> ${block.buttonText}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'table_custom': {
          let rows: Array<Record<string, any>> = [];
          
          let tableHeaders: string[] = ['ID', 'Name / Value', 'Operational Status', 'Created At'];
          let keysToShow: string[] = [];

          const bindModelId = block.bindToCustomModelId;
          const matchedModel = config.customDbModels?.find(m => m.id === bindModelId) || config.customDbModels?.[0];
          
          if (matchedModel) {
            rows = matchedModel.records;
            tableHeaders = ['Row Hash ID', ...matchedModel.fields.map(f => f.name), 'Created At'];
            keysToShow = matchedModel.fields.map(f => f.name);
          } else {
            // Default simulated table records
            rows = [
              { id: 'row-821', contact_name: 'Alex Grayson', email_address: 'alex@grayson.io', created_at: '2026-06-16T12:00:00Z' },
              { id: 'row-192', contact_name: 'Evelyn Frost', email_address: 'evelyn@frost.io', created_at: '2026-06-15T09:30:00Z' }
            ];
            tableHeaders = ['Row Hash ID', 'Intake Name', 'Email Account', 'Seeded At'];
            keysToShow = ['contact_name', 'email_address'];
          }

          inner = `
            <section class="py-5 bg-body-tertiary" id="table_custom-${block.id}">
              <div class="container py-4 text-start">
                <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                  <div class="p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
                    <div>
                      <h4 class="fw-bold text-dark mb-1">${block.title}</h4>
                      <p class="text-secondary small mb-0">${block.subtitle}</p>
                    </div>
                    <span class="badge bg-primary text-uppercase px-2 px-md-3 py-1.5 rounded-pill text-[10px] fw-bold">
                      <i class="bi bi-hdd-network-fill me-1"></i> MySQL/SQLite Seed Table
                    </span>
                  </div>
                  <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0 text-start">
                      <thead class="table-secondary py-3 text-[11px] text-secondary text-uppercase tracking-wider">
                        <tr>
                          ${tableHeaders.map(th => `<th>${th}</th>`).join('')}
                        </tr>
                      </thead>
                      <tbody>
                        ${rows.length === 0 ? `
                          <tr>
                            <td colspan="${tableHeaders.length}" class="text-center py-5 text-secondary">
                              <i class="bi bi-database opacity-50 display-6 d-block mb-2"></i>
                              No entries found. Input and submit the custom form block above to insert simulated Eloquent records.
                            </td>
                          </tr>
                        ` : rows.map(r => `
                          <tr class="font-mono text-[12px] text-dark">
                            <td class="fw-bold text-primary">${r.id || 'rec'}</td>
                            ${keysToShow.map(k => `<td>${r[k] !== undefined ? r[k] : 'N/A'}</td>`).join('')}
                            <td class="small text-secondary">${r.created_at ? new Date(r.created_at).toLocaleString() : 'Just Now'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          `;
          break;
        }
        case 'footer': {
          inner = `
            <footer class="py-5 bg-dark text-white border-top">
              <div class="container py-3">
                <div class="row g-4 align-items-center justify-content-between">
                  <div class="col-md-5">
                    <h5 class="fw-bold text-white mb-3"><i class="bi bi-cpu text-primary me-2"></i> ${config.projectName}</h5>
                    <p class="text-secondary small mb-0">${block.text}</p>
                  </div>
                  <div class="col-md-4 text-md-end text-start">
                    <h6 class="fw-bold text-white mb-2">Connect Digitally</h6>
                    <div class="d-flex justify-content-md-end gap-3 mb-3">
                      ${block.socials.map(soc => `
                        <a href="${soc.url}" class="text-white text-decoration-none bg-secondary bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;">
                          <i class="bi bi-${soc.platform.toLowerCase() === 'twitter' ? 'twitter-x' : soc.platform.toLowerCase()}"></i>
                        </a>
                      `).join('')}
                    </div>
                  </div>
                </div>
                <div class="border-top border-secondary mt-4 pt-4 text-center">
                  <p class="text-secondary small mb-0">${block.copyright}</p>
                </div>
              </div>
            </footer>
          `;
          break;
        }
      }

      htmlContent += `${wrapperStart}${inner}${wrapperEnd}`;
    });

    const docSource = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visual Preview - LaraBoot Builder</title>
        
        <!-- Load robust external Bootstrap 5 CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <!-- Load interactive Bootstrap Icons -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
        
        <!-- Color definitions mapping -->
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;500;600;700&display=swap');

          :root {
            --bs-primary: ${config.colorPalette.primary};
            --bs-secondary: ${config.colorPalette.secondary};
            --bs-primary-rgb: ${hexToRgb(config.colorPalette.primary)};
            --bs-secondary-rgb: ${hexToRgb(config.colorPalette.secondary)};
            --cms-dark: ${config.colorPalette.dark};
            --cms-light: ${config.colorPalette.light};
          }
          body {
            font-family: '${config.colorPalette.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--cms-light);
            color: var(--cms-dark);
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
          .gradient-banner {
            background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-secondary) 100%);
            color: white;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          /* Interactivity helpers */
          .cms-block-wrapper:hover {
            border: 3px dashed var(--bs-primary) !important;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        
        <script>
          // Enable click delegation to notify the parent builder UI of selected block edits
          document.body.addEventListener('click', function(e) {
            // If click inside input or form fields, do not select block
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'A') {
              return;
            }
            const wrapper = e.target.closest('.cms-block-wrapper');
            if (wrapper) {
              const blockId = wrapper.getAttribute('data-id');
              window.parent.postMessage({ type: 'BLOCK_SELECTED', id: blockId }, '*');
            }
          });

          // Intercept mock custom forms submissions
          document.addEventListener('submit', function(e) {
            e.preventDefault();
            const form = e.target;
            const blockWrapper = form.closest('.cms-block-wrapper');
            const blockId = blockWrapper ? blockWrapper.getAttribute('data-id') : null;
            
            // Extract attributes
            const formData = new FormData(form);
            const data = {};
            for (const [key, val] of formData.entries()) {
              data[key] = val;
            }
            
            window.parent.postMessage({
              type: 'FORM_SUBMITTED',
              blockId: blockId,
              formData: data
            }, '*');
          });
        </script>
      </body>
      </html>
    `;

    iframe.srcdoc = docSource;
  }, [config, selectedBlockId, activePage]);

  // Set up listener for messages originating inside the custom Iframe trigger
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'BLOCK_SELECTED') {
        onSelectBlock(e.data.id);
      } else if (e.data.type === 'FORM_SUBMITTED') {
        const bId = e.data.blockId;
        const subData = e.data.formData;
        
        let updatedModels = [...(config.customDbModels || [])];
        const block = config.pages.flatMap(p => p.blocks).find(b => b.id === bId);
        let modelId = block && 'bindToCustomModelId' in block ? (block as any).bindToCustomModelId : null;
        
        if (!modelId) {
          if (updatedModels.length > 0) {
            modelId = updatedModels[0].id;
          } else {
            // Bootstrap a default model
            modelId = 'model-leads';
            updatedModels = [{
              id: 'model-leads',
              tableName: 'contact_submissions',
              modelName: 'ContactSubmission',
              fields: [
                { name: 'contact_name', type: 'string', nullable: false },
                { name: 'email_address', type: 'string', nullable: false }
              ],
              records: []
            }];
          }
        }
        
        const targetModelIndex = updatedModels.findIndex(m => m.id === modelId);
        if (targetModelIndex !== -1) {
          const m = { ...updatedModels[targetModelIndex] };
          const rec = { id: `rec-${Math.floor(Math.random() * 1000)}`, ...subData, created_at: new Date().toISOString() };
          m.records = [rec, ...m.records];
          updatedModels[targetModelIndex] = m;
          
          onChangeConfig({
            ...config,
            customDbModels: updatedModels
          });
          
          alert(`🎉 Form Submit Success!\n\nInserted new database record into table "${m.tableName}" (Model: App\\Models\\${m.modelName}):\n${JSON.stringify(subData, null, 2)}\n\nClick the 'CMS Database' tab in the top bar to inspect your visual columns live!`);
        } else {
          // If the model was not found but we have form input, alert anyway
          alert(`🎉 Form Submission Simulated Successfully!\n${JSON.stringify(subData)}`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectBlock, config, onChangeConfig]);

  // Map responsive screen layout values
  const viewportStyles = {
    desktop: 'w-full h-full max-w-full',
    tablet: 'w-[768px] h-[90%] max-w-full border-x-4 border-slate-700 shadow-2xl rounded-xl',
    mobile: 'w-[375px] h-[82%] max-w-full border-x-8 border-t-8 border-b-12 border-slate-800 shadow-2xl rounded-[36px]'
  };

  return (
    <div className="flex-1 bg-slate-900/60 p-4 lg:p-8 flex items-center justify-center overflow-hidden min-h-[440px] relative">
      <div className="absolute top-4 left-6 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
        <span className="text-xs font-mono text-slate-400 font-medium tracking-wide">
          BOOTSTRAP 5 LIVE SCOPED VIEWPORT - {config.projectName}
        </span>
      </div>

      <div className={`transition-all duration-300 ease-out bg-white overflow-hidden flex flex-col relative ${viewportStyles[viewportWidth]}`}>
        {/* Mock top phone/browser bar */}
        {viewportWidth !== 'desktop' && (
          <div className="bg-slate-800 text-slate-400 py-1 px-4 text-[10px] font-mono flex justify-between items-center select-none border-b border-slate-750">
            <span className="font-semibold text-slate-300">9:41 AM</span>
            <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto hidden sm:block"></div>
            <div className="flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>100% LaraSSL</span>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          className="w-full flex-1 border-0"
          title="Sandbox page workspace preview"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
