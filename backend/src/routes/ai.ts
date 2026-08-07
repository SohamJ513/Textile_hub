import express from 'express';
import Product from '../models/Product';

const router = express.Router();

// ==================== INTENT DETECTION ====================
const detectIntent = (message: string): { type: string; entities: any } => {
  const msg = message.toLowerCase();
  const entities: any = {};

  // Detect budget
  const budgetMatch = msg.match(/(?:under|below|less than)\s*\$?(\d+)/);
  if (budgetMatch) {
    entities.maxPrice = parseInt(budgetMatch[1]);
  }

  const minBudgetMatch = msg.match(/(?:over|above|more than)\s*\$?(\d+)/);
  if (minBudgetMatch) {
    entities.minPrice = parseInt(minBudgetMatch[1]);
  }

  const rangeMatch = msg.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
  if (rangeMatch) {
    entities.minPrice = parseInt(rangeMatch[1]);
    entities.maxPrice = parseInt(rangeMatch[2]);
  }

  // Detect fabric types
  const fabrics = ['cotton', 'silk', 'linen', 'wool', 'denim', 'satin', 'velvet', 'jute', 'polyester', 'nylon'];
  entities.fabrics = fabrics.filter(f => msg.includes(f));

  // Detect colors
  const colors = ['white', 'black', 'blue', 'red', 'green', 'gold', 'silver', 'burgundy', 'navy'];
  entities.colors = colors.filter(c => msg.includes(c));

  // Detect intent type
  let type = 'question';
  if (entities.fabrics.length > 0 || entities.colors.length > 0) {
    type = 'search';
  }
  if (msg.includes('compare') || msg.includes('versus') || msg.includes('vs')) {
    type = 'compare';
  }
  if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('best')) {
    type = 'recommend';
  }
  if (msg.includes('price') || msg.includes('cost') || msg.includes('budget')) {
    type = 'pricing';
  }
  if (msg.includes('stock') || msg.includes('available') || msg.includes('in stock')) {
    type = 'availability';
  }

  return { type, entities };
};

// ==================== CHAT WITH GROQ (REST API) ====================
router.post('/chat', async (req: express.Request, res: express.Response) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ No Groq API key found, using fallback');
      return handleFallback(message, res);
    }

    console.log('📡 Groq API Key prefix:', apiKey.substring(0, 5) + '...');
    console.log('📡 Groq API Key length:', apiKey.length);

    const intent = detectIntent(message);
    console.log('Intent detected:', intent);

    // Build search filter
    const filter: any = { isActive: true };
    
    if (intent.entities.fabrics && intent.entities.fabrics.length > 0) {
      filter.fabricType = { $in: intent.entities.fabrics.map((f: string) => new RegExp(f, 'i')) };
    }
    
    if (intent.entities.colors && intent.entities.colors.length > 0) {
      filter.colors = { $in: intent.entities.colors.map((c: string) => new RegExp(c, 'i')) };
    }

    if (intent.entities.maxPrice) {
      filter.price = { ...filter.price, $lte: intent.entities.maxPrice };
    }
    
    if (intent.entities.minPrice) {
      filter.price = { ...filter.price, $gte: intent.entities.minPrice };
    }

    // Search products
    let products: any[] = await Product.find(filter)
      .limit(10)
      .select('name price category description images stock colors')
      .lean();

    if (products.length === 0) {
      const keywords = message.toLowerCase().split(' ');
      const keywordFilter: any = {
        isActive: true,
        $or: [
          { name: { $regex: keywords.join('|'), $options: 'i' } },
          { description: { $regex: keywords.join('|'), $options: 'i' } },
          { category: { $regex: keywords.join('|'), $options: 'i' } }
        ]
      };
      products = await Product.find(keywordFilter)
        .limit(5)
        .select('name price category description images stock')
        .lean();
    }

    // Build product context
    let productContext = '';
    if (products.length > 0) {
      productContext = `\n\nAvailable products in our marketplace:\n${products.map((p: any) => 
        `- ${p.name}: $${p.price} (${p.category}) - Stock: ${p.stock} units`
      ).join('\n')}`;
    }

    // Build system prompt
    const systemPrompt = `You are an AI assistant for TextileHub, a B2B textile marketplace.

User Intent: ${intent.type}
Detected filters: ${JSON.stringify(intent.entities)}

Guidelines:
1. Be helpful, friendly, and professional
2. If the user is searching for products, recommend specific items from our inventory
3. If the user has a budget, only recommend products within their budget
4. If products are out of stock, mention that
5. Ask clarifying questions if the search is too broad
6. Keep responses concise but informative (2-3 sentences per recommendation)
7. If the user is comparing products, highlight differences in price, material, and features

${productContext || 'No products match the search criteria. Suggest general fabric categories or ask for more details.'}

${intent.type === 'compare' ? '\nThe user wants to compare products. Highlight differences in price, material, and features.' : ''}
${intent.type === 'recommend' ? '\nThe user wants recommendations. Suggest the best options based on their needs.' : ''}
${intent.type === 'pricing' ? '\nThe user is asking about prices. Provide clear pricing information.' : ''}
${intent.type === 'availability' ? '\nThe user is asking about stock availability. Check and inform about stock status.' : ''}`;

    console.log('📡 Sending request to Groq API (REST)...');

    // FIX: Use REST API with the correct headers
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.95,
      }),
    });

    // FIX: Use type assertion to handle unknown type
    const data: any = await response.json();

    if (!response.ok) {
      console.error('❌ Groq API error:', data.error || data);
      return handleFallback(message, res);
    }

    const responseText = data.choices?.[0]?.message?.content || 
                        "I'm sorry, I couldn't generate a response.";

    console.log('✅ Groq response received');

    res.json({
      success: true,
      response: responseText,
      products: products || [],
      intent: intent.type,
      entities: intent.entities,
      count: products.length,
      suggestions: products.length > 0 
        ? products.map((p: any) => ({ name: p.name, id: p._id })) 
        : [{ name: "Show cotton fabrics", id: "" }, { name: "Show silk fabrics", id: "" }]
    });

  } catch (error: any) {
    console.error('❌ Groq error:', error.message);
    const { message } = req.body;
    handleFallback(message, res);
  }
});

// ==================== FALLBACK RESPONSE ====================
const handleFallback = async (message: string, res: express.Response) => {
  const intent = detectIntent(message);
  let response = "I can help you find the perfect fabric. What are you looking for today?";
  
  const msg = message?.toLowerCase() || '';
  
  if (intent.type === 'search' && intent.entities.fabrics.length > 0) {
    response = `I found some ${intent.entities.fabrics.join(', ')} fabrics for you! Let me show you what we have.`;
  } else if (intent.type === 'pricing') {
    response = "Our products range from budget-friendly to premium. What's your budget range?";
  } else if (intent.type === 'recommend') {
    response = "Based on your needs, I recommend checking our cotton and silk collections.";
  } else if (intent.type === 'compare') {
    response = "I can help you compare products. Which fabrics would you like to compare?";
  } else if (msg.includes('cotton')) {
    response = "We have a great selection of cotton fabrics. Would you like to see cotton products?";
  } else if (msg.includes('silk')) {
    response = "Our silk collection includes premium quality options. Would you like to browse them?";
  } else if (msg.includes('price')) {
    response = "Our products range from budget-friendly to premium. What's your budget range?";
  } else if (msg.includes('summer')) {
    response = "For summer, we recommend lightweight fabrics like cotton, linen, and silk blends.";
  } else if (msg.includes('winter')) {
    response = "For winter, we recommend wool, velvet, and heavier cotton blends.";
  } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    response = "Hello! I can help you find the perfect fabric. What are you looking for today?";
  } else if (msg.includes('thank')) {
    response = "You're welcome! Is there anything else I can help you with?";
  }
  
  try {
    const keywords = message?.toLowerCase().split(' ') || [];
    const products: any[] = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: keywords.join('|'), $options: 'i' } },
        { category: { $regex: keywords.join('|'), $options: 'i' } },
        { fabricType: { $regex: keywords.join('|'), $options: 'i' } }
      ]
    }).limit(5).lean();

    const suggestions = products.length > 0 
      ? products.map((p: any) => ({ name: p.name, id: p._id })) 
      : [{ name: "Show cotton fabrics", id: "" }, { name: "Show silk fabrics", id: "" }];

    res.json({
      success: true,
      response,
      products: products || [],
      intent: intent.type,
      entities: intent.entities,
      count: products.length,
      suggestions,
      fallback: true,
    });
  } catch (error) {
    res.json({
      success: true,
      response,
      products: [],
      intent: intent.type,
      entities: intent.entities,
      count: 0,
      suggestions: [{ name: "Show cotton fabrics", id: "" }, { name: "Show silk fabrics", id: "" }],
      fallback: true,
    });
  }
};

// ==================== SMART SEARCH ====================
router.post('/search', async (req: express.Request, res: express.Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const intent = detectIntent(query);
    const filter: any = { isActive: true };
    
    if (intent.entities.fabrics && intent.entities.fabrics.length > 0) {
      filter.fabricType = { $in: intent.entities.fabrics.map((f: string) => new RegExp(f, 'i')) };
    }
    
    if (intent.entities.maxPrice) {
      filter.price = { $lte: intent.entities.maxPrice };
    }
    
    if (intent.entities.minPrice) {
      filter.price = { ...filter.price, $gte: intent.entities.minPrice };
    }

    let products: any[] = await Product.find(filter).limit(10).lean();
    
    if (products.length === 0) {
      const keywords = query.toLowerCase().split(' ');
      products = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: keywords.join('|'), $options: 'i' } },
          { description: { $regex: keywords.join('|'), $options: 'i' } }
        ]
      }).limit(10).lean();
    }

    res.json({
      success: true,
      query,
      intent: intent.type,
      filters: intent.entities,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==================== PRODUCT RECOMMENDATIONS ====================
router.post('/recommend', async (req: express.Request, res: express.Response) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const recommendations: any[] = await Product.find({
      isActive: true,
      $or: [
        { category: product.category },
        { fabricType: product.fabricType }
      ],
      _id: { $ne: productId }
    }).limit(5).lean();

    res.json({
      success: true,
      message: `Found ${recommendations.length} similar products`,
      product,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== PRODUCT COMPARISON ====================
router.post('/compare', async (req: express.Request, res: express.Response) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 product IDs' });
    }
    
    const products: any[] = await Product.find({
      _id: { $in: productIds },
      isActive: true
    }).lean();

    res.json({
      success: true,
      message: `Comparing ${products.length} products`,
      count: products.length,
      products,
      comparison: products.map((p: any) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        category: p.category,
        fabricType: p.fabricType,
        stock: p.stock,
        colors: p.colors || [],
        description: p.description?.substring(0, 100) || ''
      }))
    });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== FABRIC RECOMMENDATIONS BY USE CASE ====================
router.post('/fabric-recommendations', async (req: express.Request, res: express.Response) => {
  try {
    const { useCase, budget, quantity } = req.body;

    let filter: any = { isActive: true };
    
    if (useCase) {
      const useCaseKeywords = useCase.toLowerCase().split(' ');
      filter.$or = [
        { category: { $regex: useCaseKeywords.join('|'), $options: 'i' } },
        { fabricType: { $regex: useCaseKeywords.join('|'), $options: 'i' } },
        { description: { $regex: useCaseKeywords.join('|'), $options: 'i' } }
      ];
    }

    if (budget) {
      const [min, max] = budget.split('-').map(Number);
      if (min && max) {
        filter.price = { $gte: min, $lte: max };
      }
    }

    const recommendations: any[] = await Product.find(filter).limit(10).lean();

    res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error('Fabric recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ==================== AI HEALTH CHECK ====================
router.get('/health', (req: express.Request, res: express.Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  res.json({
    status: 'OK',
    groq: apiKey ? 'Configured ✅' : 'Not Configured ❌',
    keyPrefix: apiKey ? apiKey.substring(0, 5) + '...' : 'None',
    keyLength: apiKey ? apiKey.length : 0,
    keyFormat: apiKey ? (apiKey.startsWith('gsk_') ? 'Valid format ✅' : 'Invalid format ❌') : 'N/A',
    timestamp: new Date().toISOString(),
  });
});

export default router;