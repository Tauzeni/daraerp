import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialize Gemini API client to prevent crash if key is missing on start
let _ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    _ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return _ai;
}

// Fallback helper to protect against transient 503 high demand or limit issues
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  const fallbackModels = ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
  let lastError: any = null;

  for (const model of fallbackModels) {
    try {
      console.log(`[AI fallback] Attempting Gemini content generation with candidate: ${model}`);
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`[AI fallback] Model selection ${model} failed:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All active Gemini models failed or currently experiencing high demand.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes: AI Layout Generator with Extended Block Types & Dynamic DB modeling
  app.post("/api/ai/generate-layout", async (req, res) => {
    try {
      const { prompt, pageTitle } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      const client = getGeminiClient();
      const systemInstruction = `
You are an expert bootstrap 5 and laravel blade designer.
Based on the user's describing goal, map out a beautiful and complete page design block configuration!

You can choose 3 to 7 logical blocks from this complete list of supported block types: 
'navbar', 'hero', 'features', 'stats', 'pricing', 'blog', 'testimonials', 'gallery', 'contact', 'footer', 'login', 'register', 'dashboard', 'form_custom', 'table_custom'.

Return the output as a single JSON object matching this structure exactly:
{
  "layout": [ ...array of block objects... ],
  "suggestedDbModel": null | {
    "tableName": "snake_case_table_name",
    "modelName": "StudlyCaseModelName",
    "fields": [
      { "name": "field_name_in_snake_case", "type": "string"|"integer"|"text"|"boolean"|"decimal", "nullable": boolean }
    ]
  }
}

Type definitions for block objects to strictly match:
1. NavbarBlock: { id: "nav-...", type: "navbar", brand: string, ctaText: string, ctaLink: string, sticky: boolean, links: [{label, url}] }
2. HeroBlock: { id: "hero-...", type: "hero", title: string, subtitle: string, ctaText: string, ctaLink: string, secondaryCtaText: string, secondaryCtaLink: string, layout: "center"|"left-split"|"right-split", imageUrl: string, bgPattern: "default"|"gradient"|"glass"|"toned-down" }
3. FeaturesBlock: { id: "feat-...", type: "features", title: string, subtitle: string, columns: 3, items: [{id, icon: "lucide-icon-name", title, description}] }
   Note: Choose typical Lucide icon strings like: Sparkles, Database, Shield, Zap, Box, ShoppingCart, Users, Heart, Star, Globe, TrendingUp.
4. StatsBlock: { id: "stat-...", type: "stats", title: string, subtitle: string, items: [{id, number, label}] }
5. PricingBlock: { id: "price-...", type: "pricing", title: string, subtitle: string, tiers: [{id, name, price, billing, features: string[], ctaText: string, featured: boolean}] }
6. BlogBlock: { id: "blog-...", type: "blog", title: string, subtitle: string, bindToModel: boolean, staticPosts: [] }
7. TestimonialsBlock: { id: "test-...", type: "testimonials", title: string, subtitle: string, items: [{id, text, author, role, stars: 5}] }
8. GalleryBlock: { id: "gal-...", type: "gallery", title: string, subtitle: string, columns: 3, items: [{id, imageUrl, title, description}] }
9. ContactBlock: { id: "con-...", type: "contact", title: string, subtitle: string, email, phone, address, showMap: true, buttonText }
10. FooterBlock: { id: "foot-...", type: "footer", text, copyright, socials: [{platform: "Twitter"|"GitHub"|"LinkedIn", url}] }
11. LoginBlock: { id: "login-...", type: "login", title: string, subtitle: string, emailLabel: string, passwordLabel: string, rememberMeLabel: string, buttonText: string, registrationLinkText: string, forgotPasswordLinkText: string, destinationUrl: string }
12. RegisterBlock: { id: "reg-...", type: "register", title: string, subtitle: string, nameLabel: string, emailLabel: string, passwordLabel: string, passwordConfirmLabel: string, buttonText: string, loginLinkText: string, destinationUrl: string }
13. DashboardBlock: { id: "dash-...", type: "dashboard", title: string, subtitle: string, userName: string, userRole: string, stats: [{id, label, value, trend, icon: string}], quickActions: [{id, label, url, icon: string}] }
14. FormCustomBlock: { id: "form_custom-...", type: "form_custom", title: string, subtitle: string, fields: [{label, name, type: "text"|"email"|"password"|"number"|"textarea"|"checkbox", placeholder: string, required: boolean}], buttonText: string, bindToCustomModelId?: string }
15. TableCustomBlock: { id: "table_custom-...", type: "table_custom", title: string, subtitle: string, bindToCustomModelId?: string }

- If the page designed requires or fits a custom database entity (e.g. employee details intake, survey submit form, issue tracker, client lead tracker, etc.), you MUST choose 'form_custom' and 'table_custom' blocks, generate a 'suggestedDbModel' object with matching fields, and associate both blocks' 'bindToCustomModelId' field to an identifier like "model-custom-123". Ensure the 'id' of 'suggestedDbModel' is also "model-custom-123".
- If a typical login page or register page is requested, select 'login' or 'register' block types along with 'navbar' and 'footer'.
- Ensure the copy (titles, text, description, email, address, links etc.) is fully filled, custom-tailored, copy-focused, highly professional, and creative. Avoid placeholders.
- Always include a 'navbar' as the first block and 'footer' as the last block.
`;

      const response = await generateContentWithFallback({
        contents: `Create and synthesize a custom professional page named: "${pageTitle}" for: "${prompt}". Root website name represents: "${pageTitle || 'Core Web'}".`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.85
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response output received from Gemini API");
      }

      const parsedResult = JSON.parse(responseText.trim());
      res.json({ 
        success: true, 
        layout: parsedResult.layout, 
        suggestedDbModel: parsedResult.suggestedDbModel || null 
      });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to interact with Gemini API" });
    }
  });

  // API Routes: Inline AI Copywriter
  app.post("/api/ai/rewrite", async (req, res) => {
    try {
      const { blockType, currentField, originalText, tone } = req.body;
      if (!originalText) {
        res.status(400).json({ error: "Original text is required" });
        return;
      }

      const client = getGeminiClient();
      const prompt = `
Context: Standard website block type is "${blockType}". Editing field "${currentField}".
Original text value of this field: "${originalText}".
Requested rewrite style/tone: "${tone || 'highly appealing professional marketing copy'}".

Re-draft and return excellent, high-converting visual copywriting.
Keep the text proportional in length to original text. Do not use markdown quotes. Only return the final rewritten plain text string.
`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          temperature: 0.9,
        }
      });

      const rewrittenText = response.text ? response.text.trim() : originalText;
      res.json({ success: true, rewrittenText });
    } catch (error: any) {
      console.error("AI Style Rewrite Error:", error);
      res.status(500).json({ error: error.message || "Failed to rewrite copy using Gemini API" });
    }
  });

  // API Routes: AI Color Palette Synthesizer
  app.post("/api/ai/generate-palette", async (req, res) => {
    try {
      const { description } = req.body;
      if (!description) {
        res.status(400).json({ error: "Palette description is required" });
        return;
      }

      const client = getGeminiClient();
      const systemInstruction = `
You are an expert user interface visual designer.
Synthesize a high-fidelity visual design palette representing the requested visual theme style description.
Provide five parameters: name, primary, secondary, dark, and light hex codes, and choose a highly fitting Google Font from this strict list:
'Inter', 'Space Grotesk', 'Outfit', 'Playfair Display', 'Fira Code'.

Return output as a single JSON object matching this schema:
{
  "name": "Bespoke short creative palette name",
  "primary": "#HEX",
  "secondary": "#HEX",
  "dark": "#HEX (typically rich off-dark/charcoal/midnight)",
  "light": "#HEX (typically soft clean cream, ice, paper, light-slate)",
  "fontFamily": "Inter" | "Space Grotesk" | "Outfit" | "Playfair Display" | "Fira Code"
}
`;

      const response = await generateContentWithFallback({
        contents: `Synthesize an elegant, professional visual color theme matching the style description: "${description}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.8
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No layout response from Gemini");
      }

      const parsedResult = JSON.parse(responseText.trim());
      res.json({ success: true, palette: parsedResult });
    } catch (error: any) {
      console.error("AI Palette Synthesis Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate theme colors" });
    }
  });

  // API Routes: Dynamic Database Seeder Agent
  app.post("/api/ai/generate-seeds", async (req, res) => {
    try {
      const { tableName, modelName, fields } = req.body;
      if (!tableName || !Array.isArray(fields)) {
        res.status(400).json({ error: "Table name and fields are required for database seeding" });
        return;
      }

      const client = getGeminiClient();
      const systemInstruction = `
You are an expert relational database systems analyst.
Generate 5 high-quality, fully populated, descriptive database records matching the provided MySQL/Laravel database table schema.
These records must be professional, varied, fully fleshed out, and directly context-fit the table context. Do NOT use fake placeholder content like "Lorem ipsum".

Return the output as a single JSON object containing a "records" array:
{
  "records": [
    {
      "id": "rec-123",
      // ...all fields schema populated with values matching their types...
    },
    ...
  ]
}

Available custom columns to populate values for:
${JSON.stringify(fields)}

Note:
1. Ensure types match (e.g., numbers for fields of type "integer" or "decimal", strings/long strings for "text", booleans for "boolean" type).
2. Generate a random and unique ID string with prefix "rec-" for each item.
`;

      const response = await generateContentWithFallback({
        contents: `Seed table: "${tableName}" (Eloquent Model: ${modelName || 'CustomRecord'}) with 5 highly cohesive, professional records.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.9
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No database rows returned from Gemini API");
      }

      const parsedResult = JSON.parse(responseText.trim());
      res.json({ success: true, records: parsedResult.records || [] });
    } catch (error: any) {
      console.error("AI Seeding Error:", error);
      res.status(550).json({ error: error.message || "Failed to synthesize seed data" });
    }
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: new Date() });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to boot full-stack server:", err);
});
