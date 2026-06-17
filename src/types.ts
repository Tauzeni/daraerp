export type BlockType = 
  | 'navbar'
  | 'hero'
  | 'features'
  | 'stats'
  | 'pricing'
  | 'blog'
  | 'testimonials'
  | 'gallery'
  | 'contact'
  | 'footer'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'form_custom'
  | 'table_custom';

export interface BaseBlock {
  id: string;
  type: BlockType;
  visible: boolean;
}

export interface NavbarBlock extends BaseBlock {
  type: 'navbar';
  brand: string;
  links: Array<{ label: string; url: string }>;
  ctaText: string;
  ctaLink: string;
  sticky: boolean;
  themeStyle: 'light' | 'dark' | 'primary';
}

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  layout: 'center' | 'left-split' | 'right-split';
  imageUrl: string;
  bgPattern: 'default' | 'gradient' | 'glass' | 'toned-down';
}

export interface FeatureItem {
  id: string;
  icon: string; // lucide icon name
  title: string;
  description: string;
}

export interface FeaturesBlock extends BaseBlock {
  type: 'features';
  title: string;
  subtitle: string;
  columns: 3 | 4 | 2;
  items: FeatureItem[];
}

export interface StatItem {
  id: string;
  number: string;
  label: string;
}

export interface StatsBlock extends BaseBlock {
  type: 'stats';
  title: string;
  subtitle: string;
  items: StatItem[];
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  billing: string;
  features: string[];
  ctaText: string;
  featured: boolean;
}

export interface PricingBlock extends BaseBlock {
  type: 'pricing';
  title: string;
  subtitle: string;
  tiers: PricingTier[];
}

export interface TestimonialItem {
  id: string;
  text: string;
  author: string;
  role: string;
  stars: number;
}

export interface TestimonialsBlock extends BaseBlock {
  type: 'testimonials';
  title: string;
  subtitle: string;
  items: TestimonialItem[];
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery';
  title: string;
  subtitle: string;
  columns: 3 | 4;
  items: GalleryItem[];
}

export interface ContactBlock extends BaseBlock {
  type: 'contact';
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  showMap: boolean;
  buttonText: string;
}

export interface FooterBlock extends BaseBlock {
  type: 'footer';
  text: string;
  copyright: string;
  socials: Array<{ platform: string; url: string }>;
}

export interface BlogBlock extends BaseBlock {
  type: 'blog';
  title: string;
  subtitle: string;
  bindToModel: boolean; // if true, it dynamically renders mock DB articles
  staticPosts: Array<{ id: string; title: string; category: string; description: string; date: string; author: string }>;
}

export interface LoginBlock extends BaseBlock {
  type: 'login';
  title: string;
  subtitle: string;
  emailLabel: string;
  passwordLabel: string;
  rememberMeLabel: string;
  buttonText: string;
  registrationLinkText: string;
  forgotPasswordLinkText: string;
  destinationUrl: string;
}

export interface RegisterBlock extends BaseBlock {
  type: 'register';
  title: string;
  subtitle: string;
  nameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  passwordConfirmLabel: string;
  buttonText: string;
  loginLinkText: string;
  destinationUrl: string;
}

export interface DashboardBlock extends BaseBlock {
  type: 'dashboard';
  title: string;
  subtitle: string;
  userName: string;
  userRole: string;
  stats: Array<{ label: string; value: string; trend: string; icon: string }>;
  quickActions: Array<{ label: string; url: string; icon: string }>;
}

export interface FormCustomField {
  label: string;
  name: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'checkbox' | 'password';
  placeholder?: string;
  required: boolean;
}

export interface FormCustomBlock extends BaseBlock {
  type: 'form_custom';
  title: string;
  subtitle: string;
  bindToCustomModelId?: string;
  fields: FormCustomField[];
  buttonText: string;
}

export interface TableCustomBlock extends BaseBlock {
  type: 'table_custom';
  title: string;
  subtitle: string;
  bindToCustomModelId?: string;
}

export interface CustomDbField {
  name: string;
  type: 'string' | 'integer' | 'text' | 'boolean' | 'decimal';
  nullable: boolean;
}

export interface CustomDbModel {
  id: string;
  tableName: string;
  modelName: string;
  fields: CustomDbField[];
  records: Array<Record<string, any>>;
}

export type Block = 
  | NavbarBlock 
  | HeroBlock 
  | FeaturesBlock 
  | StatsBlock 
  | PricingBlock 
  | TestimonialsBlock 
  | GalleryBlock 
  | ContactBlock 
  | FooterBlock
  | BlogBlock
  | LoginBlock
  | RegisterBlock
  | DashboardBlock
  | FormCustomBlock
  | TableCustomBlock;

export interface Page {
  id: string;
  title: string;
  slug: string;
  blocks: Block[];
}

// Global Theme Customization
export interface ColorPalette {
  id: string;
  name: string;
  primary: string; // e.g. #3b82f6 (mapped to bootstrap custom root)
  secondary: string;
  dark: string;
  light: string;
  fontFamily: 'Inter' | 'Outfit' | 'Playfair' | 'Space Grotesk' | 'Fira Code';
}

// Mock Content Database schemas for Laravel dynamic bindings
export interface DynamicBlogModel {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  author: string;
  imageUrl: string;
  createdAt: string;
}

export interface DynamicProductModel {
  id: string;
  name: string;
  slug: string;
  price: string;
  description: string;
  imageUrl: string;
  inStock: boolean;
}

export type ExporterPlatform = 'laravel' | 'dotnet';
export type BladeTemplateStyle = 'landing' | 'admin_dashboard' | 'business_portal' | 'laravel_breeze' | 'laravel_ui';

export interface MenuSubmodule {
  id: string;
  name: string;
  slug: string;
  url: string;
  icon: string;
  permission: string;
  order: number;
}

export interface MenuModule {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  submodules: MenuSubmodule[];
}

export interface SpatieRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // List of permission names
}

export interface SpatiePermission {
  id: string;
  name: string;
  module: string; // e.g. 'blog_posts', 'products', 'pages', etc.
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  description?: string;
}

export interface WebDesignConfig {
  projectName: string;
  activePageId: string;
  colorPalette: ColorPalette;
  pages: Page[];
  blogModels: DynamicBlogModel[];
  productModels: DynamicProductModel[];
  laravelVersion: 'v11.x' | 'v10.x';
  dbDriver: 'mysql' | 'sqlite' | 'pgsql';
  dbHost?: string;
  dbPort?: string;
  dbDatabase?: string;
  dbUsername?: string;
  dbPassword?: string;
  exportPlatform?: ExporterPlatform;
  // Dynamic Architecture Features
  bladeTemplateStyle: BladeTemplateStyle;
  enableSpatiePermissions: boolean;
  enableAuditTrail: boolean;
  enableDynamicMenu: boolean;
  modules: MenuModule[];
  spatieRoles?: SpatieRole[];
  spatiePermissions?: SpatiePermission[];
  customDbModels?: CustomDbModel[];
}
